"use client";
import { useEffect, useRef, useState } from "react";
import { copyFor } from "@/lib/copy";
import type { UiLanguage, VisualObservation } from "@/types";

const labels = {
  ko: { loading: "관찰 내용을 한국어로 번역하고 있어요…", error: "번역하지 못했습니다. 다시 시도해주세요.", unknown: "사진에서 확인할 수 없음" },
  en: { loading: "Translating observations into English…", error: "Could not translate. Please try again.", unknown: "Not visible in the photo" },
  vi: { loading: "Đang dịch các quan sát…", error: "Không thể dịch. Hãy thử lại.", unknown: "Không quan sát được từ ảnh" },
};
export function TranslatedObservation({ observation, language }: { observation: VisualObservation | null; language: UiLanguage }) {
  const copy = copyFor(language);
  const cache = useRef(new Map<string, VisualObservation>());
  const [result, setResult] = useState<{ key: string; value: VisualObservation } | null>(null);
  const [errorKey, setErrorKey] = useState("");
  const [retry, setRetry] = useState(0);
  const source = JSON.stringify(observation);
  const key = `${language}:${source}`;
  useEffect(() => {
    if (!observation || language === "vi") return;
    const cached = cache.current.get(key);
    if (cached) { setResult({ key, value: cached }); return; }
    const controller = new AbortController();
    setErrorKey("");
    void fetch("/api/translate-observation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ observation: JSON.parse(source), language }), signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (!controller.signal.aborted) { cache.current.set(key, data.observation); setResult({ key, value: data.observation }); } })
      .catch(() => { if (!controller.signal.aborted) setErrorKey(key); });
    return () => controller.abort();
  }, [source, language, key, retry, observation]);
  const value = language === "vi" ? observation : result?.key === key ? result.value : null;
  const display = (text?: string) => !text || text === "not visible" ? labels[language].unknown : text;
  return <section className="rounded-card border border-line bg-surface p-5" lang={language}>
    <h2 className="text-h2">{copy.observationsTitle}</h2><p className="field-help">{copy.observationLimit}</p>
    {!value && observation ? <div role="status" className="mt-4 text-body">{errorKey === key ? <>{labels[language].error}<button className="mt-3 block min-h-11 rounded-xl border border-line px-4" onClick={() => setRetry(value => value + 1)}>{copy.retry}</button></> : labels[language].loading}</div> : <dl className="mt-4 space-y-4">
      {([[copy.shapeLabel, value?.shape], [copy.surfaceLabel, value?.surface_and_glaze], [copy.layoutLabel, value?.decoration_layout], [copy.compositionLabel, value?.composition]] as const).map(([label, text]) => <div key={label}><dt className="text-caption text-text-secondary">{label}</dt><dd className="mt-1 whitespace-pre-line">{display(text)}</dd></div>)}
      <div><dt className="text-caption text-text-secondary">{copy.elementsLabel}</dt><dd>{value?.decoration_elements.length ? <ul className="mt-1 space-y-2">{value.decoration_elements.map((item, index) => <li key={index}>{display(item.description)} · {display(item.location)}</li>)}</ul> : display()}</dd></div>
    </dl>}
  </section>;
}
