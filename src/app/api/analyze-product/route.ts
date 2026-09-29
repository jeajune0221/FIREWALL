import { NextResponse } from "next/server";
import { getImage, putImage } from "@/lib/imageStore";
import { getModel, getOpenAI } from "@/lib/openai";
import { getPatternListForVision, isValidPatternId } from "@/lib/patterns";
import { isColorId, isProductTypeId, isVisualFeatureId } from "@/lib/taxonomy";
import { buildVisionJsonSchema, VISION_SYSTEM_PROMPT } from "@/lib/prompts";
import type {
  AnalyzeProductResponse,
  ColorId,
  Confidence,
  ProductTypeId,
  VisualFeatureId,
} from "@/types";
import { NO_PATTERN } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_COLORS = 3;
const MAX_FEATURES = 4;
const MAX_CANDIDATES = 3;

function uniqueValid<T extends string>(
  raw: unknown,
  guard: (value: unknown) => value is T,
  limit: number,
): T[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<T>();
  for (const item of raw) {
    if (guard(item) && !seen.has(item)) {
      seen.add(item);
      if (seen.size >= limit) break;
    }
  }
  return [...seen];
}

function normalizeCandidates(raw: unknown): AnalyzeProductResponse["pattern_candidates"] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const result: AnalyzeProductResponse["pattern_candidates"] = [];

  for (const item of raw as { pattern_id?: unknown; confidence?: unknown }[]) {
    const id = typeof item?.pattern_id === "string" ? item.pattern_id.trim() : "";
    // 목록에 없는 문양 이름을 지어내면 버린다. (DEV.md Rule 1)
    if (id === "" || (id !== NO_PATTERN && !isValidPatternId(id)) || seen.has(id)) {
      continue;
    }
    const confidence = item?.confidence;
    if (confidence !== "high" && confidence !== "medium" && confidence !== "low") {
      continue;
    }
    seen.add(id);
    result.push({ pattern_id: id, confidence: confidence as Confidence });
    if (result.length >= MAX_CANDIDATES) break;
  }

  return result;
}

/**
 * 입력은 두 가지를 받는다.
 * - image: multipart 파일 (DEV.md 29번 항목의 원래 계약)
 * - image_id: 먼저 업로드해 둔 사진의 id (DESIGN.md 27번 항목의 세션 모델)
 */
async function readImage(
  request: Request,
): Promise<{ bytes: Buffer; contentType: string; imageId: string } | { error: string }> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return { error: "INVALID_REQUEST" };
  }

  const imageId = formData.get("image_id");
  if (typeof imageId === "string" && imageId.trim() !== "") {
    const stored = await getImage(imageId.trim());
    if (!stored) return { error: "IMAGE_NOT_FOUND" };
    return {
      bytes: stored.bytes,
      contentType: stored.contentType,
      imageId: imageId.trim(),
    };
  }

  const value = formData.get("image");
  if (!(value instanceof File)) return { error: "IMAGE_REQUIRED" };
  if (!ALLOWED_TYPES.includes(value.type)) return { error: "UNSUPPORTED_IMAGE_TYPE" };
  if (value.size > MAX_BYTES) return { error: "IMAGE_TOO_LARGE" };

  const bytes = Buffer.from(await value.arrayBuffer());
  return {
    bytes,
    contentType: value.type,
    imageId: await putImage(bytes, value.type),
  };
}

export async function POST(request: Request) {
  const source = await readImage(request);
  if ("error" in source) {
    const status = source.error === "IMAGE_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: source.error }, { status });
  }

  const dataUrl = `data:${source.contentType};base64,${source.bytes.toString("base64")}`;
  const patternList = getPatternListForVision();

  try {
    const response = await getOpenAI().responses.create({
      model: getModel(),
      temperature: 0,
      input: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Pattern list you may choose from (pattern_id must be one of these "id" values, or "NONE"):\n${JSON.stringify(
                patternList,
                null,
                2,
              )}`,
            },
            { type: "input_image", image_url: dataUrl, detail: "high" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "product_analysis",
          schema: buildVisionJsonSchema(patternList.map(pattern => pattern.id)),
          strict: true,
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as Record<string, unknown>;

    const result: AnalyzeProductResponse = {
      // 사진은 서버가 들고, 클라이언트는 id만 보관한다. (DESIGN.md 27번 항목)
      image_id: source.imageId,
      shape: typeof parsed.shape === "string" ? parsed.shape : "not visible",
      surface_and_glaze: typeof parsed.surface_and_glaze === "string" ? parsed.surface_and_glaze : "not visible",
      decoration_layout: typeof parsed.decoration_layout === "string" ? parsed.decoration_layout : "not visible",
      composition: typeof parsed.composition === "string" ? parsed.composition : "not visible",
      decoration_elements: Array.isArray(parsed.decoration_elements) ? parsed.decoration_elements.filter((item): item is { description: string; location: string } => typeof item?.description === "string" && typeof item?.location === "string") : [],
      product_type: isProductTypeId(parsed.product_type)
        ? (parsed.product_type as ProductTypeId)
        : "UNKNOWN",
      main_colors: uniqueValid<ColorId>(parsed.main_colors, isColorId, MAX_COLORS),
      visual_features: uniqueValid<VisualFeatureId>(
        parsed.visual_features,
        isVisualFeatureId,
        MAX_FEATURES,
      ),
      pattern_candidates: normalizeCandidates(parsed.pattern_candidates),
    };

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "OPENAI_API_KEY_MISSING") {
      return NextResponse.json({ error: "OPENAI_API_KEY_MISSING" }, { status: 500 });
    }
    console.error("[analyze-product]", error);
    return NextResponse.json({ error: "VISION_FAILED" }, { status: 502 });
  }
}
