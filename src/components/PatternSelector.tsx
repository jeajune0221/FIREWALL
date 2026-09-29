"use client";

import { useEffect, useState } from "react";
import type { CopyDict } from "@/lib/copy";
import type {
  Confidence,
  PatternCandidate,
  PatternListItem,
  UiLanguage,
} from "@/types";
import { PatternReferences } from "@/components/PatternReferences";
import { NO_PATTERN } from "@/types";

function patternName(pattern: PatternListItem, language: UiLanguage) {
  return pattern[`name_${language}`];
}

const motifGlyphs: Record<string, string> = {
  P01: "🪷", P02: "🐉", P03: "🎋", P04: "☁", P05: "🐟",
  P06: "🕊", P07: "𓅃", P08: "✿", P09: "❀", P10: "🌲",
  P11: "♧", P12: "〰", P13: "🦚", P14: "🐢", P15: "◇",
  P16: "◆", P17: "壽", P18: "⌁", P19: "🌾", P20: "𓆦",
};

/** DESIGN.md 14번 항목 — 썸네일. image_url이 없으면 중립 자리표시자. */
function Thumbnail({ pattern }: { pattern: PatternListItem }) {
  const [failed, setFailed] = useState(false);
  if (pattern.image_url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={pattern.image_url}
        loading="lazy"
        onError={() => setFailed(true)}
        alt=""
        className="h-14 w-14 shrink-0 rounded-[10px] border border-line object-cover"
      />
    );
  }
  // 출처 이미지가 없는 항목은 실제 유물처럼 보이지 않는 상징 아이콘으로 구분한다.
  return (
    <span
      aria-hidden
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] border border-line bg-background text-2xl font-semibold text-primary"
    >
      {motifGlyphs[pattern.id] ?? "◇"}
    </span>
  );
}

function PatternDetailSheet({
  pattern,
  copy,
  uiLanguage,
  onClose,
}: {
  pattern: PatternListItem;
  copy: CopyDict;
  uiLanguage: UiLanguage;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 배경 탭으로도 닫히지만, 접근성 이름은 아래 닫기 버튼 하나만 갖는다. */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-text-primary/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={patternName(pattern, uiLanguage)}
        className="safe-bottom relative w-full max-h-[85dvh] overflow-y-auto max-w-[480px] rounded-t-[24px] border border-line bg-surface px-5 pt-5"
      >
        <div className="flex items-start gap-3">
          <Thumbnail pattern={pattern} />
          <div className="min-w-0 flex-1">
            <p className="text-h2 text-text-primary">
              {patternName(pattern, uiLanguage)}
            </p>
          </div>
        </div>

        <div className="-mx-5 mt-5">
          <PatternReferences pattern={pattern} language={uiLanguage} copy={copy} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 h-[52px] w-full rounded-[12px] border border-line text-body-lg font-semibold text-text-primary"
        >
          {copy.close}
        </button>
      </div>
    </div>
  );
}

function PatternCard({
  pattern,
  confidenceLabel,
  confidenceTone,
  selected,
  onSelect,
  onDetail,
  detailLabel,
  uiLanguage,
}: {
  pattern: PatternListItem;
  confidenceLabel?: string;
  confidenceTone?: "high" | "medium";
  selected: boolean;
  onSelect: () => void;
  onDetail: () => void;
  detailLabel: string;
  uiLanguage: UiLanguage;
}) {
  return (
    <div
      className={`rounded-[12px] border bg-surface ${
        selected ? "border-primary" : "border-line"
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <Thumbnail pattern={pattern} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-lg font-semibold text-text-primary">
            {patternName(pattern, uiLanguage)}
          </span>
          {confidenceLabel ? (
            <span
              className={`mt-1 inline-block text-caption ${
                confidenceTone === "high" ? "text-accent" : "text-text-secondary"
              }`}
            >
              {confidenceLabel}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-primary" : "border-line"
          }`}
        >
          {selected ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
        </span>
      </button>
      {pattern.has_verified_culture ? <div className="border-t border-line">
        <button
          type="button"
          onClick={onDetail}
          className="flex h-11 w-full items-center justify-center text-caption text-text-secondary"
        >
          {detailLabel} ›
        </button>
      </div> : null}
    </div>
  );
}

type Props = {
  copy: CopyDict;
  uiLanguage: UiLanguage;
  candidates: PatternCandidate[];
  patterns: PatternListItem[];
  value: string | null;
  onChange: (patternId: string | null) => void;
};

export function PatternSelector({
  copy,
  uiLanguage,
  candidates,
  patterns,
  value,
  onChange,
}: Props) {
  const byId = new Map(patterns.map((pattern) => [pattern.id, pattern]));

  // Show all confidence levels; NONE keeps the existing dedicated radio.
  const shown = candidates.filter((candidate) => candidate.patternId !== NO_PATTERN);
  const hasCandidates = shown.length > 0;
  const allLow = hasCandidates && shown.every(candidate => candidate.confidence === "low");

  const [showAll, setShowAll] = useState(!hasCandidates || allLow);
  const [detailId, setDetailId] = useState<string | null>(null);

  const confidenceLabel = (confidence: Confidence) =>
    confidence === "high" ? copy.confidenceHigh : confidence === "medium" ? copy.confidenceMedium : copy.confidenceLow;

  const detailPattern = detailId ? byId.get(detailId) : undefined;

  return (
    <div role="radiogroup" aria-label={copy.patternHeading} className="flex flex-col gap-3">
      {allLow ? (
        <p className="rounded-[12px] border border-line bg-surface p-4 text-body text-text-secondary">
          {copy.allLowTitle}
        </p>
      ) : null}

      {!hasCandidates ? (
        <p className="rounded-[12px] border border-line bg-surface p-4 text-body text-text-secondary">
          {copy.noCandidatesTitle}
        </p>
      ) : null}

      {shown.map((candidate) => {
        const pattern = byId.get(candidate.patternId);
        if (!pattern) return null;
        return (
          <PatternCard
            key={candidate.patternId}
            pattern={pattern}
            uiLanguage={uiLanguage}
            confidenceLabel={confidenceLabel(candidate.confidence)}
            confidenceTone={candidate.confidence === "high" ? "high" : "medium"}
            selected={value === candidate.patternId}
            onSelect={() => onChange(candidate.patternId)}
            onDetail={() => setDetailId(candidate.patternId)}
            detailLabel={copy.patternDetail}
          />
        );
      })}

      {!showAll ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="h-[52px] w-full rounded-[12px] border border-line bg-surface text-body-lg font-medium text-text-primary"
        >
          {copy.showAllPatterns}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {patterns
            .filter((pattern) => !shown.some((c) => c.patternId === pattern.id))
            .map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                uiLanguage={uiLanguage}
                selected={value === pattern.id}
                onSelect={() => onChange(pattern.id)}
                onDetail={() => setDetailId(pattern.id)}
                detailLabel={copy.patternDetail}
              />
            ))}
        </div>
      )}

      <button
        type="button"
        role="radio"
        aria-checked={value === NO_PATTERN}
        onClick={() => onChange(NO_PATTERN)}
        className={`flex min-h-[52px] w-full items-center gap-3 rounded-[12px] border bg-surface px-4 text-left text-body-lg ${
          value === NO_PATTERN ? "border-primary" : "border-line"
        }`}
      >
        <span
          aria-hidden
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            value === NO_PATTERN ? "border-primary" : "border-line"
          }`}
        >
          {value === NO_PATTERN ? (
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          ) : null}
        </span>
        <span>{copy.noPattern}{candidates.find(candidate => candidate.patternId === NO_PATTERN) ? <span className="block text-caption text-text-secondary">{confidenceLabel(candidates.find(candidate => candidate.patternId === NO_PATTERN)!.confidence)}</span> : null}</span>
      </button>

      <p className="text-caption text-text-secondary">{copy.freeInputNotice}</p>

      {detailPattern ? (
        <PatternDetailSheet
          pattern={detailPattern}
          copy={copy}
          uiLanguage={uiLanguage}
          onClose={() => setDetailId(null)}
        />
      ) : null}
    </div>
  );
}
