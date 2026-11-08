import { NextResponse } from "next/server";
import { listVoices, ttsAvailable } from "@/lib/tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Installed Windows voices for the voiceover picker. */
export async function GET() {
  try {
    return NextResponse.json({ available: ttsAvailable(), voices: await listVoices() });
  } catch {
    return NextResponse.json({ available: false, voices: [] });
  }
}
