import { NextResponse } from "next/server";
import { getModel, getOpenAI } from "@/lib/openai";
import { getPatternForGeneration, isValidPatternId } from "@/lib/patterns";
import {
  colorLabel,
  featureLabel,
  isColorId,
  isProductTypeId,
  isVisualFeatureId,
  productTypeLabel,
} from "@/lib/taxonomy";
import {
  GENERATION_JSON_SCHEMA,
  buildGenerationSystemPrompt,
  buildGenerationUserPrompt,
} from "@/lib/prompts";
import type {
  ColorId,
  GenerateContentResponse,
  Language,
  ProductTypeId,
  VisualFeatureId,
} from "@/types";
import { NO_PATTERN, isLanguage } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** DESIGN.md 16번 항목 — 장인 이야기 최대 1000자 */
const MAX_STORY_LENGTH = 1000;

function filterIds<T extends string>(
  raw: unknown,
  guard: (value: unknown) => value is T,
): T[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(guard))];
}

function field(parsed: Record<string, unknown>, key: string): string {
  const value = parsed[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const targetLanguage = body.target_language;
  if (!isLanguage(targetLanguage)) {
    return NextResponse.json({ error: "INVALID_LANGUAGE" }, { status: 400 });
  }
  const language: Language = targetLanguage;

  const rawPatternId = body.confirmed_pattern_id;
  const confirmedPatternId =
    typeof rawPatternId === "string" && rawPatternId.trim() !== ""
      ? rawPatternId.trim()
      : NO_PATTERN;
  // 장인이 확인하지 않은 값이나 DB에 없는 문양은 받지 않는다. (DEV.md Rule 2)
  if (confirmedPatternId !== NO_PATTERN && !isValidPatternId(confirmedPatternId)) {
    return NextResponse.json({ error: "INVALID_PATTERN_ID" }, { status: 400 });
  }

  const rawProduct = (body.product ?? {}) as Record<string, unknown>;
  const productTypeId: ProductTypeId = isProductTypeId(rawProduct.type)
    ? (rawProduct.type as ProductTypeId)
    : "UNKNOWN";
  const colorIds = filterIds<ColorId>(rawProduct.colors, isColorId);
  const featureIds = filterIds<VisualFeatureId>(
    rawProduct.visual_features,
    isVisualFeatureId,
  );

  const rawStory = typeof body.artisan_story === "string" ? body.artisan_story.trim() : "";
  if (rawStory.length > MAX_STORY_LENGTH) {
    return NextResponse.json({ error: "STORY_TOO_LONG" }, { status: 400 });
  }

  try {
    const response = await getOpenAI().responses.create({
      model: getModel(),
      temperature: 0.4,
      input: [
        { role: "system", content: buildGenerationSystemPrompt(language) },
        {
          role: "user",
          content: buildGenerationUserPrompt({
            observation: {
              productTypeId,
              colorIds,
              visualFeatureIds: featureIds,
            },
            observationLabels: {
              product_type: productTypeLabel(productTypeId, language),
              colors: colorIds.map((id) => colorLabel(id, language)),
              visual_features: featureIds.map((id) => featureLabel(id, language)),
            },
            pattern: getPatternForGeneration(confirmedPatternId, language),
            artisanStory: rawStory,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "generated_content",
          schema: GENERATION_JSON_SCHEMA as unknown as Record<string, unknown>,
          strict: true,
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as Record<string, unknown>;

    const result: GenerateContentResponse = {
      product_title: field(parsed, "product_title"),
      short_description: field(parsed, "short_description"),
      product_description: field(parsed, "product_description"),
      artisan_story: field(parsed, "artisan_story"),
      social_post: field(parsed, "social_post"),
    };

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "OPENAI_API_KEY_MISSING") {
      return NextResponse.json({ error: "OPENAI_API_KEY_MISSING" }, { status: 500 });
    }
    console.error("[generate-content]", error);
    return NextResponse.json({ error: "GENERATION_FAILED" }, { status: 502 });
  }
}
