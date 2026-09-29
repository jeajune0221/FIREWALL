"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SpeechPlayer } from "@/components/SpeechPlayer";
import { ContentEditor } from "@/components/ContentEditor";
import { PublishExhibit } from "@/components/PublishExhibit";
import { CopyButton } from "@/components/CopyButton";
import { LoadingBlock, Notice, PrimaryButton, ScreenHeader, SecondaryButton } from "@/components/ui";
import { ApiRequestError, generateContent } from "@/lib/api";
import { copyFor } from "@/lib/copy";
import { useSession } from "@/lib/session";
import type { GeneratedContent, Language, PatternListItem } from "@/types";
import { LANGUAGES, NO_PATTERN } from "@/types";

/** 결과 본문 라벨은 콘텐츠 언어를 따른다. */
const FIELD_LABELS: Record<Language, { title: string; short: string; full: string }> = {
  vi: { title: "Tên sản phẩm", short: "Mô tả ngắn", full: "Mô tả sản phẩm" },
  en: { title: "Product name", short: "Short description", full: "Product description" },
  ko: { title: "상품명", short: "짧은 소개", full: "제품 설명" },
};

type TabKey = "product" | "story" | "culture" | "social";

function buildFullCopy(content: GeneratedContent, language: Language): string {
  const labels = FIELD_LABELS[language];
  return [
    `[${labels.title}]\n${content.productTitle}`,
    `[${labels.short}]\n${content.shortDescription}`,
    `[${labels.full}]\n${content.productDescription}`,
  ].join("\n\n");
}

export function ResultScreen({ patterns }: { patterns: PatternListItem[] }) {
  const router = useRouter();
  const {
    imageId,
    hydrated,
    hasAnalysis,
    uiLanguage,
    productTypeId,
    colorIds,
    visualFeatureIds,
    patternId,
    artisanStoryOriginal,
    selectedContentLanguage,
    generatedContentCache,
    setContentLanguage,
    cacheContent,
    clearContentCache,
  } = useSession();
  const copy = copyFor(uiLanguage);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("product");
  const requestedRef = useRef<Set<Language>>(new Set());

  const content = generatedContentCache[selectedContentLanguage];
  const pattern =
    patternId && patternId !== NO_PATTERN
      ? patterns.find((item) => item.id === patternId)
      : undefined;

  const generate = useCallback(
    async (target: Language) => {
      if (productTypeId === null || patternId === null) return;
      setError(null);
      setPending(true);
      try {
        const result = await generateContent({
          observation: { productTypeId, colorIds, visualFeatureIds },
          confirmedPatternId: patternId,
          artisanStory: artisanStoryOriginal,
          language: target,
        });
        cacheContent(target, result);
      } catch (caught) {
        const code = caught instanceof ApiRequestError ? caught.code : "UNKNOWN";
        requestedRef.current.delete(target);
        // 입력 데이터는 유지한다. (DEV.md 35번 항목)
        setError(code === "OPENAI_API_KEY_MISSING" ? copy.apiKeyMissing : copy.generateFailed);
      } finally {
        setPending(false);
      }
    },
    [
      productTypeId,
      colorIds,
      visualFeatureIds,
      patternId,
      artisanStoryOriginal,
      cacheContent,
      copy,
    ],
  );

  useEffect(() => {
    if (hydrated && (!hasAnalysis || patternId === null)) {
      router.replace("/");
    }
  }, [hydrated, hasAnalysis, patternId, router]);

  useEffect(() => {
    if (!hydrated || !hasAnalysis || patternId === null) return;
    if (generatedContentCache[selectedContentLanguage]) return;
    if (requestedRef.current.has(selectedContentLanguage)) return;
    requestedRef.current.add(selectedContentLanguage);
    void generate(selectedContentLanguage);
  }, [
    hydrated,
    hasAnalysis,
    patternId,
    generatedContentCache,
    selectedContentLanguage,
    generate,
  ]);

  // 문양이 NONE이면 문화 탭을 숨긴다. (DESIGN.md 22번 항목)
  const tabs: { key: TabKey; label: string }[] = [
    { key: "product", label: copy.tabProduct },
    { key: "story", label: copy.tabStory },
    ...(pattern?.has_verified_culture ? [{ key: "culture" as TabKey, label: copy.tabCulture }] : []),
    { key: "social", label: copy.tabSocial },
  ];

  const labels = FIELD_LABELS[selectedContentLanguage];
  const meaning = pattern
    ? selectedContentLanguage === "ko"
      ? pattern.meaning_ko
      : selectedContentLanguage === "en"
        ? pattern.meaning_en
        : pattern.meaning_vi
    : "";

  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader
        backHref="/story"
        backLabel={copy.back}
        right={
          /* 언어는 Segmented Control (DESIGN.md 23번 항목) */
          <div className="flex rounded-[12px] border border-line bg-surface p-0.5">
            {LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                aria-pressed={selectedContentLanguage === language}
                disabled={pending}
                onClick={() => setContentLanguage(language)}
                className={`h-10 min-w-11 rounded-[10px] px-2 text-caption font-semibold uppercase disabled:opacity-40 ${
                  selectedContentLanguage === language
                    ? "bg-primary text-white"
                    : "text-text-secondary"
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex flex-1 flex-col px-5 pt-4">
        {/* DESIGN.md 20번 항목 — 게시 전 확인 안내 */}
        <div className="result-intro">
          <h1 className="text-h2 text-text-primary">{copy.resultNoticeTitle}</h1>
          <p className="pt-1 text-body text-text-secondary">{copy.resultNoticeBody}</p>

        </div>

        {/* 결과 탭은 Underline Tab */}
        <div role="tablist" className="result-tabs">
          {tabs.map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`font-medium ${
                tab === item.key
                  ? "text-text-primary"
                  : "text-text-secondary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="field-help">{{ product: copy.productHelp, story: copy.storyResultHelp, culture: copy.cultureHelp, social: copy.socialHelp }[tab]}</p>
        <div className="flex flex-1 flex-col gap-3 pt-4">
          {error ? (
            <div className="flex flex-col gap-3">
              <Notice tone="error">{error}</Notice>
              <PrimaryButton
                onClick={() => {
                  requestedRef.current.add(selectedContentLanguage);
                  void generate(selectedContentLanguage);
                }}
              >
                {copy.retry}
              </PrimaryButton>
              <SecondaryButton onClick={() => router.push("/story")}>
                {copy.editStory}
              </SecondaryButton>
            </div>
          ) : null}

          {!error && pending ? <LoadingBlock title={copy.generating} /> : null}

          {!error && !pending && content ? (
            <>
              {tab === "product" ? (
                <>
                  <Field label={labels.title} value={content.productTitle} copy={copy} large />
                  <Field label={labels.short} value={content.shortDescription} copy={copy} />
                  <Field label={labels.full} value={content.productDescription} copy={copy} />
                  <CopyButton
                    copy={copy}
                    variant="block"
                    text={buildFullCopy(content, selectedContentLanguage)}
                  />
                </>
              ) : null}

              {tab === "story" ? (
                <>
                  {/* 원문은 사용자 입력값에서 가져온다. (DESIGN.md 18번 항목) */}
                  <section className="result-field">
                    <h2 className="pb-2 text-caption font-medium text-text-secondary">
                      {copy.storyOriginal}
                    </h2>
                    {artisanStoryOriginal.trim() !== "" ? (
                      <p className="whitespace-pre-line text-body-lg text-text-primary">
                        “{artisanStoryOriginal.trim()}”
                      </p>
                    ) : (
                      <p className="text-body text-text-secondary">{copy.storyEmpty}</p>
                    )}
                  </section>
                  <Field
                    label={copy.storyPolished}
                    value={content.artisanStory}
                    copy={copy}
                  />
                </>
              ) : null}

              {tab === "culture" && pattern?.has_verified_culture ? (
                <section className="result-field">
                  <h2 className="text-body-lg font-semibold text-text-primary">
                    {pattern[`name_${selectedContentLanguage}`]}
                  </h2>
                  {meaning.trim() !== "" ? (
                    <>
                      <p className="whitespace-pre-line pt-2 text-body-lg text-text-primary">
                        {meaning}
                      </p>
                      <p className="pt-3 text-caption text-text-secondary">
                        {copy.cultureFromDb}
                      </p>
                      {pattern.source_url ? (
                        <p className="pt-1 text-caption text-text-secondary">
                          {copy.patternSource}:{" "}
                          <a
                            href={pattern.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            {pattern.source_url}
                          </a>
                        </p>
                      ) : null}
                      <div className="pt-4">
                        <CopyButton copy={copy} text={meaning} />
                      </div>
                    </>
                  ) : (
                    <p className="pt-2 text-body text-text-secondary">
                      {copy.patternNoCulture}
                    </p>
                  )}
                </section>
              ) : null}

              {tab === "social" ? (
                <Field label={copy.tabSocial} value={content.socialPost} copy={copy} />
              ) : null}
            </>
          ) : null}

          {!pending && content ? <><ContentEditor content={content} language={selectedContentLanguage} uiLanguage={uiLanguage} onChange={next => cacheContent(selectedContentLanguage, next)} /><PublishExhibit key={imageId} /></> : null}

          {/* DESIGN.md 20·24번 항목 — 수정 경로와 다시 생성 */}
          {!pending && content ? (
            <div className="safe-bottom mt-auto flex flex-col gap-2 pt-6">
              <div className="flex gap-2">
                <SecondaryButton onClick={() => router.push("/verify")}>
                  {copy.editPattern}
                </SecondaryButton>
                <SecondaryButton onClick={() => router.push("/story")}>
                  {copy.editStory}
                </SecondaryButton>
              </div>
              <SecondaryButton
                onClick={() => {
                  clearContentCache();
                  requestedRef.current.clear();
                  requestedRef.current.add(selectedContentLanguage);
                  void generate(selectedContentLanguage);
                }}
              >
                {copy.regenerate}
              </SecondaryButton>
            </div>
          ) : null}

          {!pending && content ? (
            <SpeechPlayer
              language={selectedContentLanguage}
              text={
                tab === "culture"
                  ? meaning
                  : tab === "social"
                    ? content.socialPost
                    : tab === "story"
                      ? content.artisanStory
                      : [content.productTitle, content.shortDescription, content.productDescription].join("\n\n")
              }
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  copy,
  large = false,
}: {
  label: string;
  value: string;
  copy: ReturnType<typeof copyFor>;
  large?: boolean;
}) {
  if (value.trim() === "") return null;
  return (
    <section className="result-field">
      <div className="flex items-start justify-between gap-3">
        <h2 className="pt-1 text-caption font-medium text-text-secondary">{label}</h2>
        <CopyButton copy={copy} text={value} />
      </div>
      <p
        className={`whitespace-pre-line pt-2 text-text-primary ${
          large ? "text-h2" : "text-body-lg"
        }`}
      >
        {value}
      </p>
    </section>
  );
}
