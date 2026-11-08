import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { jobs, RENDER_DIR } from "@/lib/render-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "scene-forge";

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;

  if (!UUID.test(jobId)) {
    return NextResponse.json({ error: "Invalid render id." }, { status: 400 });
  }

  const job = jobs.get(jobId);
  if (!job || job.status !== "done") {
    return NextResponse.json({ error: "Render not ready." }, { status: 404 });
  }

  const filePath = path.join(RENDER_DIR, `${jobId}.mp4`);

  try {
    const info = await stat(filePath);
    const file = await readFile(filePath);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const filename = `${slug(job.title)}.mp4`;

    const headers: Record<string, string> = {
      "content-type": "video/mp4",
      "accept-ranges": "bytes",
      "cache-control": "private, max-age=3600",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
    };

    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (match) {
        const size = info.size;
        const hasStart = match[1] !== "";
        const hasEnd = match[2] !== "";
        let start = hasStart ? Number(match[1]) : 0;
        let end = hasEnd ? Number(match[2]) : size - 1;

        if (!hasStart && hasEnd) {
          // Suffix range: last N bytes.
          start = Math.max(0, size - end);
          end = size - 1;
        }

        if (
          !Number.isFinite(start) ||
          !Number.isFinite(end) ||
          start < 0 ||
          start > end ||
          start >= size
        ) {
          return new NextResponse(null, {
            status: 416,
            headers: { "content-range": `bytes */${size}` },
          });
        }

        end = Math.min(end, size - 1);
        const chunk = file.subarray(start, end + 1);

        return new NextResponse(new Uint8Array(chunk), {
          status: 206,
          headers: {
            ...headers,
            "content-range": `bytes ${start}-${end}/${size}`,
            "content-length": String(chunk.length),
          },
        });
      }
    }

    return new NextResponse(new Uint8Array(file), {
      headers: {
        ...headers,
        "content-length": String(info.size),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "That render file is missing. Render again." },
      { status: 404 },
    );
  }
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  return GET(request, context);
}
