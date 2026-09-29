import { VerifyScreen } from "@/components/VerifyScreen";
import { getPatternList } from "@/lib/patterns";

export default function VerifyPage() {
  // 문양 목록은 로컬 JSON이므로 서버에서 바로 넘긴다.
  return <VerifyScreen patterns={getPatternList()} />;
}
