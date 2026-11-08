import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { NextResponse } from "next/server";
import { getBrowserExecutable } from "@/lib/browser";
import { addVoiceover } from "@/lib/tts";
import { youtubeChapters } from "@/shared/timeline";
import {
  activeJob,
  ensureRenderDir,
  jobs,
  pruneJobs,
  RENDER_DIR,
  type RenderJob,
} from "@/lib/render-store";
import { getProjectErrors, normalizeProject } from "@/shared/normalize";
import { getTimeline } from "@/shared/timeline";
import type { Project } from "@/shared/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;

const ENTRY_POINT = path.join(process.cwd(), "src", "remotion", "index.ts");
const PUBLIC_DIR = path.join(process.cwd(), "public");

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = (body ?? {}) as { project?: unknown };
  const project = normalizeProject(payload.project ?? body);
  const errors = getProjectErrors(project);

  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const running = activeJob();
  if (running) {
    return NextResponse.json(
      {
        error: "A render is already running. Give it a moment.",
        activeJobId: running.id,
        progress: running.progress,
      },
      { status: 409 },
    );
  }

  pruneJobs();
  await ensureRenderDir();

  const timeline = getTimeline(project);
  const id = randomUUID();
  const job: RenderJob = {
    id,
    status: "queued",
    stage: "Queued",
    progress: 0,
    createdAt: Date.now(),
    title: project.topic,
    width: timeline.width,
    height: timeline.height,
    fps: timeline.fps,
    durationInFrames: timeline.durationInFrames,
    url: null,
    downloadUrl: null,
    thumbnailUrl: null,
    uploadTextUrl: null,
    error: null,
  };

  jobs.set(id, job);

  // Fire and forget, but yield first so the client gets its job id before
  // webpack/bundling starts chewing through the event loop.
  setImmediate(() => {
    void runRender(job, project).catch((error) => {
      job.status = "error";
      job.stage = "Failed";
      job.error =
        error instanceof Error ? error.message : "The render failed unexpectedly.";
      console.error("[render]", error);
    });
  });

  return NextResponse.json({
    jobId: id,
    timeline,
    estimatedSeconds: Math.max(20, Math.round(timeline.durationInFrames / 22)),
  });
}

/** Title, description with chapter timestamps, and tags, ready to paste into YouTube Studio. */
function youtubeUploadText(project: Project): string {
  const yt = project.youtube;
  const chapters = youtubeChapters(project);
  return [
    "TITLE",
    yt.title || project.topic,
    "",
    "DESCRIPTION",
    yt.description || project.hook,
    "",
    chapters.length >= 3 ? "Chapters:" : "Chapters (YouTube shows them only with 3+ chapters of 10s+):",
    ...chapters,
    "",
    "TAGS",
    yt.tags,
  ].join("\n");
}

async function runRender(job: RenderJob, input: Project) {
  const browserExecutable = getBrowserExecutable();

  try {
    job.status = "bundling";
    let project = input;
    if (project.voice.enabled) {
      job.stage = "Recording the voiceover";
      job.progress = 0.01;
      project = await addVoiceover(project, job.id);
    }

    job.stage = "Bundling the composition";
    job.progress = 0.02;

    const serveUrl = await bundle({
      entryPoint: ENTRY_POINT,
      publicDir: PUBLIC_DIR,
      onProgress: (progress) => {
        job.progress = Math.min(0.3, 0.02 + progress * 0.28);
      },
    });

    job.stage = "Reading the timeline";
    job.progress = Math.max(job.progress, 0.31);

    const composition = await selectComposition({
      serveUrl,
      id: "ShortVideo",
      inputProps: project as unknown as Record<string, unknown>,
      browserExecutable,
      timeoutInMilliseconds: 120_000,
    });

    job.width = composition.width;
    job.height = composition.height;
    job.fps = composition.fps;
    job.durationInFrames = composition.durationInFrames;

    job.status = "rendering";
    job.stage = "Rendering frames";
    job.progress = 0.33;

    const outputLocation = path.join(RENDER_DIR, `${job.id}.mp4`);

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps: project as unknown as Record<string, unknown>,
      browserExecutable,
      timeoutInMilliseconds: 120_000,
      overwrite: true,
      crf: 23,
      jpegQuality: 80,
      x264Preset: "veryfast",
      onProgress: ({ progress }) => {
        job.progress = Math.min(0.97, 0.33 + progress * 0.64);
        job.stage = progress > 0.95 ? "Muxing the MP4" : "Rendering frames";
      },
    });

    if (project.kind === "youtube") {
      job.stage = "Making the thumbnail";
      const thumbnail = await selectComposition({
        serveUrl,
        id: "Thumbnail",
        inputProps: project as unknown as Record<string, unknown>,
        browserExecutable,
      });
      await renderStill({
        composition: thumbnail,
        serveUrl,
        output: path.join(RENDER_DIR, `${job.id}-thumbnail.jpg`),
        inputProps: project as unknown as Record<string, unknown>,
        browserExecutable,
        imageFormat: "jpeg",
        jpegQuality: 90,
        overwrite: true,
      });
      await writeFile(path.join(RENDER_DIR, `${job.id}-youtube.txt`), youtubeUploadText(project));
      job.thumbnailUrl = `/api/render/${job.id}/extra?file=thumbnail`;
      job.uploadTextUrl = `/api/render/${job.id}/extra?file=youtube`;
    }

    job.status = "done";
    job.stage = "Ready";
    job.progress = 1;
    job.url = `/api/render/${job.id}/video`;
    job.downloadUrl = `/api/render/${job.id}/video?download=1`;
  } catch (error) {
    job.status = "error";
    job.stage = "Failed";
    job.error =
      error instanceof Error
        ? error.message.slice(0, 1200)
        : "The render failed unexpectedly.";
    console.error("[render]", error);
  }
}
