import { NextResponse } from "next/server";
import { getOpenAI, getSttModel } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  let audio: File | null = null;

  try {
    const formData = await request.formData();
    const value = formData.get("audio");
    if (value instanceof File) {
      audio = value;
    }
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  if (!audio) {
    return NextResponse.json({ error: "AUDIO_REQUIRED" }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ error: "EMPTY_AUDIO" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "AUDIO_TOO_LARGE" }, { status: 400 });
  }

  try {
    const transcription = await getOpenAI().audio.transcriptions.create({
      file: audio,
      model: getSttModel(),
      // 장인의 기본 사용 언어 (DEV.md 16번 항목)
      language: "vi",
    });

    const text = transcription.text?.trim() ?? "";
    if (text === "") {
      return NextResponse.json({ error: "TRANSCRIPTION_EMPTY" }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof Error && error.message === "OPENAI_API_KEY_MISSING") {
      return NextResponse.json({ error: "OPENAI_API_KEY_MISSING" }, { status: 500 });
    }
    console.error("[transcribe]", error);
    return NextResponse.json({ error: "TRANSCRIPTION_FAILED" }, { status: 502 });
  }
}
