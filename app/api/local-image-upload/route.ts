import {
  isLocalImageStorage,
  saveLocalImage,
  verifyLocalUpload,
} from "@/backend/localImageStore";
import { NextRequest, NextResponse } from "next/server";

/** Fork: receives image uploads signed by createLocalUploadPost() */
export async function POST(request: NextRequest) {
  if (!isLocalImageStorage()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  const key = field("key");

  const error = verifyLocalUpload({
    key,
    contentType: field("Content-Type"),
    size: field("size"),
    expires: field("expires"),
    signature: field("signature"),
    fileSize: file.size,
    fileType: file.type,
  });
  if (error) {
    return NextResponse.json({ error }, { status: 403 });
  }

  await saveLocalImage(key, Buffer.from(await file.arrayBuffer()));
  return new NextResponse(null, { status: 204 });
}
