"use client";

import { useEffect, useRef, useState } from "react";
import { ApiRequestError, transcribeAudio } from "@/lib/api";
import type { CopyDict } from "@/lib/copy";
import { Card, Notice, SecondaryButton } from "@/components/ui";

export const MAX_STORY_LENGTH = 1000;
const MAX_RECORD_SECONDS = 60;

type VoiceState =
  | { kind: "idle" }
  | { kind: "recording"; seconds: number }
  | { kind: "transcribing" }
  | { kind: "review"; text: string }
  | { kind: "merge"; text: string }
  | { kind: "error"; message: string; micBlocked: boolean };

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const type of ["audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

type Props = {
  copy: CopyDict;
  value: string;
  onChange: (value: string) => void;
};

export function StoryInput({ copy, value, onChange }: Props) {
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [voice, setVoice] = useState<VoiceState>({ kind: "idle" });
  const [showMicHelp, setShowMicHelp] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopRecording() {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setVoice({ kind: "transcribing" });
  }

  async function startRecording() {
    setShowMicHelp(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void transcribe(new Blob(chunksRef.current, { type: mimeType ?? "audio/webm" }));
      };

      recorderRef.current = recorder;
      recorder.start();
      setVoice({ kind: "recording", seconds: 0 });

      // 최대 60초 (DESIGN.md 17번 항목)
      timerRef.current = setInterval(() => {
        setVoice((prev) => {
          if (prev.kind !== "recording") return prev;
          const seconds = prev.seconds + 1;
          if (seconds >= MAX_RECORD_SECONDS) {
            stopRecording();
            return { kind: "transcribing" };
          }
          return { kind: "recording", seconds };
        });
      }, 1000);
    } catch {
      // DESIGN.md 28번 항목 — 마이크 오류
      setVoice({ kind: "error", message: copy.micError, micBlocked: true });
    }
  }

  async function transcribe(blob: Blob) {
    try {
      const text = await transcribeAudio(blob);
      // STT 결과를 바로 쓰지 않고 사용자가 확인한다. (DEV.md 17번 항목)
      setVoice({ kind: "review", text });
    } catch (caught) {
      const code = caught instanceof ApiRequestError ? caught.code : "UNKNOWN";
      setVoice({
        kind: "error",
        message: code === "OPENAI_API_KEY_MISSING" ? copy.apiKeyMissing : copy.sttFailed,
        micBlocked: false,
      });
    }
  }

  function applyText(text: string, strategy: "replace" | "append") {
    const next =
      strategy === "append" && value.trim() !== "" ? `${value.trim()}\n${text}` : text;
    onChange(next);
    setVoice({ kind: "idle" });
    setMode("text");
  }

  function switchToText() {
    setVoice({ kind: "idle" });
    setMode("text");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  const length = value.length;
  const over = length > MAX_STORY_LENGTH;

  return (
    <div className="flex flex-col gap-4">
      {/* DESIGN.md 16번 항목 — 입력 방식 선택 */}
      <div className="flex gap-2">
        {(
          [
            ["text", copy.storyTabText],
            ["voice", copy.storyTabVoice],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={mode === key}
            onClick={() => setMode(key)}
            className={`h-11 flex-1 rounded-[12px] border text-body font-medium ${
              mode === key
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={7}
          placeholder={copy.storyPlaceholder}
          className={`w-full resize-none rounded-[12px] border bg-surface p-4 leading-relaxed text-text-primary outline-none placeholder:text-text-secondary/70 ${
            over ? "border-danger" : "border-line focus:border-primary"
          }`}
        />
        <div className="flex items-center justify-between pt-1.5">
          <span className="text-caption text-danger">{over ? copy.storyTooLong : ""}</span>
          <span
            className={`text-caption ${over ? "text-danger" : "text-text-secondary"}`}
          >
            {length} / {MAX_STORY_LENGTH}
          </span>
        </div>
      </div>

      {mode === "voice" ? (
        <div className="flex flex-col gap-3">
          {voice.kind === "idle" ? (
            <>
              <SecondaryButton onClick={() => void startRecording()}>
                ● {copy.recordStart}
              </SecondaryButton>
              <p className="text-center text-caption text-text-secondary">
                {copy.recordMax}
              </p>
            </>
          ) : null}

          {voice.kind === "recording" ? (
            <Card className="flex flex-col gap-4">
              <p className="flex items-center gap-2 text-body-lg text-text-primary">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
                {copy.recording} · {voice.seconds}s / {MAX_RECORD_SECONDS}s
              </p>
              <SecondaryButton onClick={stopRecording}>{copy.recordStop}</SecondaryButton>
            </Card>
          ) : null}

          {voice.kind === "transcribing" ? (
            <Card>
              <p className="text-body text-text-secondary" role="status" aria-live="polite">
                {copy.transcribing}
              </p>
            </Card>
          ) : null}

          {voice.kind === "review" ? (
            <Card className="flex flex-col gap-4">
              <p className="text-body text-text-secondary">{copy.sttHeard}</p>
              <textarea aria-label={copy.sttHeard} value={voice.text} onChange={event => setVoice({ kind: "review", text: event.target.value })} rows={5} className="w-full rounded-[12px] border border-line bg-background p-3 text-body-lg" />
              <div className="flex flex-col gap-2">
                <SecondaryButton onClick={() => void startRecording()}>
                  {copy.recordAgain}
                </SecondaryButton>
                <SecondaryButton
                  disabled={!voice.text.trim() || voice.text.length > MAX_STORY_LENGTH}
                  className="border-primary bg-primary text-white"
                  onClick={() => {
                    // 기존 글이 있으면 합치는 방법을 먼저 묻는다. (DESIGN.md 17번 항목)
                    if (value.trim() !== "") {
                      setVoice({ kind: "merge", text: voice.text });
                    } else {
                      applyText(voice.text, "replace");
                    }
                  }}
                >
                  {copy.useThisText}
                </SecondaryButton>
              </div>
            </Card>
          ) : null}

          {voice.kind === "merge" ? (
            <Card className="flex flex-col gap-2">
              <SecondaryButton onClick={() => applyText(voice.text, "append")}>
                {copy.appendAfter}
              </SecondaryButton>
              <SecondaryButton onClick={() => applyText(voice.text, "replace")}>
                {copy.replaceExisting}
              </SecondaryButton>
              <SecondaryButton onClick={() => setVoice({ kind: "idle" })}>
                {copy.cancel}
              </SecondaryButton>
            </Card>
          ) : null}

          {voice.kind === "error" ? (
            <Notice tone="error">
              <p className="text-body-lg">{voice.message}</p>
              {showMicHelp ? (
                <p className="pt-2 text-body text-text-secondary">{copy.micHelp}</p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2">
                {voice.micBlocked ? (
                  <SecondaryButton onClick={() => setShowMicHelp(true)}>
                    {copy.micHelpButton}
                  </SecondaryButton>
                ) : (
                  <SecondaryButton onClick={() => void startRecording()}>
                    {copy.recordAgain}
                  </SecondaryButton>
                )}
                <SecondaryButton onClick={switchToText}>
                  {copy.typeInstead}
                </SecondaryButton>
              </div>
            </Notice>
          ) : null}
        </div>
      ) : (
        <p className="text-caption text-text-secondary">{copy.voiceOptional}</p>
      )}
    </div>
  );
}
