import { NextResponse } from "next/server";
import { jobs } from "@/lib/render-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const job = jobs.get(jobId);

  if (!job) {
    return NextResponse.json({ error: "Render not found." }, { status: 404 });
  }

  return NextResponse.json(job, {
    headers: { "cache-control": "no-store" },
  });
}
