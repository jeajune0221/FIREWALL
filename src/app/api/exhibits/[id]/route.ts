import { NextResponse } from "next/server";
import { canEdit, publicExhibit, readExhibit, updateExhibit } from "@/lib/exhibits";
import { parseExhibitInput } from "@/lib/exhibitInput";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Context) {
  const record = await readExhibit((await context.params).id);
  return NextResponse.json(record ? publicExhibit(record) : { error: "NOT_FOUND" }, { status: record ? 200 : 404, headers: { "Cache-Control": "no-store" } });
}
export async function PUT(request: Request, context: Context) {
  const record = await readExhibit((await context.params).id);
  if (!record) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!canEdit(record, request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "")) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const text = await request.text();
    if (text.length > 200000) return NextResponse.json({ error: "TOO_LARGE" }, { status: 413 });
    const input = parseExhibitInput(JSON.parse(text));
    if (input.imageId !== record.imageId) return NextResponse.json({ error: "IMAGE_MISMATCH" }, { status: 400 });
    return NextResponse.json(await updateExhibit(record, input), { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 400 }); }
}
