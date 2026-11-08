import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { Theme } from "../shared/themes";
import type { TransitionId } from "../shared/types";
import { hexAlpha, isLightTheme } from "./visual";

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Slow start and end, quick middle: reads as a deliberate camera move. */
const ease = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * Wraps one segment (title, scene or outro) of the film.
 *
 * Segments overlap by `frames` on the timeline. The incoming segment draws its
 * entrance (`enter`) on top of the outgoing one, and the outgoing segment moves
 * out of the way to match (`exit` = the next segment's transition), so the cut
 * never passes through black.
 */
export function SceneTransition({
  enter,
  exit,
  frames,
  durationInFrames,
  theme,
  leak = true,
  fadeOutToBlack = false,
  children,
}: {
  /** Transition into this segment; null = appears as is (first segment). */
  enter: TransitionId | null;
  /** Transition into the next segment; null = nothing follows. */
  exit: TransitionId | null;
  frames: number;
  durationInFrames: number;
  theme: Theme;
  /** Accent light-leak flash during the entrance. */
  leak?: boolean;
  /** Fade the last frames of the film to black. */
  fadeOutToBlack?: boolean;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  const t = Math.max(1, frames);
  const p = enter ? interpolate(frame, [0, t], [0, 1], { ...clampOpts, easing: ease }) : 1;
  const q = exit ? interpolate(frame, [durationInFrames - t, durationInFrames], [0, 1], { ...clampOpts, easing: ease }) : 0;

  const style: CSSProperties = {};
  const transforms: string[] = [];
  const filters: string[] = [];

  // Entrance.
  if (enter && p < 1) {
    switch (enter) {
      case "fade":
        style.opacity = p;
        break;
      case "slide":
        transforms.push(`translateX(${(1 - p) * 100}%)`);
        style.boxShadow = "-40px 0 80px rgba(0,0,0,0.55)";
        break;
      case "wipe":
        style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
        break;
      case "zoom":
        transforms.push(`scale(${1.22 - 0.22 * p})`);
        filters.push(`blur(${(1 - p) * 10}px)`);
        style.opacity = interpolate(p, [0, 0.55], [0, 1], clampOpts);
        break;
    }
  }

  // Exit: the outgoing segment reacts to what is coming in over it.
  if (exit && q > 0) {
    switch (exit) {
      case "slide":
        transforms.push(`translateX(${-q * 32}%)`);
        filters.push(`brightness(${1 - 0.45 * q})`);
        break;
      case "zoom":
        transforms.push(`scale(${1 + 0.14 * q})`);
        filters.push(`blur(${q * 6}px)`);
        break;
      case "wipe":
        transforms.push(`translateX(${-q * 6}%)`);
        break;
      case "fade":
        // Soften the outgoing scene so overlapping text reads as depth, not a double exposure.
        transforms.push(`scale(${1 + 0.035 * q})`);
        filters.push(`blur(${q * 5}px)`);
        break;
    }
  }

  if (transforms.length) style.transform = transforms.join(" ");
  if (filters.length) style.filter = filters.join(" ");

  const endFade = fadeOutToBlack
    ? interpolate(frame, [durationInFrames - 14, durationInFrames - 1], [0, 1], clampOpts)
    : 0;

  const light = isLightTheme(theme);
  const leakStrength = enter && leak ? Math.sin(p * Math.PI) * (enter === "fade" ? 0.22 : 0.38) * (light ? 0.5 : 1) : 0;

  return (
    // zIndex 0 keeps each segment in its own stacking context, under the letterbox and progress bar.
    <AbsoluteFill style={{ zIndex: 0 }}>
      <AbsoluteFill style={{ overflow: "hidden", ...style }}>{children}</AbsoluteFill>

      {enter === "wipe" && p > 0 && p < 1 ? (
        // Glowing leading edge of the wipe.
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${p * 100}%`,
            width: 3,
            transform: "translateX(-50%)",
            background: theme.accent,
            boxShadow: `0 0 24px 6px ${hexAlpha(theme.accent, 0.7)}, 0 0 80px 24px ${hexAlpha(theme.accent, 0.3)}`,
            zIndex: 60,
          }}
        />
      ) : null}

      {leakStrength > 0.001 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(70% 55% at ${20 + p * 60}% 35%, ${hexAlpha(theme.accent, 0.95)} 0%, ${hexAlpha(
              theme.accent2,
              0.45,
            )} 35%, rgba(0,0,0,0) 70%)`,
            mixBlendMode: "screen",
            opacity: leakStrength,
            zIndex: 61,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {endFade > 0 ? <AbsoluteFill style={{ background: "#000", opacity: endFade, zIndex: 62 }} /> : null}
    </AbsoluteFill>
  );
}
