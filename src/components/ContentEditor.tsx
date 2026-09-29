"use client";
import type { GeneratedContent, Language, UiLanguage } from "@/types";
export function ContentEditor({ content, language, uiLanguage, onChange }: { content: GeneratedContent; language: Language; uiLanguage: UiLanguage; onChange: (content: GeneratedContent) => void }) {
  const ko = uiLanguage === "ko";
  const en = uiLanguage === "en";
  const fields: [keyof GeneratedContent, string][] = [
    ["productTitle", ko ? "상품명" : en ? "Product name" : "Tên tác phẩm"], ["shortDescription", ko ? "짧은 소개" : en ? "Short description" : "Giới thiệu ngắn"],
    ["productDescription", ko ? "제품 설명" : en ? "Product description" : "Mô tả tác phẩm"], ["artisanStory", ko ? "장인의 이야기" : en ? "Artisan story" : "Câu chuyện nghệ nhân"], ["socialPost", ko ? "SNS 문구" : en ? "Social post" : "Bài đăng mạng xã hội"],
  ];
  return <details className="result-field mt-4">
    <summary className="min-h-11 cursor-pointer font-semibold">{ko ? "게시 전 문구 직접 수정" : en ? "Edit wording before publishing" : "Chỉnh sửa trước khi công bố"} · {language.toUpperCase()}</summary>
    <p className="field-help">{ko ? "틀린 정보나 표현을 고쳐주세요. 아래 게시 버튼을 누르기 전에는 관람객에게 반영되지 않습니다." : en ? "Correct any mistakes. Changes appear to visitors only after you publish them." : "Sửa thông tin và cách diễn đạt. Thay đổi chỉ xuất hiện với khách sau khi nhấn nút công bố."}</p>
    <div className="mt-4 space-y-4">{fields.map(([key, label]) => <label key={key} className="block text-caption text-text-secondary">{label}<textarea lang={language} value={content[key]} maxLength={12000} rows={key === "productTitle" ? 2 : 5} onChange={event => onChange({ ...content, [key]: event.target.value })} className="mt-2 w-full rounded-xl border border-line p-3 text-text-primary" /></label>)}</div>
  </details>;
}
