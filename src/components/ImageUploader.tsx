"use client";

import { useRef, useState } from "react";
import { ACCEPTED_IMAGE_INPUT, ApiRequestError, prepareImage } from "@/lib/api";
import type { CopyDict } from "@/lib/copy";
import { SecondaryButton } from "@/components/ui";

type Props = {
  copy: CopyDict;
  disabled?: boolean;
  previewUrl: string | null;
  onSelect: (dataUrl: string, type: string) => void;
};

export function ImageUploader({ copy, previewUrl, onSelect, disabled = false }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreparing(true);
    try {
      const prepared = await prepareImage(file);
      onSelect(prepared.dataUrl, prepared.type);
    } catch (caught) {
      const code = caught instanceof ApiRequestError ? caught.code : "UNKNOWN";
      setError(
        code === "UNSUPPORTED_IMAGE_TYPE"
          ? copy.unsupportedType
          : copy.imageDecodeFailed,
      );
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 사진 선택 후에는 잘리지 않도록 contain (DESIGN.md 8번 항목) */}
      <div className="upload-canvas relative flex w-full items-center justify-center overflow-hidden rounded-[20px] border border-line">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="px-5 py-5 text-center">
            <svg className="pottery-art" viewBox="0 0 240 180" fill="none" aria-hidden="true">
              <ellipse cx="120" cy="158" rx="82" ry="9" fill="#d7cebd" />
              <path d="M35 148V70a85 85 0 0 1 170 0v78" stroke="#d6ccbb" />
              <path d="M84 27h44v24c0 15 34 30 34 62 0 29-18 44-56 44s-56-15-56-44c0-32 34-47 34-62V27Z" fill="#b76c4e" />
              <path d="M91 34v20c0 21-29 34-29 60 0 20 10 29 27 33" stroke="#d49472" strokeWidth="5" strokeLinecap="round" />
              <ellipse cx="106" cy="27" rx="22" ry="5" fill="#874f3c" />
              <ellipse cx="106" cy="27" rx="15" ry="2" fill="#593f33" />
              <path d="M66 93c24 8 54 8 79 0M58 109c29 9 66 9 96 0M60 125c28 9 62 9 91 0" stroke="#eac6a2" strokeWidth="2" />
              <path d="M151 114h56c-2 29-12 42-28 42s-26-13-28-42Z" fill="#526958" />
              <ellipse cx="179" cy="114" rx="28" ry="7" fill="#7e8b72" />
              <ellipse cx="179" cy="114" rx="21" ry="3" fill="#3d5445" />
              <path d="M165 128c2 9 5 14 9 17" stroke="#87967c" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-body-lg font-semibold">{copy.photoTitle}</p>
            <p className="mx-auto mt-2 max-w-[290px] text-body text-text-secondary">{copy.photoBody}</p>
          </div>
        )}
        {preparing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 text-body text-text-secondary">
            {copy.preparingImage}
          </div>
        ) : null}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_INPUT}
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_INPUT}
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <SecondaryButton disabled={disabled || preparing} onClick={() => cameraInputRef.current?.click()}>
          {previewUrl ? copy.retakePhoto : copy.takePhoto}
        </SecondaryButton>
        <SecondaryButton disabled={disabled || preparing} onClick={() => galleryInputRef.current?.click()}>
          {previewUrl ? copy.changePhoto : copy.chooseFromGallery}
        </SecondaryButton>
      </div>

      {error ? (
        <p className="text-body text-danger" role="alert">
          {error}
        </p>
      ) : (
        <div className="photo-guide"><span aria-hidden>↗</span><div><p className="text-caption font-medium">{copy.photoTips}</p><p className="mt-1 text-caption text-text-secondary">{copy.supportedFormats}</p></div></div>
      )}
    </div>
  );
}
