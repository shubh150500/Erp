import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Allowed image types for payment-proof screenshots. */
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type SavedFile = { ok: true; url: string } | { ok: false; error: string };

/**
 * Validate and save an uploaded image to `public/uploads/<subdir>/`.
 * Returns the public URL (e.g. `/uploads/payment-proofs/<file>.jpg`) on success.
 * Local-disk storage — fine for dev; swap for object storage in production.
 */
export async function saveImageUpload(
  file: File | null,
  subdir: string,
  namePrefix = ""
): Promise<SavedFile> {
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Please choose an image file." };
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return { ok: false, error: "Only JPG, PNG or WebP images are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }

  return writeUpload(file, ext, subdir, namePrefix);
}

/** Allowed document types — PDFs plus images — for study material / attachments. */
const ALLOWED_DOCS: Record<string, string> = {
  ...ALLOWED,
  "application/pdf": "pdf",
};

const MAX_DOC_BYTES = 15 * 1024 * 1024; // 15 MB

export type SavedDoc =
  | { ok: true; url: string; ext: string }
  | { ok: false; error: string };

/**
 * Validate and save an uploaded document (PDF/JPG/PNG/WebP) to
 * `public/uploads/<subdir>/`. Returns the public URL and extension on success.
 */
export async function saveDocumentUpload(
  file: File | null,
  subdir: string,
  namePrefix = ""
): Promise<SavedDoc> {
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Please choose a file." };
  }
  const ext = ALLOWED_DOCS[file.type];
  if (!ext) {
    return { ok: false, error: "Only PDF, JPG, PNG or WebP files are allowed." };
  }
  if (file.size > MAX_DOC_BYTES) {
    return { ok: false, error: "File must be 15 MB or smaller." };
  }
  const saved = await writeUpload(file, ext, subdir, namePrefix);
  return { ok: true, url: saved.url, ext };
}

/** Shared writer: persists the file under public/uploads and returns its URL. */
async function writeUpload(
  file: File,
  ext: string,
  subdir: string,
  namePrefix: string
): Promise<{ ok: true; url: string }> {
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const safePrefix = namePrefix.replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `${safePrefix ? safePrefix + "-" : ""}${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return { ok: true, url: `/uploads/${subdir}/${filename}` };
}
