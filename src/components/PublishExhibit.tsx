"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useSession } from "@/lib/session";
import { PrimaryButton } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { copyFor } from "@/lib/copy";

export function PublishExhibit() {
  const { imageId, patternId, generatedContentCache, uiLanguage } = useSession();
  const ko = uiLanguage === "ko";
  const en = uiLanguage === "en";
  const [published, setPublished] = useState<{ id: string; token: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [origin, setOrigin] = useState("");
  const [makerName, setMakerName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [qr, setQr] = useState("");
  const busy = useRef(false);
  const payload = JSON.stringify({ imageId, patternId, content: generatedContentCache, makerName });
  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      setPublished(JSON.parse(sessionStorage.getItem(`exhibit:${imageId}`) || "null"));
      setMakerName(sessionStorage.getItem(`maker:${imageId}`) || "");
    } catch { /* Continue without browser persistence. */ }
  }, [imageId]);
  useEffect(() => { setConfirmed(false); setStatus("idle"); }, [payload]);
  const url = published ? `${origin}/exhibit/${published.id}` : "";
  useEffect(() => {
    let active = true;
    setQr("");
    if (url) void QRCode.toDataURL(url, { width: 360, margin: 4, errorCorrectionLevel: "M" }).then(value => { if (active) setQr(value); }).catch(() => { if (active) setQr(""); });
    return () => { active = false; };
  }, [url]);
  async function save() {
    if (busy.current || !confirmed || !Object.keys(generatedContentCache).length) return;
    busy.current = true;
    setStatus("saving");
    try {
      const response = await fetch(published ? `/api/exhibits/${published.id}` : "/api/exhibits", {
        method: published ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...(published ? { Authorization: `Bearer ${published.token}` } : {}) },
        body: payload,
      });
      if (!response.ok) throw new Error("publish failed");
      const result = await response.json();
      if (!published) {
        const credential = { id: result.id, token: result.token };
        setPublished(credential);
        try { sessionStorage.setItem(`exhibit:${imageId}`, JSON.stringify(credential)); } catch { /* Current page can still update. */ }
      }
      try { sessionStorage.setItem(`maker:${imageId}`, makerName); } catch { /* Optional persistence. */ }
      setStatus("saved");
    } catch { setStatus("error"); }
    finally { busy.current = false; }
  }
  const languages = Object.keys(generatedContentCache).join(" / ").toUpperCase();
  return <section className="result-field my-4 space-y-4">
    <p className="eyebrow">DIGITAL CRAFT CARD + QR</p>
    <h2 className="text-body-lg font-semibold">{ko ? "확인한 이야기를 고객에게" : en ? "Share your reviewed story" : "Chia sẻ câu chuyện đã kiểm tra"}</h2>
    <p className="text-caption text-text-secondary">{ko ? "최종 글을 확인하고 게시하세요. 게시된 카드만 QR로 공개되며, 이후 수정도 다시 게시해야 반영됩니다." : en ? "Review the final text, then publish. The QR shows published content; later edits must be published again." : "Kiểm tra rồi công bố. QR chỉ hiển thị nội dung đã công bố; bản chỉnh sửa cần được công bố lại."}</p>
    <label className="block text-caption">{ko ? "장인 이름 / 공방명 (선택)" : en ? "Artisan / studio name (optional)" : "Tên nghệ nhân / xưởng (tùy chọn)"}<input maxLength={100} value={makerName} disabled={status === "saving"} onChange={event => setMakerName(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-line px-3" /></label>
    <label className="flex min-h-12 items-start gap-3 rounded-xl bg-background p-3 text-caption"><input type="checkbox" checked={confirmed} disabled={status === "saving"} onChange={event => setConfirmed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" /><span>{ko ? `${languages} 문구의 사실·표현을 확인했으며, 사진과 이야기를 공개합니다.` : en ? `I have reviewed the facts and wording in ${languages} and agree to publish the photo and story.` : `Tôi đã kiểm tra nội dung ${languages} và đồng ý công bố ảnh, câu chuyện.`}</span></label>
    <PrimaryButton disabled={!confirmed || status === "saving" || status === "saved"} onClick={() => void save()}>{status === "saving" ? (ko ? "게시 중…" : en ? "Publishing\u2026" : "Đang công bố…") : published ? (ko ? "확인한 수정 내용 게시" : en ? "Publish reviewed changes" : "Công bố bản đã sửa") : (ko ? "확인 후 게시 · QR 만들기" : en ? "Publish and create QR" : "Công bố và tạo mã QR")}</PrimaryButton>
    <p role="status" className="text-caption">{status === "saved" ? (ko ? "게시했습니다. 관람객 화면은 3초 이내 갱신됩니다." : en ? "Published. The visitor page updates within 3 seconds." : "Đã công bố. Trang khách cập nhật trong 3 giây.") : status === "error" ? (ko ? "게시하지 못했습니다. 다시 시도해주세요." : en ? "Could not publish. Please try again." : "Không thể công bố. Hãy thử lại.") : ""}</p>
    {published ? <div className="space-y-3 border-t border-line pt-4">
      <a className="block text-primary underline" href={url} target="_blank" rel="noreferrer">{ko ? "관람객 카드 열기 ↗" : en ? "Open visitor card \u2197" : "Mở thẻ tác phẩm ↗"}</a>
      {qr ? <><img src={qr} width={240} height={240} alt={ko ? "작품 페이지 QR 코드" : en ? "QR code for the piece" : "Mã QR trang tác phẩm"} className="mx-auto" /><a href={qr} download={`craft-card-${published.id}.png`} className="flex min-h-11 items-center justify-center rounded-xl border border-line">{ko ? "QR 이미지 저장" : en ? "Save QR image" : "Tải ảnh QR"}</a></> : <p className="text-caption">{ko ? "QR을 표시할 수 없으면 아래 링크를 복사해주세요." : en ? "If the QR is unavailable, copy the link below." : "Nếu không có QR, hãy sao chép liên kết bên dưới."}</p>}
      <CopyButton copy={copyFor(uiLanguage)} text={url} />
    </div> : null}
  </section>;
}
