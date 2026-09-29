import patternsData from "@/data/patterns.json";
import type { Language, Pattern, PatternListItem, PatternSource } from "@/types";
import { NO_PATTERN } from "@/types";

// meaning_*, source, image_url은 조사 담당자가 출처를 확인한 뒤 채운다.
// 비어 있는 동안에는 미검증으로 취급하고 문화 정보를 노출하지 않는다. (DEV.md 13번 항목)
const patterns = patternsData as Pattern[];

/** DEV.md 13: reject unsourced reference material at module load. */
export function validatePatterns(items: Pattern[]): void {
  for (const item of items) {
    const validUrl = (url?: string) => { try { return ["https:", "http:"].includes(new URL(url ?? "").protocol); } catch { return false; } };
    if (item.origin && [item.origin.text_vi, item.origin.text_en, item.origin.text_ko].some(text => text?.trim()) && !validUrl(item.origin.source?.url)) {
      throw new Error(`PATTERN_SOURCE_REQUIRED: ${item.id}.origin`);
    }
    if ([item.description_vi, item.description_en, item.description_ko, item.meaning_vi, item.meaning_en, item.meaning_ko].some(text => text?.trim()) && !validUrl(item.source?.url)) {
      throw new Error(`PATTERN_SOURCE_REQUIRED: ${item.id}.description/meaning`);
    }
    for (const work of item.representative_works ?? []) {
      if (!validUrl(work.source_url)) throw new Error(`PATTERN_SOURCE_REQUIRED: ${item.id}.representative_works`);
    }
  }
}
validatePatterns(patterns);

export function getPatternById(id: string): Pattern | null {
  return patterns.find((pattern) => pattern.id === id) ?? null;
}

export function isValidPatternId(id: string): boolean {
  return getPatternById(id) !== null;
}

function hasSource(source: PatternSource | null): source is PatternSource {
  return source !== null && source.url.trim() !== "";
}

function hasVerifiedCulture(pattern: Pattern): boolean {
  if (!hasSource(pattern.source)) return false;
  return (
    pattern.meaning_vi.trim() !== "" ||
    pattern.meaning_en.trim() !== "" ||
    pattern.meaning_ko.trim() !== ""
  );
}

function toPatternListItem(pattern: Pattern): PatternListItem {
  return {
    description_vi: pattern.description_vi,
    description_en: pattern.description_en,
    description_ko: pattern.description_ko,
    origin: pattern.origin,
    representative_works: pattern.representative_works,
    source: pattern.source,
    id: pattern.id,
    name_vi: pattern.name_vi,
    name_en: pattern.name_en,
    name_ko: pattern.name_ko,
    meaning_vi: pattern.meaning_vi,
    meaning_en: pattern.meaning_en,
    meaning_ko: pattern.meaning_ko,
    image_url: pattern.image_url,
    source_url: hasSource(pattern.source) ? pattern.source.url : null,
    has_verified_culture: hasVerifiedCulture(pattern),
  };
}

export function getPatternList(): PatternListItem[] {
  return patterns.map(toPatternListItem);
}

/** Vision 모델에게 넘기는 목록 (DEV.md 5번 항목) */
export function getPatternListForVision() {
  return patterns.map(({ id, name_vi, name_en, name_ko }) => ({
    id,
    name_vi,
    name_en,
    name_ko,
  }));
}

/**
 * 콘텐츠 생성 프롬프트에 넣는 문양 정보.
 * 의미(meaning)는 넘기지 않는다 — 문화 설명은 AI가 쓰지 않고 DB 값을 화면에 직접 표시한다.
 * (DESIGN.md 21번 항목)
 */
export function getPatternForGeneration(patternId: string, language: Language) {
  if (patternId === NO_PATTERN) return null;
  const pattern = getPatternById(patternId);
  if (!pattern) return null;
  return {
    pattern_id: pattern.id,
    pattern_name: pattern[`name_${language === "zh" ? "en" : language}`] || pattern.name_vi,
    pattern_name_vi: pattern.name_vi,
  };
}
