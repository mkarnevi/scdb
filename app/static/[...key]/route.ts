import {
  contentTypeForKey,
  isLocalImageStorage,
  readLocalImage,
} from "@/backend/localImageStore";
import { NextRequest, NextResponse } from "next/server";

/** Fork: serves images from IMAGE_STORAGE_DIR at /static/<key> */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!isLocalImageStorage()) {
    return new NextResponse(null, { status: 404 });
  }

  const key = (await params).key.join("/");
  const body = await readLocalImage(key);
  if (!body) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": contentTypeForKey(key),
      // Keys include a content hash, so a key's file never changes
      "Cache-Control": "public, max-age=31536000, immutable",
      // Images come from editors: never let one run script on this origin
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
