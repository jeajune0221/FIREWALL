"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { copyFor } from "@/lib/copy";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** DESIGN.md 6번 항목 — Button Height 52px, Radius 12px, 그림자 대신 Border */
const BUTTON_BASE =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-body font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${BUTTON_BASE} bg-primary text-white hover:bg-primary-hover ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${BUTTON_BASE} border border-line bg-surface text-text-primary ${className}`}
    >
      {children}
    </button>
  );
}

export function ScreenHeader({
  title,
  backHref,
  backLabel = "Back",
  right,
}: {
  title?: string;
  backHref?: string;
  backLabel?: string;
  progress?: number;
  right?: ReactNode;
}) {
  const pathname = usePathname();
  const { uiLanguage } = useSession();
  const copy = copyFor(uiLanguage);
  const active = pathname === "/result" ? 3 : pathname === "/story" ? 2 : pathname === "/verify" || pathname === "/analyze" ? 1 : 0;
  const steps = [copy.photoStep, copy.verifyStep, copy.storyStep, copy.resultStep];
  return (
    <header className="safe-top sticky top-0 z-10 border-b border-line bg-background px-5 pb-4">
      <div className="flex min-h-11 items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="-ml-2 flex h-11 w-11 items-center justify-center text-[22px] leading-none text-text-secondary"
          >
            ‹
          </Link>
        ) : null}
        {title ? (
          <h1 className="min-w-0 flex-1 truncate text-h2 text-text-primary">{title}</h1>
        ) : (
          <span className="brand-name flex-1">pottery<span className="text-accent">.</span><span className={backHref && right ? "hidden min-[380px]:inline" : ""}> story</span></span>
        )}
        {right}
      </div>
      <ol className="step-track" aria-label={uiLanguage === "ko" ? "작업 단계" : "Các bước"}>
        {steps.map((step, index) => (
          <li key={step} aria-current={index === active ? "step" : undefined} className={index <= active ? "is-active" : ""}>
            <span>{index < active ? "✓" : `0${index + 1}`}</span>{step}
          </li>
        ))}
      </ol>
    </header>
  );
}

/** DESIGN.md 9번 항목 — 가짜 단계 Progress 없이 Spinner만 */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`spinner inline-block rounded-full border-[3px] border-line border-t-primary ${className}`}
      aria-hidden
    />
  );
}

export function LoadingBlock({ title, body }: { title: string; body?: string }) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-10 w-10" />
      <p className="text-body-lg font-semibold text-text-primary">{title}</p>
      {body ? (
        <p className="max-w-[280px] text-body text-text-secondary">{body}</p>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[12px] border border-line bg-surface p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function Notice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "error";
  children: ReactNode;
}) {
  const toneClass =
    tone === "error"
      ? "border-danger/30 bg-danger/5 text-text-primary"
      : "border-line bg-surface text-text-secondary";
  return (
    <div className={`rounded-[12px] border p-4 text-body ${toneClass}`}>{children}</div>
  );
}
