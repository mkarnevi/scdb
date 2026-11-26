import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

/**
 * Fork: local-disk image storage, used instead of S3 when IMAGE_STORAGE_DIR
 * is set. Images keep the same keys as on S3 (images/<table>/<file>), are
 * served by app/static/[...key]/route.ts, and NEXT_PUBLIC_STATIC_URL=/static
 * points the site at that route.
 *
 * Uploads mirror S3's presigned POST: the server signs the key, size, type
 * and expiry, and app/api/local-image-upload/route.ts checks the signature.
 */

export const LOCAL_UPLOAD_URL = "/api/local-image-upload";
const UPLOAD_EXPIRY_MS = 60_000;

/** Keys as built by buildUploadKey(): images/<table>/<name>.<ext> */
const KEY_PATTERN = /^images\/[a-z_]+\/[A-Za-z0-9_-]+\.[a-z0-9+.-]+$/;

const CONTENT_TYPES: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  "svg+xml": "image/svg+xml",
  svg: "image/svg+xml",
};

export function isLocalImageStorage(): boolean {
  return !!process.env.IMAGE_STORAGE_DIR;
}

/** The file path for a key, or null if the key isn't a valid image key */
export function resolveImagePath(key: string): string | null {
  const root = process.env.IMAGE_STORAGE_DIR;
  if (!root || !KEY_PATTERN.test(key)) return null;

  // turbopackIgnore: runtime paths, not files to bundle into the build
  const base = path.resolve(/*turbopackIgnore: true*/ root);
  const filePath = path.resolve(/*turbopackIgnore: true*/ base, key);
  return filePath.startsWith(base + path.sep) ? filePath : null;
}

export function contentTypeForKey(key: string): string {
  const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export async function saveLocalImage(key: string, body: Buffer) {
  const filePath = resolveImagePath(key);
  if (!filePath) throw new Error(`Invalid image key: ${key}`);

  await mkdir(path.dirname(/*turbopackIgnore: true*/ filePath), {
    recursive: true,
  });
  // Write then rename, so a reader never sees half a file
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(/*turbopackIgnore: true*/ tempPath, body);
  await rename(/*turbopackIgnore: true*/ tempPath, filePath);
}

export async function readLocalImage(key: string): Promise<Buffer | null> {
  const filePath = resolveImagePath(key);
  if (!filePath) return null;
  try {
    return await readFile(/*turbopackIgnore: true*/ filePath);
  } catch {
    return null;
  }
}

function sign(payload: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is needed to sign uploads");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function uploadPayload(
  key: string,
  size: string,
  type: string,
  expires: string,
) {
  return `${key}|${size}|${type}|${expires}`;
}

/** Same shape as an S3 presigned POST, so the upload code needs no changes */
export function createLocalUploadPost(
  key: string,
  fileSize: number,
  mimeType: string,
) {
  const size = String(fileSize);
  const expires = String(Date.now() + UPLOAD_EXPIRY_MS);
  return {
    url: LOCAL_UPLOAD_URL,
    fields: {
      key,
      "Content-Type": mimeType,
      size,
      expires,
      signature: sign(uploadPayload(key, size, mimeType, expires)),
    },
  };
}

/** Checks a signed upload form, returning an error message or null */
export function verifyLocalUpload(fields: {
  key: string;
  contentType: string;
  size: string;
  expires: string;
  signature: string;
  fileSize: number;
  fileType: string;
  now?: number;
}): string | null {
  const { key, contentType, size, expires, signature } = fields;

  const expected = Buffer.from(
    sign(uploadPayload(key, size, contentType, expires)),
  );
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return "Invalid upload signature";
  }
  if ((fields.now ?? Date.now()) > Number(expires))
    return "Upload link expired";
  if (fields.fileSize !== Number(size)) return "File size doesn't match";
  if (fields.fileType && fields.fileType !== contentType) {
    return "File type doesn't match";
  }
  if (!resolveImagePath(key)) return "Invalid image key";
  return null;
}
