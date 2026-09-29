import OpenAI from "openai";

let client: OpenAI | null = null;

/** API Key는 Backend 환경 변수에만 저장한다. (DEV.md 28번 항목) */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

export function getSttModel(): string {
  return process.env.OPENAI_STT_MODEL || "whisper-1";
}
