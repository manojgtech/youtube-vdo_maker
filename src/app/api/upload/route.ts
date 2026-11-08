import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only formats we know how to render. SVG is intentionally excluded. */
const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/mp4": ".m4a",
  "audio/m4a": ".m4a",
  "audio/ogg": ".ogg",
  // Footage for UGC and YouTube talking/b-roll scenes.
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file was included." }, { status: 400 });
    }

    const type = (file.type || "").toLowerCase();
    const extension = TYPES[type];

    if (!extension) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, WebP, AVIF, GIF, MP3, WAV, M4A, OGG, MP4, WebM or MOV file." },
        { status: 415 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "That file is empty." }, { status: 400 });
    }

    const video = type.startsWith("video/");
    if (file.size > (video ? MAX_VIDEO_BYTES : MAX_BYTES)) {
      return NextResponse.json(
        { error: video ? "Videos need to stay under 200 MB." : "Files need to stay under 25 MB." },
        { status: 413 },
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    // Double-check the extension cannot be used for path traversal.
    if (path.basename(filename) !== filename) {
      return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
    }

    await writeFile(path.join(UPLOAD_DIR, filename), bytes);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      kind: type.startsWith("audio") ? "audio" : video ? "video" : "image",
      bytes: file.size,
    });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json(
      { error: "Upload failed. Try again." },
      { status: 500 },
    );
  }
}

/** Keep the dev folder from growing forever. */
export async function DELETE() {
  if (!existsSync(UPLOAD_DIR)) {
    return NextResponse.json({ ok: true });
  }
  await rm(UPLOAD_DIR, { recursive: true, force: true });
  await mkdir(UPLOAD_DIR, { recursive: true });
  return NextResponse.json({ ok: true });
}
