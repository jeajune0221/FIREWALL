"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TranslatedObservation } from "@/components/TranslatedObservation";
import { ObservationEditor } from "@/components/ObservationEditor";
import { PatternSelector } from "@/components/PatternSelector";
import { LoadingBlock, PrimaryButton, ScreenHeader } from "@/components/ui";
import { copyFor } from "@/lib/copy";
import { useSession } from "@/lib/session";
import type { PatternListItem } from "@/types";

export function VerifyScreen({ patterns }: { patterns: PatternListItem[] }) {
  const router = useRouter();
  const {
    observation,
    hydrated,
    hasAnalysis,
    previewUrl,
    uiLanguage,
    productTypeId,
    colorIds,
    visualFeatureIds,
    patternCandidates,
    patternId,
    setProductType,
    setColorIds,
    setVisualFeatureIds,
    setPatternId,
    setStep,
  } = useSession();
  const copy = copyFor(uiLanguage);

  useEffect(() => {
    if (hydrated && !hasAnalysis) {
      router.replace("/");
    }
  }, [hydrated, hasAnalysis, router]);

  if (!hydrated || !hasAnalysis || productTypeId === null) {
    return (
      <main className="flex flex-1 flex-col">
        <ScreenHeader backHref="/" backLabel={copy.back} progress={0.6} />
        <div className="px-5">
          <LoadingBlock title={copy.analyzingTitle} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader
        title={copy.observationHeading}
        backHref="/"
        backLabel={copy.back}
        progress={0.6}
      />

      <div className="flex flex-1 flex-col gap-7 px-5 pt-5">
        <div className="verification-summary">
          {previewUrl ? <img src={previewUrl} alt={copy.photoStep} className="h-24 w-20 shrink-0 rounded-xl bg-white object-contain" /> : null}
          <p className="text-body text-text-secondary">{copy.verifyIntro}</p>
        </div>
        <TranslatedObservation observation={observation} language={uiLanguage} />
        <ObservationEditor
          copy={copy}
          uiLanguage={uiLanguage}
          productTypeId={productTypeId}
          colorIds={colorIds}
          visualFeatureIds={visualFeatureIds}
          onProductTypeChange={setProductType}
          onColorsChange={setColorIds}
          onFeaturesChange={setVisualFeatureIds}
        />

        <div>
          <h2 className="pb-3 text-h2 text-text-primary">{copy.patternHeading}</h2>
          <p className="pb-4 text-body text-text-secondary">{copy.patternIntro}</p>
          <PatternSelector
            copy={copy}
            uiLanguage={uiLanguage}
            candidates={patternCandidates}
            patterns={patterns}
            value={patternId}
            onChange={setPatternId}
          />
        </div>

        <div className="safe-bottom mt-auto flex flex-col gap-2 pt-2">
          {/* 초기에는 아무것도 선택하지 않고, 선택 전에는 Disabled (DESIGN.md 12번 항목) */}
          {patternId === null ? (
            <p className="text-center text-body text-text-secondary">
              {copy.patternSelectHint}
            </p>
          ) : null}
          <PrimaryButton
            disabled={patternId === null}
            onClick={() => {
              setStep("story");
              router.push("/story");
            }}
          >
            {copy.continueConfirmed}
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}
