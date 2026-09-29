import { NextResponse } from "next/server";
import { getPatternList } from "@/lib/patterns";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getPatternList());
}
