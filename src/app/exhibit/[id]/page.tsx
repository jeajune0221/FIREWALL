import { VisitorScreen } from "@/components/VisitorScreen";
import { getPatternList } from "@/lib/patterns";
export default async function ExhibitPage({ params }: { params: Promise<{ id: string }> }) {
  return <VisitorScreen id={(await params).id} patterns={getPatternList()} />;
}
