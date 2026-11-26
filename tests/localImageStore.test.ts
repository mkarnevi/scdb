import { mkdtemp, readdir, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  contentTypeForKey,
  createLocalUploadPost,
  readLocalImage,
  resolveImagePath,
  saveLocalImage,
  verifyLocalUpload,
} = await import("../backend/localImageStore");

let dir: string;
const KEY = "images/sketch/abc123_Round_shot_1a2b3c4d.png";

beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "scdb-images-"));
  process.env.IMAGE_STORAGE_DIR = dir;
  process.env.NEXTAUTH_SECRET = "test-secret";
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
  delete process.env.IMAGE_STORAGE_DIR;
});

describe("image keys", () => {
  test("accepts keys in the upload key format", () => {
    expect(resolveImagePath(KEY)).toBe(path.join(dir, KEY));
    expect(
      resolveImagePath("images/recurring_sketch/x_y_00ff.webp"),
    ).not.toBeNull();
    expect(resolveImagePath("images/person/a_b_c.svg+xml")).not.toBeNull();
  });

  test.each([
    "../etc/passwd",
    "images/../../etc/passwd",
    "images/sketch/../../secret.png",
    "/etc/passwd",
    "images/sketch/sub/dir.png",
    "other/sketch/file.png",
    "images/sketch/file",
    "images/Sketch/file.png",
    "",
  ])("rejects %j", (key) => {
    expect(resolveImagePath(key)).toBeNull();
  });

  test("content types follow the extension", () => {
    expect(contentTypeForKey("images/a/b.jpeg")).toBe("image/jpeg");
    expect(contentTypeForKey("images/a/b.svg+xml")).toBe("image/svg+xml");
    expect(contentTypeForKey("images/a/b.bin")).toBe(
      "application/octet-stream",
    );
  });
});

describe("saving and reading", () => {
  test("round-trips a file and leaves no temp files", async () => {
    await saveLocalImage(KEY, Buffer.from("png bytes"));
    expect((await readLocalImage(KEY))?.toString()).toBe("png bytes");
    const files = await readdir(path.join(dir, "images/sketch"));
    expect(files).toEqual([path.basename(KEY)]);
  });

  test("missing and invalid keys read as null", async () => {
    expect(
      await readLocalImage("images/sketch/missing_file_00.png"),
    ).toBeNull();
    expect(await readLocalImage("../outside.png")).toBeNull();
  });

  test("refuses to save under an invalid key", async () => {
    await expect(
      saveLocalImage("../x.png", Buffer.from("x")),
    ).rejects.toThrow();
  });
});

describe("signed uploads", () => {
  const post = () => createLocalUploadPost(KEY, 1234, "image/png");
  const check = (
    fields: ReturnType<typeof createLocalUploadPost>["fields"],
    overrides: Partial<Parameters<typeof verifyLocalUpload>[0]> = {},
  ) =>
    verifyLocalUpload({
      key: fields.key,
      contentType: fields["Content-Type"],
      size: fields.size,
      expires: fields.expires,
      signature: fields.signature,
      fileSize: 1234,
      fileType: "image/png",
      ...overrides,
    });

  test("has the shape the upload code expects", () => {
    const p = post();
    expect(p.url).toBe("/api/local-image-upload");
    expect(p.fields.key).toBe(KEY);
  });

  test("a genuine upload passes", () => {
    expect(check(post().fields)).toBeNull();
  });

  test("tampering with any signed field fails", () => {
    const f = post().fields;
    expect(check(f, { key: "images/sketch/other_file_00.png" })).toMatch(
      /signature/,
    );
    expect(check(f, { size: "999999", fileSize: 999999 })).toMatch(/signature/);
    expect(
      check(f, { contentType: "image/svg+xml", fileType: "image/svg+xml" }),
    ).toMatch(/signature/);
    expect(check(f, { expires: String(Date.now() + 1e9) })).toMatch(
      /signature/,
    );
    expect(check(f, { signature: "0".repeat(64) })).toMatch(/signature/);
    expect(check(f, { signature: "short" })).toMatch(/signature/);
  });

  test("a different file than the one signed fails", () => {
    const f = post().fields;
    expect(check(f, { fileSize: 999 })).toMatch(/size/);
    expect(check(f, { fileType: "image/gif" })).toMatch(/type/);
  });

  test("an expired link fails", () => {
    const f = post().fields;
    expect(check(f, { now: Number(f.expires) + 1 })).toMatch(/expired/);
  });

  test("a signature from another secret fails", () => {
    const f = post().fields;
    process.env.NEXTAUTH_SECRET = "a-different-secret";
    try {
      expect(check(f)).toMatch(/signature/);
    } finally {
      process.env.NEXTAUTH_SECRET = "test-secret";
    }
  });
});
