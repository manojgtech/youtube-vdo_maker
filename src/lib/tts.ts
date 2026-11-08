import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { copyFile, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { spokenText } from "@/shared/timeline";
import type { Project, Scene } from "@/shared/types";

/*
 * Local voiceover with the voices built into Windows (System.Speech).
 * No API key and nothing leaves the machine. Clips are cached by text + voice.
 */

const run = promisify(execFile);
const CACHE_DIR = path.join(process.cwd(), ".cache", "tts");
const VOICE_DIR = path.join(process.cwd(), "public", "voice");

const SPEAK_SCRIPT = `
param([string]$JobsFile, [int]$Rate)
Add-Type -AssemblyName System.Speech
$jobs = Get-Content -Raw -Encoding UTF8 $JobsFile | ConvertFrom-Json
foreach ($j in $jobs) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  if ($j.voice) { try { $s.SelectVoice($j.voice) } catch { } }
  $s.Rate = $Rate
  $s.SetOutputToWaveFile($j.file)
  $s.Speak($j.text)
  $s.Dispose()
}
`;

export const ttsAvailable = () => process.platform === "win32";

export async function listVoices(): Promise<string[]> {
  if (!ttsAvailable()) return [];
  const { stdout } = await run("powershell", [
    "-NoProfile",
    "-Command",
    "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }",
  ]);
  return stdout.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
}

/** Seconds of audio in a PCM WAV file, read from its header. */
export function wavSeconds(file: string): number {
  const buf = readFileSync(file);
  let offset = 12;
  let byteRate = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(offset + 16);
    if (id === "data" && byteRate) return size / byteRate;
    offset += 8 + size + (size % 2);
  }
  return 0;
}

/**
 * Speaks every voiced scene into public/voice/<jobId>/ and returns a copy of the
 * project with voiceFile + voiceSeconds set, so the timeline follows the speech.
 */
export async function addVoiceover(project: Project, jobId: string): Promise<Project> {
  const jobs = project.scenes
    .map((scene, index) => ({ index, text: spokenText(project, scene).replace(/\*/g, "") }))
    .filter((job) => job.text);
  if (!jobs.length) return project;
  if (!ttsAvailable()) throw new Error("Voiceover uses the Windows voices. Turn voiceover off on this computer.");

  await mkdir(CACHE_DIR, { recursive: true });
  const voice = project.voice.name;
  const rate = project.voice.rate;
  const withFiles = jobs.map((job) => ({
    ...job,
    file: path.join(
      CACHE_DIR,
      `${createHash("sha1").update(JSON.stringify([voice, rate, job.text])).digest("hex").slice(0, 16)}.wav`,
    ),
  }));

  const todo = withFiles.filter((job) => !existsSync(job.file));
  if (todo.length) {
    const script = path.join(CACHE_DIR, "speak.ps1");
    const list = path.join(CACHE_DIR, `jobs-${jobId}.json`);
    await writeFile(script, SPEAK_SCRIPT);
    await writeFile(list, JSON.stringify(todo.map((job) => ({ text: job.text, voice, file: job.file }))));
    try {
      await run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, list, String(rate)], {
        timeout: 10 * 60_000,
      });
    } finally {
      await rm(list, { force: true });
    }
  }

  const outDir = path.join(VOICE_DIR, jobId);
  await mkdir(outDir, { recursive: true });
  const scenes: Scene[] = project.scenes.map((scene) => ({ ...scene, voiceFile: null }));
  for (const job of withFiles) {
    if (!existsSync(job.file)) throw new Error(`Text-to-speech produced no audio for: "${job.text.slice(0, 60)}"`);
    const name = `${String(job.index + 1).padStart(2, "0")}.wav`;
    await copyFile(job.file, path.join(outDir, name));
    scenes[job.index] = {
      ...scenes[job.index],
      voiceFile: `/voice/${jobId}/${name}`,
      voiceSeconds: Number(wavSeconds(job.file).toFixed(2)),
    };
  }
  await pruneVoiceDirs(jobId);
  return { ...project, scenes };
}

/** Keep the last few renders' voice folders; public/ is copied into every bundle. */
async function pruneVoiceDirs(keep: string, max = 4) {
  if (!existsSync(VOICE_DIR)) return;
  const dirs = await Promise.all(
    (await readdir(VOICE_DIR)).map(async (name) => ({ name, time: (await stat(path.join(VOICE_DIR, name))).mtimeMs })),
  );
  dirs
    .filter((d) => d.name !== keep)
    .sort((a, b) => b.time - a.time)
    .slice(max - 1)
    .forEach((d) => void rm(path.join(VOICE_DIR, d.name), { recursive: true, force: true }));
}
