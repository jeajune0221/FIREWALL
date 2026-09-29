import type { GeneratedContent, Language } from "@/types";
import { LANGUAGES, NO_PATTERN } from "@/types";
import { isValidPatternId } from "@/lib/patterns";
import { validId } from "@/lib/exhibits";
export function parseExhibitInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_EXHIBIT");
  const input = value as Record<string, unknown>;
  if (typeof input.imageId !== "string" || !validId(input.imageId) || typeof input.patternId !== "string" || (input.patternId !== NO_PATTERN && !isValidPatternId(input.patternId))) throw new Error("INVALID_EXHIBIT");
  if (!input.content || typeof input.content !== "object") throw new Error("INVALID_EXHIBIT");
  const content: Partial<Record<Language, GeneratedContent>> = {};
  for (const language of LANGUAGES) {
    const raw = (input.content as Record<string, unknown>)[language];
    if (raw === undefined) continue;
    if (!raw || typeof raw !== "object") throw new Error("INVALID_EXHIBIT");
    const item = raw as Record<string, unknown>;
    const fields = ["productTitle", "shortDescription", "productDescription", "artisanStory", "socialPost"] as const;
    if (fields.some(key => typeof item[key] !== "string" || (item[key] as string).length > 12000) || !(item.productTitle as string).trim()) throw new Error("INVALID_EXHIBIT");
    content[language] = Object.fromEntries(fields.map(key => [key, item[key]])) as GeneratedContent;
  }
  if (!Object.keys(content).length) throw new Error("INVALID_EXHIBIT");
  if (input.makerName !== undefined && (typeof input.makerName !== "string" || input.makerName.length > 100)) throw new Error("INVALID_EXHIBIT");
  return { makerName: typeof input.makerName === "string" ? input.makerName.trim() : "", imageId: input.imageId, patternId: input.patternId, content };
}
