"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/ImageUploader";
import { PrimaryButton, ScreenHeader } from "@/components/ui";
import { ApiRequestError, uploadImage } from "@/lib/api";
import { copyFor } from "@/lib/copy";
import { useSession } from "@/lib/session";

export default function UploadPage() {
  const router = useRouter();
  const { uiLanguage, setUiLanguage, previewUrl, setPreview, setImageId, imageId } =
    useSession();
  const copy = copyFor(uiLanguage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(dataUrl: string, type: string) {
    setError(null);
    setUploading(true);
    setImageId(null);
    // 미리보기는 업로드가 끝나기 전에도 보여준다.
    setPreview(dataUrl);
    try {
      const uploadedId = await uploadImage(dataUrl, type);
      setImageId(uploadedId);
      setPreview(`/api/image/${uploadedId}`);
    } catch (caught) {
      const code = caught instanceof ApiRequestError ? caught.code : "UNKNOWN";
      setError(code === "UNSUPPORTED_IMAGE_TYPE" ? copy.unsupportedType : copy.imageDecodeFailed);
      setImageId(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <ScreenHeader
        right={
          <button
            type="button"
            onClick={() => setUiLanguage(uiLanguage === "vi" ? "ko" : "vi")}
            className="h-11 rounded-full border border-line bg-surface px-3 text-caption font-medium text-text-secondary"
          >
            {copy.uiLanguageToggle}
          </button>
        }
      />

      <div className="flex flex-1 flex-col px-5">
        <div className="upload-intro">
          <p className="eyebrow">{copy.studioLabel}</p>
          <h1 className="hero-heading">{copy.uploadHeading}</h1>
          <p className="mt-3 text-body text-text-secondary">{copy.uploadIntro}</p>
        </div>

        <ImageUploader
          copy={copy}
          disabled={uploading}
          previewUrl={previewUrl}
          onSelect={(dataUrl, type) => void handleSelect(dataUrl, type)}
        />

        {error ? (
          <p className="pt-3 text-body text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="action-dock safe-bottom mt-auto pt-4">
          <PrimaryButton
            disabled={imageId === null || uploading}
            onClick={() => router.push("/analyze")}
          >
            {uploading ? copy.uploadingImage : copy.startAnalysis}<span aria-hidden>↗</span>
          </PrimaryButton>
          <p className="mt-2 text-center text-caption text-text-secondary">{copy.uploadNext}</p>
        </div>
      </div>
    </main>
  );
}
