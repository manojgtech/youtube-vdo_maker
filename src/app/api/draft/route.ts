import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { normalizeProject } from "@/shared/normalize";
import { LAYOUTS_BY_KIND } from "@/shared/themes";
import type { Project } from "@/shared/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

/*
 * "Write with Claude": asks the local Claude Code CLI (`claude -p`, the user's
 * normal login, no API key) to write the scenes for the brief in the form.
 */

const KIND_GUIDE: Record<Project["kind"], string> = {
  reel: "A short social reel (Reels/Shorts/TikTok). 4-6 scenes. Mostly 'card' scenes with a punchy headline and one-sentence caption.",
  product:
    "A SaaS / product promo. Structure: problem (pain points), screen (the app), features, then proof (stat or testimonial). 4-6 scenes.",
  ugc:
    "A UGC-style ad: a real-sounding creator talking to camera in first person. 4-6 beats: talk, talk/broll, broll, review. Casual short sentences, specific details, one honest 'I was sceptical' moment. The caption (body) is also what is spoken.",
  youtube:
    "A YouTube explainer. Start with a 'talk' intro, then 3-5 chapters: each a 'chapter' scene followed by 1-3 content scenes (bullets, features, stat, screen, card). Every scene has a 'say' narration (max 45 words).",
};

const LAYOUT_DOC = `Layouts and how fields are used:
- card: heading = headline, body = one-sentence caption
- problem: heading, body = 2-4 pain points, one per line (\\n)
- bullets: heading, body = 2-5 points, one per line
- features: heading, body = 2-4 lines like "⚡ Title — short text"
- screen: heading = headline about the app, body = 2-3 word callout label
- stat: heading = a number like "48%" or "6 hrs", body = what it means
- testimonial: body = the quote (max 20 words), heading = person's name
- talk: body = what the person says (max 22 words)
- broll: body = caption while showing the product (max 22 words), sticker = optional label like "Day 3"
- review: body = one-line honest review
- chapter: heading = chapter title (2-5 words)`;

function buildPrompt(project: Project) {
  const allowed = LAYOUTS_BY_KIND[project.kind].map((l) => l.id).join(", ");
  return `You write storyboards for a Remotion video app. Do not use any tools. Reply with ONLY one JSON object, no markdown fences.

VIDEO TYPE: ${KIND_GUIDE[project.kind]}
TOPIC: ${project.topic || "(not set: invent a fitting one from the other fields)"}
HOOK: ${project.hook}
BRAND: ${project.brand}
CALL TO ACTION: ${project.cta}
PRODUCT: ${JSON.stringify({ name: project.product.name, price: project.product.price, url: project.product.url })}
PEOPLE: ${project.cast.map((c) => `${c.name} (${c.role})`).join(", ") || "none"}

JSON shape:
{
  "topic": opening title (max 8 words),
  "hook": subtitle line (max 12 words),
  "cta": closing call to action (max 10 words),
  "scenes": [ { "layout": one of [${allowed}], "heading": text, "body": text, "say": voiceover line for this scene (max 30 words, ${project.kind === "ugc" ? "leave empty: the body is spoken" : "required"}), "chapter": "", "sticker": "" } ]${
    project.kind === "youtube"
      ? `,
  "youtube": { "title": under 70 characters, honest, "description": 2-3 sentences, "tags": "comma, separated, keywords", "thumbText": 2-4 words with one *highlighted* word, "thumbBadge": 1-2 words, "thumbEmoji": one emoji }`
      : ""
  }
}

${LAYOUT_DOC}

Rules:
- Wrap 1-2 key words in *asterisks* in headings to highlight them.
- Short on-screen text: it is read on a phone.
- Honest marketing: no invented statistics, prices, awards or customer names. Mark example numbers "(example)" and sample quotes "(sample)".`;
}

function askClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.CLAUDECODE; // allow running inside a Claude Code session
    // One command string: claude is a .cmd shim on Windows and needs a shell.
    // CLAUDE_CLI (in .env.local) can point at a specific claude executable.
    const cli = process.env.CLAUDE_CLI ? `"${process.env.CLAUDE_CLI.replace(/"/g, "")}"` : "claude";
    const child = spawn(`${cli} -p --output-format text`, { shell: true, env });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Claude took longer than 5 minutes."));
    }, 5 * 60_000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(`Could not run the claude CLI (${e.message}). Install Claude Code and log in once with: claude`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve(out);
      const detail = (err || out).trim();
      if (/not compatible with the version of Windows|not recognized as an internal or external command/i.test(detail)) {
        return reject(
          new Error(
            "The claude CLI on this PC is missing or broken. Reinstall it (npm install -g @anthropic-ai/claude-code, or the installer from claude.ai/code), run `claude` once to log in, then restart this app. Or set CLAUDE_CLI in .env.local to a working claude.exe.",
          ),
        );
      }
      reject(new Error(`claude CLI failed (exit ${code}): ${detail.slice(0, 400)}`));
    });
    child.stdin.end(prompt);
  });
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```(?:json)?/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Claude's reply had no JSON in it.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_AI_DRAFT !== "1") {
    return NextResponse.json({ error: "AI drafting is not enabled yet." }, { status: 404 });
  }
  let project: Project;
  try {
    const body = (await request.json()) as { project?: unknown };
    project = normalizeProject(body.project);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const reply = extractJson(await askClaude(buildPrompt(project)));
    const scenes = Array.isArray(reply.scenes) ? (reply.scenes as Record<string, unknown>[]) : [];
    if (!scenes.length) throw new Error("Claude returned no scenes.");
    // Keep the user's images, people and settings; take Claude's words.
    const merged = normalizeProject({
      ...project,
      topic: typeof reply.topic === "string" ? reply.topic : project.topic,
      hook: typeof reply.hook === "string" ? reply.hook : project.hook,
      cta: typeof reply.cta === "string" ? reply.cta : project.cta,
      youtube: project.kind === "youtube" ? { ...project.youtube, ...(reply.youtube as object) } : project.youtube,
      scenes: scenes.map((scene, index) => ({
        ...scene,
        id: `scene-${Date.now().toString(36)}-${index}`,
        image: project.scenes[index]?.image ?? null,
        castId: scene.layout === "talk" || scene.layout === "testimonial" ? project.cast[0]?.id ?? null : null,
        duration: 4,
        transition: (["fade", "slide", "wipe", "zoom"] as const)[index % 4],
      })),
    });
    return NextResponse.json({ project: merged });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Claude could not write the storyboard." }, { status: 502 });
  }
}
