import { Audio, Sequence, staticFile } from "remotion";
import type { Project, Timeline, TransitionId } from "../shared/types";

/* Transition sound effects. The files are synthesized by scripts/make-sfx.mjs. */

type Sound = "whoosh" | "swish" | "boom" | "air";

/** Frames from the start of each file to its loudest point, so peaks land on the cut. */
const PEAK: Record<Sound, number> = { whoosh: 10, swish: 5, boom: 0, air: 13 };

type Cue = { sound: Sound; at: number; volume: number };

function transitionCues(transition: TransitionId, start: number, frames: number, ugc: boolean): Cue[] {
  const mid = start + frames / 2;
  if (ugc) return [{ sound: "swish", at: mid, volume: 0.42 }];
  switch (transition) {
    case "slide":
      return [{ sound: "whoosh", at: mid, volume: 0.5 }];
    case "wipe":
      return [{ sound: "swish", at: mid, volume: 0.48 }];
    case "zoom":
      return [
        { sound: "whoosh", at: mid, volume: 0.42 },
        { sound: "boom", at: start + frames, volume: 0.28 },
      ];
    case "fade":
      return [{ sound: "air", at: mid, volume: 0.3 }];
  }
}

export function sfxCues(project: Project, timeline: Timeline): Cue[] {
  const ugc = project.kind === "ugc";
  const T = timeline.transitionFrames;
  const cues: Cue[] = [];
  // Opening hit under the title (UGC opens straight into the hook instead).
  if (!ugc) cues.push({ sound: "boom", at: 2, volume: 0.45 });
  timeline.scenes.forEach((timing) => {
    const scene = project.scenes[timing.index];
    cues.push(...transitionCues(ugc ? "zoom" : scene?.transition ?? "fade", timing.start, T, ugc));
  });
  const outroStart = timeline.durationInFrames - timeline.outroFrames;
  cues.push(...transitionCues(ugc ? "zoom" : "fade", outroStart, T, ugc));
  if (!ugc) cues.push({ sound: "boom", at: outroStart + T, volume: 0.4 });
  return cues;
}

export function SfxTrack({ project, timeline }: { project: Project; timeline: Timeline }) {
  if (project.sfx === false) return null;
  // Sit further back under a voiceover.
  const gain = project.scenes.some((scene) => scene.voiceFile) ? 0.6 : 1;
  return (
    <>
      {sfxCues(project, timeline).map((cue, i) => {
        const from = Math.round(cue.at - PEAK[cue.sound]);
        // Trim the lead-in when a cue would start before frame 0.
        const trim = Math.max(0, -from);
        return (
          <Sequence key={i} from={Math.max(0, from)} layout="none" name={`SFX ${cue.sound}`}>
            <Audio src={staticFile(`sfx/${cue.sound}.wav`)} volume={cue.volume * gain} trimBefore={trim || undefined} />
          </Sequence>
        );
      })}
    </>
  );
}
