"use client";

import { useState } from "react";
import type { CopyDict } from "@/lib/copy";

type Props = {
  copy: CopyDict;
  text: string;
  variant?: "inline" | "block";
};

/** DESIGN.md 25번 항목 — 성공은 aria-live로 알리고, 실패하면 수동 복사를 안내한다. */
export function CopyButton({ copy, text, variant = "inline" }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("failed");
    }
  }

  const label = state === "copied" ? copy.copied : copy.copy;

  return (
    <div className={variant === "block" ? "w-full" : ""}>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={`flex h-11 items-center justify-center rounded-[12px] border border-line bg-surface px-4 text-caption font-medium text-text-secondary ${
          variant === "block" ? "w-full" : ""
        }`}
      >
        {variant === "block" ? copy.copyAll : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied" ? copy.copied : ""}
      </span>
      {state === "failed" ? (
        <p className="pt-2 text-caption text-danger">{copy.copyFailed}</p>
      ) : null}
    </div>
  );
}
