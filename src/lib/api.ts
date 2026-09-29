import type {
  AnalyzeProductResponse,
  VisualObservation,
  ColorId,
  ConfirmedObservation,
  GeneratedContent,
  GenerateContentRequest,
  GenerateContentResponse,
  Language,
  PatternCandidate,
  ProductTypeId,
  VisualFeatureId,
} from "@/types";

export class ApiRequestError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = "ApiRequestError";
    this.code = code;
  }
}

async function readErrorCode(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

/** DESIGN.md 8번 항목 — HEIC/HEIF도 받고 내부에서 JPEG로 변환한다. */
export const ACCEPTED_IMAGE_INPUT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

const DECODABLE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const MAX_IMAGE_EDGE = 1280;

function isAcceptedFile(file: File): boolean {
  if (DECODABLE_TYPES.includes(file.type)) return true;
  // 일부 브라우저는 HEIC의 MIME 타입을 비워서 준다.
  return file.type === "" && /\.(heic|heif)$/i.test(file.name);
}

/**
 * 업로드 전에 캔버스로 다시 그려 JPEG로 통일한다.
 * HEIC는 브라우저가 디코딩할 수 있을 때만 변환되고, 못 하면 오류로 알린다.
 */
export function prepareImage(file: File): Promise<{ dataUrl: string; type: string }> {
  return new Promise((resolve, reject) => {
    if (!isAcceptedFile(file)) {
      reject(new ApiRequestError("UNSUPPORTED_IMAGE_TYPE"));
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new ApiRequestError("IMAGE_DECODE_FAILED"));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.85), type: "image/jpeg" });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ApiRequestError("IMAGE_DECODE_FAILED"));
    };

    image.src = url;
  });
}

function dataUrlToBlob(dataUrl: string, type: string): Blob {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type });
}

export type AnalysisResult = {
  observation: VisualObservation;
  imageId: string;
  productTypeId: ProductTypeId;
  colorIds: ColorId[];
  visualFeatureIds: VisualFeatureId[];
  patternCandidates: PatternCandidate[];
};

/** 사진을 먼저 올려 image_id를 받는다. (DESIGN.md 27번 항목) */
export async function uploadImage(dataUrl: string, type: string): Promise<string> {
  const formData = new FormData();
  formData.append("image", dataUrlToBlob(dataUrl, type), "product.jpg");

  const response = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiRequestError(await readErrorCode(response));
  }

  const data = (await response.json()) as { image_id: string };
  return data.image_id;
}

export async function analyzeProduct(imageId: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("image_id", imageId);

  const response = await fetch("/api/analyze-product", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiRequestError(await readErrorCode(response));
  }

  const data = (await response.json()) as AnalyzeProductResponse;
  return {
    observation: { shape: data.shape, surface_and_glaze: data.surface_and_glaze, decoration_layout: data.decoration_layout, decoration_elements: data.decoration_elements, composition: data.composition },
    imageId: data.image_id,
    productTypeId: data.product_type,
    colorIds: data.main_colors,
    visualFeatureIds: data.visual_features,
    patternCandidates: data.pattern_candidates.map((candidate) => ({
      patternId: candidate.pattern_id,
      confidence: candidate.confidence,
    })),
  };
}

export async function generateContent(params: {
  observation: ConfirmedObservation;
  confirmedPatternId: string;
  artisanStory: string;
  language: Language;
}): Promise<GeneratedContent> {
  const body: GenerateContentRequest = {
    product: {
      type: params.observation.productTypeId,
      colors: params.observation.colorIds,
      visual_features: params.observation.visualFeatureIds,
    },
    confirmed_pattern_id: params.confirmedPatternId,
    artisan_story: params.artisanStory,
    target_language: params.language,
  };

  const response = await fetch("/api/generate-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiRequestError(await readErrorCode(response));
  }

  const data = (await response.json()) as GenerateContentResponse;
  return {
    productTitle: data.product_title,
    shortDescription: data.short_description,
    productDescription: data.product_description,
    artisanStory: data.artisan_story,
    socialPost: data.social_post,
  };
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const formData = new FormData();
  const extension = audio.type.includes("mp4") ? "mp4" : "webm";
  formData.append("audio", audio, `story.${extension}`);

  const response = await fetch("/api/transcribe", { method: "POST", body: formData });

  if (!response.ok) {
    throw new ApiRequestError(await readErrorCode(response));
  }

  const data = (await response.json()) as { text: string };
  return data.text;
}
