import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export const RENDER_DIR = path.join(process.cwd(), ".renders");

export type JobStatus = "queued" | "bundling" | "rendering" | "done" | "error";

export type RenderJob = {
  id: string;
  status: JobStatus;
  stage: string;
  progress: number;
  createdAt: number;
  title: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  url: string | null;
  downloadUrl: string | null;
  /** YouTube renders: 1280x720 thumbnail and the title/description/chapters text. */
  thumbnailUrl: string | null;
  uploadTextUrl: string | null;
  error: string | null;
};

type JobBucket = Map<string, RenderJob>;

const globalStore = globalThis as unknown as {
  __sceneForgeJobs?: JobBucket;
};

export const jobs: JobBucket =
  globalStore.__sceneForgeJobs ?? new Map<string, RenderJob>();

if (!globalStore.__sceneForgeJobs) {
  globalStore.__sceneForgeJobs = jobs;
}

export async function ensureRenderDir() {
  if (!existsSync(RENDER_DIR)) {
    await mkdir(RENDER_DIR, { recursive: true });
  }
}

export function activeJob(): RenderJob | undefined {
  return [...jobs.values()].find(
    (job) =>
      job.status === "queued" ||
      job.status === "bundling" ||
      job.status === "rendering",
  );
}

export function pruneJobs() {
  const cutoff = Date.now() - 1000 * 60 * 60 * 2;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}
