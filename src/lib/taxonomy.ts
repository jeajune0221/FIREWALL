import taxonomyData from "@/data/taxonomy.json";
import type {
  ColorId,
  Language,
  ProductTypeId,
  TaxonomyTerm,
  UiLanguage,
  VisualFeatureId,
} from "@/types";
import { COLOR_IDS, PRODUCT_TYPE_IDS, VISUAL_FEATURE_IDS } from "@/types";

const taxonomy = taxonomyData as {
  product_types: TaxonomyTerm[];
  colors: TaxonomyTerm[];
  visual_features: TaxonomyTerm[];
};

export const PRODUCT_TYPES = taxonomy.product_types;
export const COLORS = taxonomy.colors;
export const VISUAL_FEATURES = taxonomy.visual_features;

function byId(terms: TaxonomyTerm[]) {
  return new Map(terms.map((term) => [term.id, term]));
}

const productTypeMap = byId(PRODUCT_TYPES);
const colorMap = byId(COLORS);
const featureMap = byId(VISUAL_FEATURES);

/** 화면에는 ID 대신 VI / EN / KO 이름을 표시한다. (DESIGN.md 10번 항목) */
export function label(
  term: TaxonomyTerm | undefined,
  language: Language | UiLanguage,
): string {
  if (!term) return "";
  return (language === "en" || language === "zh") ? term.en : language === "ko" ? term.ko : term.vi;
}

export function productTypeLabel(
  id: ProductTypeId,
  language: Language | UiLanguage,
): string {
  return label(productTypeMap.get(id), language);
}

export function colorLabel(id: ColorId, language: Language | UiLanguage): string {
  return label(colorMap.get(id), language);
}

export function colorHex(id: ColorId): string {
  return colorMap.get(id)?.hex ?? "#CCCCCC";
}

export function featureLabel(
  id: VisualFeatureId,
  language: Language | UiLanguage,
): string {
  return label(featureMap.get(id), language);
}

export function isProductTypeId(value: unknown): value is ProductTypeId {
  return PRODUCT_TYPE_IDS.includes(value as ProductTypeId);
}

export function isColorId(value: unknown): value is ColorId {
  return COLOR_IDS.includes(value as ColorId);
}

export function isVisualFeatureId(value: unknown): value is VisualFeatureId {
  return VISUAL_FEATURE_IDS.includes(value as VisualFeatureId);
}
