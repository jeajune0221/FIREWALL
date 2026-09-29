"use client";
import { useEffect, useState } from "react";
import type { Exhibit } from "@/lib/exhibits";
import type { Language, PatternListItem } from "@/types";
import { LANGUAGES } from "@/types";
import { PatternReferences } from "@/components/PatternReferences";
import { copyFor } from "@/lib/copy";

export function VisitorScreen({ id, patterns }: { id: string; patterns: PatternListItem[] }) {
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [language, setLanguage] = useState<Language>("vi");
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const response = await fetch(`/api/exhibits/${id}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("unavailable");
        setExhibit(await response.json()); setError(false);
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) timer = setTimeout(refresh, 3000); }
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [id]);
  const content = exhibit?.content[language];
  const pattern = patterns.find(item => item.id === exhibit?.patternId);
  const labels = language === "ko" ? { title: "작품 이야기", story: "작가의 이야기", unavailable: "아직 이 언어의 소개가 공개되지 않았습니다.", loading: "작품을 불러오는 중…", error: "작품을 불러올 수 없습니다. 잠시 후 자동으로 다시 시도합니다.", references: "출처 있는 참고 자료" } : language === "zh" ? { title: "一件作品，一个故事", story: "匠人的故事", unavailable: "尚未发布此语言的介绍。", loading: "正在加载作品…", error: "暂时无法更新，稍后自动重试。", references: "有来源的参考资料（英文原文）" } : language === "en" ? { title: "The story of this piece", story: "The artisan’s story", unavailable: "This language has not been published yet.", loading: "Loading the piece…", error: "Unable to refresh. Retrying shortly.", references: "Sourced references" } : { title: "Câu chuyện của tác phẩm", story: "Lời kể của nghệ nhân", unavailable: "Nội dung ngôn ngữ này chưa được công bố.", loading: "Đang tải tác phẩm…", error: "Không thể cập nhật. Sẽ tự thử lại.", references: "Tài liệu tham khảo có nguồn" };
  const copy = { ...copyFor(language === "ko" ? "ko" : "vi"), ...(language === "zh" ? { referencesTitle: labels.references, noReference: "暂无有来源的参考资料。", descriptionLabel: "纹样介绍", patternMeaningTitle: "文化含义", originLabel: "起源", worksLabel: "参考作品" } : language === "en" ? { referencesTitle: labels.references, noReference: "No sourced reference material is available yet.", descriptionLabel: "Pattern description", patternMeaningTitle: "Cultural meaning", originLabel: "Origin", worksLabel: "Reference works" } : {}) };
  return <main className="flex flex-1 flex-col pb-8">
    <header className="safe-top flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 pb-4"><span className="brand-name">pottery. story</span><div className="flex gap-1">{LANGUAGES.map(lang => <button key={lang} aria-pressed={language === lang} onClick={() => setLanguage(lang)} className={`min-h-11 min-w-11 rounded-xl text-caption uppercase ${language === lang ? "bg-primary text-white" : "bg-surface"}`}>{lang}</button>)}</div></header>
    <div className="space-y-5 px-5 pt-6">
      <p className="eyebrow">DIGITAL CRAFT CARD</p><p className="text-caption text-text-secondary">One product. One maker. One story.</p>
      {error ? <p role="status" className="text-caption text-danger">{labels.error}</p> : null}
      {!exhibit ? <p role="status">{error ? "" : labels.loading}</p> : <>
        <img src={`/api/image/${exhibit.imageId}`} alt={content?.productTitle ?? labels.title} className="max-h-[420px] w-full rounded-2xl bg-surface object-contain" />
        {content ? <><h1 className="text-h1">{content.productTitle}</h1>{exhibit.makerName ? <p className="text-body text-primary">{exhibit.makerName}</p> : null}<p className="text-body-lg text-text-secondary">{content.shortDescription}</p><p className="whitespace-pre-line leading-8">{content.productDescription}</p>{content.artisanStory ? <section className="story-prompt"><h2 className="eyebrow">{labels.story}</h2><p className="mt-3 whitespace-pre-line text-body-lg">{content.artisanStory}</p></section> : null}</> : <p>{labels.unavailable}</p>}
        {pattern ? <div className="rounded-card border border-line bg-surface"><h2 className="p-4 text-h2">{pattern[`name_${language === "zh" ? "en" : language}`]}</h2><PatternReferences pattern={pattern} language={language === "zh" ? "en" : language} copy={copy} /></div> : null}
      </>}
    </div>
  </main>;
}
