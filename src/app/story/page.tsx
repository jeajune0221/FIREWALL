"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MAX_STORY_LENGTH, StoryInput } from "@/components/StoryInput";
import { LoadingBlock, PrimaryButton, ScreenHeader } from "@/components/ui";
import { copyFor } from "@/lib/copy";
import { useSession } from "@/lib/session";

export default function StoryPage() {
  const router = useRouter();
  const {
    hydrated,
    hasAnalysis,
    patternId,
    uiLanguage,
    artisanStoryOriginal,
    setArtisanStory,
    setStep,
  } = useSession();
  const copy = copyFor(uiLanguage);
  const ready = hydrated && hasAnalysis && patternId !== null;

  useEffect(() => {
    if (hydrated && (!hasAnalysis || patternId === null)) {
      router.replace("/");
    }
  }, [hydrated, hasAnalysis, patternId, router]);

  if (!ready) {
    return (
      <main className="flex flex-1 flex-col">
        <ScreenHeader backHref="/verify" backLabel={copy.back} progress={0.8} />
        <div className="px-5">
          <LoadingBlock title={copy.analyzingTitle} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader backHref="/verify" backLabel={copy.back} progress={0.8} />

      <div className="flex flex-1 flex-col gap-5 px-5 pt-6">
        <h1 className="text-h1 text-text-primary">{copy.storyHeading}</h1>

        <p className="text-body text-text-secondary">{copy.storyIntro}</p>
        <div className="story-prompt"><span className="eyebrow">{copy.storyStep}</span><p className="mt-2 text-body-lg font-medium">{copy.storyPrompt}</p></div>
        <StoryInput
          copy={copy}
          value={artisanStoryOriginal}
          onChange={setArtisanStory}
        />

        <p className="text-caption text-text-secondary">{copy.storyHelp}</p>
        <div className="safe-bottom mt-auto pt-4">
          {/* 1000자를 넘으면 자르지 않고 CTA만 막는다. (DESIGN.md 16번 항목) */}
          <PrimaryButton
            disabled={artisanStoryOriginal.length > MAX_STORY_LENGTH}
            onClick={() => {
              setStep("result");
              router.push("/result");
            }}
          >
            {copy.createContent}
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}
