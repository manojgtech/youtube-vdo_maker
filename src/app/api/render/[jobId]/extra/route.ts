import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { jobs, RENDER_DIR } from "@/lib/render-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FILES = {
  thumbnail: { suffix: "-thumbnail.jpg", type: "image/jpeg", name: "thumbnail.jpg" },
  youtube: { suffix: "-youtube.txt", type: "text/plain; charset=utf-8", name: "youtube-upload.txt" },
} as const;

/** Extra files a YouTube render produces: ?file=thumbnail or ?file=youtube. */
export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const url = new URL(request.url);
  const entry = FILES[url.searchParams.get("file") as keyof typeof FILES];
  if (!UUID.test(jobId) || !entry) {
    return NextResponse.json({ error: "Unknown file." }, { status: 400 });
  }
  if (jobs.get(jobId)?.status !== "done") {
    return NextResponse.json({ error: "Render not ready." }, { status: 404 });
  }
  try {
    const file = await readFile(path.join(RENDER_DIR, `${jobId}${entry.suffix}`));
    const download = url.searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "content-type": entry.type,
        "cache-control": "private, max-age=3600",
        "content-disposition": `${download ? "attachment" : "inline"}; filename="${entry.name}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "That file is missing. Render again." }, { status: 404 });
  }
}
