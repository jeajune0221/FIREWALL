import { NextResponse } from "next/server";
import { createExhibit } from "@/lib/exhibits";
import { parseExhibitInput } from "@/lib/exhibitInput";
import { getImage } from "@/lib/imageStore";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > 200000) return NextResponse.json({ error: "TOO_LARGE" }, { status: 413 });
    const input = parseExhibitInput(JSON.parse(text));
    if (!await getImage(input.imageId)) return NextResponse.json({ error: "IMAGE_NOT_FOUND" }, { status: 404 });
    return NextResponse.json(await createExhibit(input), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "PUBLISH_FAILED" }, { status: 400 }); }
}
