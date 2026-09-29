import { randomBytes, randomUUID, createHash, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import type { GeneratedContent, Language } from "@/types";

// Persistent volume required in production; never put write credentials in public responses.
const root = process.env.POTTERY_DATA_DIR || join(process.cwd(), ".pottery-data");
export type Exhibit = { makerName?: string; id: string; imageId: string; patternId: string; content: Partial<Record<Language, GeneratedContent>>; updatedAt: string };
type StoredExhibit = Exhibit & { tokenHash: string };
export const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export const dataRoot = root;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export async function readExhibit(id: string): Promise<StoredExhibit | null> {
  if (!validId(id)) return null;
  try { return JSON.parse(await readFile(join(root, "exhibits", `${id}.json`), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export function publicExhibit(record: StoredExhibit): Exhibit {
  const { tokenHash: _, ...exhibit } = record;
  return exhibit;
}
export function canEdit(record: StoredExhibit, token: string) {
  return timingSafeEqual(Buffer.from(record.tokenHash, "hex"), Buffer.from(digest(token), "hex"));
}
async function write(record: StoredExhibit) {
  const folder = join(root, "exhibits");
  await mkdir(folder, { recursive: true });
  const temp = join(folder, `${record.id}.${randomUUID()}.tmp`);
  await writeFile(temp, JSON.stringify(record), { mode: 0o600 });
  await rename(temp, join(folder, `${record.id}.json`));
}
export async function createExhibit(input: Omit<Exhibit, "id" | "updatedAt">) {
  const token = randomBytes(32).toString("hex");
  const record = { ...input, id: randomUUID(), updatedAt: new Date().toISOString(), tokenHash: digest(token) };
  await write(record);
  return { ...publicExhibit(record), token };
}
export async function updateExhibit(record: StoredExhibit, input: Omit<Exhibit, "id" | "updatedAt">) {
  const updated = { ...record, ...input, updatedAt: new Date().toISOString() };
  await write(updated);
  return publicExhibit(updated);
}
