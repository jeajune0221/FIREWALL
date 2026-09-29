"use client";
import { useEffect, useRef, useState } from "react";
import type { Language } from "@/types";

const copy = {
  ko: { title: "음성으로 듣기", play: "읽어주기", stop: "정지", unavailable: "이 브라우저에 해당 언어의 음성이 없습니다. 기기 음성 설정에서 언어를 추가해주세요.", failed: "음성을 재생하지 못했습니다. 다시 시도해주세요.", help: "선택한 언어의 기기 음성으로 읽습니다." },
  en: { title: "Listen", play: "Read aloud", stop: "Stop", unavailable: "No voice is available for this language. Add one in your device’s speech settings.", failed: "Could not play speech. Please try again.", help: "Reads using your device’s voice for the selected language." },
  vi: { title: "Nghe nội dung", play: "Đọc thành tiếng", stop: "Dừng", unavailable: "Không có giọng đọc cho ngôn ngữ này. Hãy thêm giọng trong cài đặt thiết bị.", failed: "Không thể phát giọng đọc. Hãy thử lại.", help: "Đọc bằng giọng của thiết bị theo ngôn ngữ đã chọn." },
};
const locales = { ko: "ko-KR", en: "en-US", vi: "vi-VN" };
export function SpeechPlayer({ text, language }: { text: string; language: Language }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const run = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const labels = copy[language];
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSupported(true);
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);
  useEffect(() => {
    setPlaying(false); setFailed(false);
    return () => { run.current++; utterance.current = null; if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, [text, language]);
  const voice = voices.find(item => item.lang.replace("_", "-").toLowerCase() === locales[language].toLowerCase()) ?? voices.find(item => item.lang.toLowerCase().split(/[-_]/)[0] === language);
  function stop() { run.current++; window.speechSynthesis.cancel(); utterance.current = null; setPlaying(false); }
  function play() {
    if (!voice) return;
    stop(); setFailed(false); setPlaying(true);
    const token = run.current;
    // Short utterances avoid browser limits on long product descriptions.
    const chunks = text.match(/[^.!?。！？\n]+[.!?。！？\n]*|[.!?。！？\n]+/g)?.flatMap(part => part.match(/[\s\S]{1,180}(?:\s|$)|[\s\S]{1,180}/g) ?? []) ?? [];
    function next(index: number) {
      if (token !== run.current) return;
      if (index >= chunks.length) { setPlaying(false); utterance.current = null; return; }
      const speech = new SpeechSynthesisUtterance(chunks[index]);
      utterance.current = speech; speech.lang = locales[language]; speech.voice = voice!;
      speech.onend = () => next(index + 1);
      speech.onerror = () => { if (token === run.current) { setFailed(true); setPlaying(false); } };
      window.speechSynthesis.speak(speech);
    }
    next(0);
  }
  return <section className="my-4 space-y-3 rounded-xl border border-line bg-surface p-4" lang={language}>
    <h2 className="text-body-lg font-semibold">{labels.title} · {language.toUpperCase()}</h2>
    <p className="text-caption text-text-secondary">{supported && voice ? labels.help : labels.unavailable}</p>
    <button type="button" disabled={!supported || !voice || !text.trim()} onClick={playing ? stop : play} className="min-h-[48px] w-full rounded-xl bg-primary px-4 text-white disabled:opacity-40">{playing ? labels.stop : labels.play}</button>
    {failed ? <p role="alert" className="text-caption text-danger">{labels.failed}</p> : null}
  </section>;
}
