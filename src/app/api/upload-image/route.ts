import { NextResponse } from "next/server";
import { putImage } from "@/lib/imageStore";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * 사진을 서버에 올리고 image_id만 돌려준다.
 * 클라이언트는 이 id와 미리보기 URL만 sessionStorage에 보관한다. (DESIGN.md 27번 항목)
 */
export async function POST(request: Request) {
  let image: File | null = null;

  try {
    const formData = await request.formData();
    const value = formData.get("image");
    if (value instanceof File) image = value;
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  if (!image) {
    return NextResponse.json({ error: "IMAGE_REQUIRED" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(image.type)) {
    return NextResponse.json({ error: "UNSUPPORTED_IMAGE_TYPE" }, { status: 400 });
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 400 });
  }

  const bytes = Buffer.from(await image.arrayBuffer());
  return NextResponse.json({ image_id: await putImage(bytes, image.type) });
}
