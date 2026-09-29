/** 콘텐츠 언어 (DESIGN.md 23·26번 항목) */
export const LANGUAGES = ["vi", "en", "ko", "zh"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "vi";

/** 앱 UI 언어. 콘텐츠 언어와 별개다. (DESIGN.md 26번 항목) */
export const UI_LANGUAGES = ["vi", "ko"] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];
export const DEFAULT_UI_LANGUAGE: UiLanguage = "vi";

/** 등록된 문양 중 일치하는 것이 없을 때 (DEV.md 6번 항목) */
export const NO_PATTERN = "NONE";

export type Confidence = "high" | "medium" | "low";

/** DESIGN.md 10번 항목 — AI는 정해진 ID 안에서만 관찰한다. */
export const PRODUCT_TYPE_IDS = [
  "VASE",
  "BOWL",
  "PLATE",
  "CUP",
  "JAR",
  "TEAPOT",
  "FIGURINE",
  "OTHER",
  "UNKNOWN",
] as const;
export type ProductTypeId = (typeof PRODUCT_TYPE_IDS)[number];

export const COLOR_IDS = [
  "WHITE",
  "BLACK",
  "GRAY",
  "BLUE",
  "GREEN",
  "RED",
  "YELLOW",
  "BROWN",
  "BEIGE",
  "PURPLE",
] as const;
export type ColorId = (typeof COLOR_IDS)[number];

export const VISUAL_FEATURE_IDS = [
  "FLORAL_DECORATION",
  "GEOMETRIC_DECORATION",
  "ANIMAL_DECORATION",
  "SYMMETRICAL_PATTERN",
  "GLOSSY_SURFACE",
  "MATTE_SURFACE",
  "RELIEF_DECORATION",
] as const;
export type VisualFeatureId = (typeof VISUAL_FEATURE_IDS)[number];

export type TaxonomyTerm = {
  id: string;
  vi: string;
  en: string;
  ko: string;
  hex?: string;
};

export type PatternSource = {
  organization: string;
  title: string;
  url: string;
};

export type PatternImageSource = {
  url: string;
  license: string;
};

/** DESIGN.md 15번 항목 */
export type PatternOrigin = { text_vi: string | null; text_en: string | null; text_ko: string | null; source: PatternSource | null };
export type RepresentativeWork = { title: string; holder: string; date: string; source_url: string };
export type VisualObservation = {
  shape: string;
  surface_and_glaze: string;
  decoration_layout: string;
  decoration_elements: { description: string; location: string }[];
  composition: string;
};
export type Pattern = {
  description_vi: string | null;
  description_en: string | null;
  description_ko: string | null;
  origin: PatternOrigin | null;
  representative_works: RepresentativeWork[] | null;

  id: string;
  name_vi: string;
  name_en: string;
  name_ko: string;
  meaning_vi: string;
  meaning_en: string;
  meaning_ko: string;
  image_url: string | null;
  image_source: PatternImageSource | null;
  source: PatternSource | null;
  verified_at: string | null;
};

/** 화면에 내려주는 문양 정보 */
export type PatternListItem = {
  description_vi: string | null;
  description_en: string | null;
  description_ko: string | null;
  origin: PatternOrigin | null;
  representative_works: RepresentativeWork[] | null;
  source: PatternSource | null;

  id: string;
  name_vi: string;
  name_en: string;
  name_ko: string;
  meaning_vi: string;
  meaning_en: string;
  meaning_ko: string;
  image_url: string | null;
  source_url: string | null;
  /** 출처가 확인된 문화 정보가 있는지 (DEV.md 13번 항목) */
  has_verified_culture: boolean;
};

export type PatternCandidate = {
  patternId: string;
  confidence: Confidence;
};

/** Vision이 관찰한 결과 */
export type ProductAnalysis = {
  observation: VisualObservation;
  productTypeId: ProductTypeId;
  colorIds: ColorId[];
  visualFeatureIds: VisualFeatureId[];
  patternCandidates: PatternCandidate[];
};

/** 장인이 확인·수정한 관찰 결과 (DESIGN.md 11번 항목) */
export type ConfirmedObservation = {
  productTypeId: ProductTypeId;
  colorIds: ColorId[];
  visualFeatureIds: VisualFeatureId[];
};

/** DESIGN.md 21번 항목 — 문화 설명은 AI가 만들지 않으므로 필드가 없다. */
export type GeneratedContent = {
  productTitle: string;
  shortDescription: string;
  productDescription: string;
  artisanStory: string;
  socialPost: string;
};

export type AnalyzeProductResponse = VisualObservation & {
  image_id: string;
  product_type: ProductTypeId;
  main_colors: ColorId[];
  visual_features: VisualFeatureId[];
  pattern_candidates: { pattern_id: string; confidence: Confidence }[];
};

export type GenerateContentRequest = {
  product: {
    type: ProductTypeId;
    colors: ColorId[];
    visual_features: VisualFeatureId[];
  };
  confirmed_pattern_id: string;
  artisan_story: string;
  target_language: Language;
};

export type GenerateContentResponse = {
  product_title: string;
  short_description: string;
  product_description: string;
  artisan_story: string;
  social_post: string;
};

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}
