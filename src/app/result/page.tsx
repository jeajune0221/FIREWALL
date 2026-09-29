import { ResultScreen } from "@/components/ResultScreen";
import { getPatternList } from "@/lib/patterns";

export default function ResultPage() {
  return <ResultScreen patterns={getPatternList()} />;
}
