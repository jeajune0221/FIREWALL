import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dataRoot } from "@/lib/exhibits";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Shared persistent storage keeps published exhibit photos available across restarts.
// Configure POTTERY_DATA_DIR to a persistent volume in production.
const DIR = join(dataRoot, "images");

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function putImage(bytes: Buffer, contentType: string): Promise<string> {
  const extension = EXTENSIONS[contentType] ?? "jpg";
  await mkdir(DIR, { recursive: true });

  const id = randomUUID();
  await writeFile(join(DIR, `${id}.${extension}`), bytes);
  return id;
}

export async function getImage(
  id: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  // 경로 조작 방지: id는 UUID 형식만 허용한다.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  for (const [extension, contentType] of Object.entries(CONTENT_TYPES)) {
    try {
      const bytes = await readFile(join(DIR, `${id}.${extension}`));
      return { bytes, contentType };
    } catch {
      // Migrate images from sessions created before persistent storage was added.
      try {
        const bytes = await readFile(join(tmpdir(), "ai-pottery-story-images", `${id}.${extension}`));
        await mkdir(DIR, { recursive: true });
        await writeFile(join(DIR, `${id}.${extension}`), bytes);
        return { bytes, contentType };
      } catch { /* Try the next extension. */ }
    }
  }
  return null;
}
