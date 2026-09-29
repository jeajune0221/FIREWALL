import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

// Runs on Node.js (not Edge) so timingSafeEqual is available.
export const runtime = "nodejs";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const PUBLIC_GET_PATH = new RegExp(`^/(?:exhibit/${UUID}|api/exhibits/${UUID}|api/image/${UUID})$`, "i");

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function isAuthorized(request: NextRequest, password: string) {
  const cookie = request.cookies.get("craft_maker")?.value;
  if (cookie && safeEqual(cookie, password)) return true;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(auth.slice(6), "base64").toString();
  return decoded.startsWith("maker:") && safeEqual(decoded.slice(6), password);
}

// Protects paid OpenAI calls and write endpoints behind a maker password.
// Visitor pages (published exhibit view/data/image) stay public for the QR flow.
export function middleware(request: NextRequest) {
  const password = process.env.MAKER_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isPublicRead = (request.method === "GET" || request.method === "HEAD") && PUBLIC_GET_PATH.test(pathname);
  if (isPublicRead) return NextResponse.next();

  if (!isAuthorized(request, password)) {
    return new NextResponse("Maker sign-in required. Visitors should open their product QR link.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Pottery maker"', "Cache-Control": "no-store" },
    });
  }

  const response = NextResponse.next();
  response.cookies.set("craft_maker", password, { httpOnly: true, secure: true, sameSite: "strict", path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
