import { FPS, MAX_VOICED_SECONDS } from "./types";
import type { AspectId, Format, Project, Scene, Timeline, VideoKind } from "./types";

const FORMATS: Record<AspectId, Format> = {
  portrait: { width: 1080, height: 1920, label: "Portrait", ratio: "9:16" },
  square: { width: 1080, height: 1080, label: "Square", ratio: "1:1" },
  landscape: { width: 1920, height: 1080, label: "Landscape", ratio: "16:9" },
};

/** UGC ads are always vertical and YouTube videos always 16:9. */
export const FIXED_ASPECT: Partial<Record<VideoKind, AspectId>> = {
  ugc: "portrait",
  youtube: "landscape",
};

/** Seconds of silence before a voiceover line starts in its scene. */
export const VOICE_LEAD = 0.3;
const VOICE_TAIL = 0.6;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getFormat = (aspect: AspectId): Format =>
  FORMATS[aspect] ?? FORMATS.portrait;

export const projectAspect = (project: Project): AspectId =>
  FIXED_ASPECT[project.kind] ?? project.aspect;

/** The line a scene speaks: its "say", or the caption for UGC beats. */
export const spokenText = (project: Project, scene: Scene): string => {
  if (!project.voice?.enabled) return "";
  const say = scene.say?.trim();
  if (say) return say;
  return project.kind === "ugc" ? scene.body.trim() : "";
};

/**
 * Seconds a scene is on screen. A voiced scene lasts at least as long as its
 * speech: measured after text-to-speech, estimated (2.6 words/s) in the preview.
 */
export function sceneSeconds(project: Project, scene: Scene): number {
  const base = clamp(scene.duration, 1, 12);
  const line = spokenText(project, scene);
  if (!line) return base;
  const speech =
    scene.voiceSeconds && scene.voiceSeconds > 0
      ? scene.voiceSeconds
      : line.split(/\s+/).filter(Boolean).length / 2.6;
  return clamp(Math.max(base, speech + VOICE_LEAD + VOICE_TAIL), 1, MAX_VOICED_SECONDS);
}

/**
 * Frames two neighbouring segments overlap while one transitions into the next.
 * UGC cuts fast; the other kinds use a slower, cinematic overlap.
 */
export const transitionFramesFor = (kind: VideoKind): number => (kind === "ugc" ? 8 : 16);

export function getTimeline(project: Project): Timeline {
  const format = getFormat(projectAspect(project));
  const titleFrames = Math.round(clamp(project.titleDuration, 1, 8) * FPS);
  const outroFrames = Math.round(clamp(project.outroDuration, 1, 8) * FPS);
  const transitionFrames = transitionFramesFor(project.kind);

  // Each segment starts `transitionFrames` before the previous one ends, so
  // scenes cross over each other instead of dipping to black between them.
  let cursor = titleFrames - transitionFrames;
  const scenes = project.scenes.map((scene, index) => {
    const frames = Math.round(sceneSeconds(project, scene) * FPS);
    const timing = { id: scene.id, index, start: cursor, frames };
    cursor += frames - transitionFrames;
    return timing;
  });

  return {
    fps: FPS,
    width: format.width,
    height: format.height,
    titleFrames,
    outroFrames,
    transitionFrames,
    scenes,
    durationInFrames: cursor + outroFrames,
  };
}

export function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${mins}:${String(rest).padStart(2, "0")}`;
}

export function getRuntimeSeconds(project: Project): number {
  return getTimeline(project).durationInFrames / FPS;
}

/** YouTube chapter list ("0:00 Intro") for the description. YouTube needs the first at 0:00. */
export function youtubeChapters(project: Project): string[] {
  const timeline = getTimeline(project);
  const marks: { at: number; title: string }[] = [];
  project.scenes.forEach((scene, index) => {
    const title = scene.chapter.trim() || (scene.layout === "chapter" ? scene.heading.trim() : "");
    if (title) marks.push({ at: timeline.scenes[index].start / FPS, title });
  });
  // The first chapter must start at 0:00, and YouTube ignores chapters under 10s.
  if (!marks.length || marks[0].at >= 10) marks.unshift({ at: 0, title: "Intro" });
  else marks[0].at = 0;
  return marks
    .filter((mark, i) => i === marks.length - 1 || marks[i + 1].at - mark.at >= 10)
    .map((mark) => `${formatSeconds(mark.at)} ${mark.title}`);
}
