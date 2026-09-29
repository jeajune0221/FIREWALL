"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingBlock, Notice, PrimaryButton, ScreenHeader, SecondaryButton } from "@/components/ui";
import { ApiRequestError, analyzeProduct } from "@/lib/api";
import { copyFor } from "@/lib/copy";
import { useSession } from "@/lib/session";

export default function AnalyzePage() {
  const router = useRouter();
  const { hydrated, imageId, uiLanguage, setAnalysis } = useSession();
  const copy = copyFor(uiLanguage);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const run = useCallback(async () => {
    if (!imageId) return;
    setError(null);
    try {
      const result = await analyzeProduct(imageId);
      setAnalysis(result);
      router.replace("/verify");
    } catch (caught) {
      const code = caught instanceof ApiRequestError ? caught.code : "UNKNOWN";
      setError(code === "OPENAI_API_KEY_MISSING" ? copy.apiKeyMissing : copy.analyzeFailed);
    }
  }, [imageId, router, setAnalysis, copy]);

  useEffect(() => {
    if (!hydrated || startedRef.current) return;
    if (!imageId) {
      router.replace("/");
      return;
    }
    startedRef.current = true;
    void run();
  }, [hydrated, imageId, router, run]);

  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader backHref="/" backLabel={copy.back} progress={0.4} />
      <div className="flex flex-1 flex-col px-5 pt-4">
        {error ? (
          <div className="flex flex-col gap-4">
            <Notice tone="error">{error}</Notice>
            {/* DESIGN.md 28번 항목 — 사진 분석 실패 */}
            <PrimaryButton onClick={() => router.replace("/")}>
              {copy.retakePhoto}
            </PrimaryButton>
            <SecondaryButton onClick={() => router.replace("/")}>
              {copy.chooseAnotherPhoto}
            </SecondaryButton>
          </div>
        ) : (
          <LoadingBlock title={copy.analyzingTitle} body={copy.analyzingBody} />
        )}
      </div>
    </main>
  );
}
