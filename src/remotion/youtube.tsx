import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEMES } from "../shared/themes";
import type { Theme } from "../shared/themes";
import { VOICE_LEAD } from "../shared/timeline";
import type { CastMember, Project, Scene } from "../shared/types";
import { Highlight, useUnit } from "./layouts";
import { BackgroundImage, BrandMark, GeneratedBackground, Grain, asset, hexAlpha, isLightTheme } from "./visual";

/* YouTube pieces: talking head with lower third, chapter tag, subtitles,
 * end screen and the 1280x720 thumbnail still. */

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (frame: number, fps: number, delay: number) =>
  spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 150, mass: 0.6 } });

/** Talking head (or any footage) with a name/role lower third. Used by YouTube and reels. */
export function TalkSegment({ scene, theme, cast, durationInFrames }: { scene: Scene; theme: Theme; cast: CastMember | null; durationInFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit } = useUnit();
  const media = scene.image ?? cast?.image ?? null;
  const lt = pop(frame, fps, 10);
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {media ? <BackgroundImage src={media} theme={{ ...theme, imageOpacity: 1 }} zoomFrom={1.03} zoomTo={1.1} position="50% 20%" /> : <GeneratedBackground theme={theme} />}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 45%)" }} />
      {scene.heading ? (
        <div style={{ position: "absolute", right: unit * 0.09, top: "50%", transform: "translateY(-50%)", maxWidth: unit * 0.75, padding: unit * 0.035, borderRadius: unit * 0.025, background: "rgba(0,0,0,0.55)" }}>
          <Highlight text={scene.heading} theme={{ ...theme, ink: "#fff" }} size={unit * 0.055} align="left" stagger={1.8} />
        </div>
      ) : null}
      {cast?.name ? (
        <div style={{ position: "absolute", left: unit * 0.08, bottom: unit * 0.19, transform: `translateX(${(1 - lt) * -unit * 0.65}px)`, display: "flex", flexDirection: "column", gap: unit * 0.006, fontFamily: theme.sans }}>
          <div style={{ background: theme.accent, color: isLightTheme(theme) ? "#fff" : theme.bg, fontSize: unit * 0.046, fontWeight: 800, padding: `${unit * 0.009}px ${unit * 0.028}px`, borderRadius: unit * 0.011 }}>{cast.name}</div>
          {cast.role ? (
            <div style={{ background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: unit * 0.031, padding: `${unit * 0.007}px ${unit * 0.028}px`, borderRadius: unit * 0.009, alignSelf: "flex-start" }}>{cast.role}</div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

export function ChapterTag({ text, theme }: { text: string; theme: Theme }) {
  const { unit } = useUnit();
  return (
    <div style={{ position: "absolute", left: unit * 0.046, top: unit * 0.042, zIndex: 35, background: hexAlpha(theme.bg.length === 7 ? theme.bg : "#000000", 0.75), border: `1px solid ${hexAlpha(theme.accent, 0.6)}`, color: theme.ink, fontFamily: theme.sans, fontWeight: 700, fontSize: unit * 0.027, padding: `${unit * 0.008}px ${unit * 0.022}px`, borderRadius: 999 }}>
      {text}
    </div>
  );
}

/** Subtitles: the spoken line in short chunks timed across the voice clip. */
export function Subtitles({ text, seconds }: { text: string; seconds?: number }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { unit } = useUnit();
  const words = text.replace(/\*/g, "").split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 8) chunks.push(words.slice(i, i + 8).join(" "));
  if (!chunks.length) return null;
  const start = VOICE_LEAD * fps;
  const span = (seconds ?? durationInFrames / fps - 1) * fps;
  const total = chunks.reduce((a, c) => a + c.length, 0);
  let acc = 0;
  let shown = -1;
  chunks.forEach((c, i) => {
    if (frame >= start + (acc / total) * span) shown = i;
    acc += c.length;
  });
  if (shown < 0 || frame > start + span + fps * 0.3) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: unit * 0.04, display: "flex", justifyContent: "center", zIndex: 36 }}>
      <div style={{ background: "rgba(0,0,0,0.72)", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: unit * 0.041, fontWeight: 600, padding: `${unit * 0.009}px ${unit * 0.026}px`, borderRadius: unit * 0.011, maxWidth: "80%", textAlign: "center" }}>
        {chunks[shown]}
      </div>
    </div>
  );
}

/** End screen: room on the right for YouTube's own end-screen cards (placed in YouTube Studio). */
export function EndScreen({ project, theme }: { project: Project; theme: Theme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit } = useUnit();
  const btn = pop(frame, fps, 14);
  const ring = Math.sin((frame / fps) * Math.PI * 2) * 12;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <GeneratedBackground theme={theme} />
      <Grain />
      <AbsoluteFill style={{ flexDirection: "row", padding: unit * 0.09, gap: unit * 0.075, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: unit * 0.04, fontFamily: theme.sans }}>
          <Highlight text={project.cta || "Thanks for *watching*"} theme={theme} size={unit * 0.085} align="left" />
          <div style={{ display: "flex", alignItems: "center", gap: unit * 0.022, transform: `scale(${btn})`, transformOrigin: "left center" }}>
            <div style={{ background: "#ff0033", color: "#fff", fontSize: unit * 0.046, fontWeight: 800, padding: `${unit * 0.02}px ${unit * 0.05}px`, borderRadius: 999 }}>Subscribe</div>
            <div style={{ fontSize: unit * 0.06, transform: `rotate(${ring}deg)` }}>🔔</div>
          </div>
          {project.youtube.handle ? <div style={{ fontSize: unit * 0.037, color: theme.muted }}>{project.youtube.handle}</div> : null}
        </div>
        <div style={{ width: unit * 0.7, display: "flex", flexDirection: "column", gap: unit * 0.037 }}>
          {["Watch next", "Recommended"].map((label, i) => (
            <div key={label} style={{ height: unit * 0.37, borderRadius: unit * 0.022, border: `${unit * 0.004}px dashed ${hexAlpha(isLightTheme(theme) ? "#000000" : "#ffffff", 0.35)}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.sans, fontSize: unit * 0.035, color: theme.muted, opacity: pop(frame, fps, 20 + i * 8) }}>
              {label}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** 1280x720 thumbnail: huge 2–4 word text, optional face/product image, badge and emoji. */
export function Thumbnail(project: Project) {
  const theme = THEMES[project.theme] ?? THEMES.cinematic;
  const yt = project.youtube;
  const text = yt.thumbText || yt.title || project.topic || "Watch this";
  const words = text.split(/\s+/).filter(Boolean);
  const size = words.length <= 2 ? 170 : words.length <= 4 ? 130 : 96;
  const image = yt.thumbImage ?? project.cast[0]?.image ?? null;
  let accent = false;
  return (
    <AbsoluteFill style={{ fontFamily: "Inter, sans-serif", background: `linear-gradient(135deg, ${theme.bg}, #000)`, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 75% 55%, ${hexAlpha(theme.accent, 0.55)}, transparent 55%)` }} />
      {image ? (
        <Img src={asset(image)} style={{ position: "absolute", right: 0, bottom: 0, height: "100%", width: "48%", objectFit: "cover", objectPosition: "50% 20%", maskImage: "linear-gradient(90deg, transparent, #000 25%)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 25%)" }} />
      ) : null}
      {yt.thumbEmoji ? (
        <div style={{ position: "absolute", right: image ? 520 : 120, top: 70, fontSize: 190, transform: "rotate(12deg)", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }}>{yt.thumbEmoji}</div>
      ) : null}
      <div style={{ position: "absolute", left: 60, top: 0, bottom: 0, width: image ? "60%" : "78%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        {yt.thumbBadge ? (
          <div style={{ alignSelf: "flex-start", background: "#ef4444", color: "#fff", fontSize: 44, fontWeight: 900, padding: "6px 22px", borderRadius: 12, transform: "rotate(-3deg)" }}>{yt.thumbBadge}</div>
        ) : null}
        <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1, textTransform: "uppercase", WebkitTextStroke: "6px #000", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,0.5)" }}>
          {words.map((raw, i) => {
            if (raw.startsWith("*")) accent = true;
            const on = accent;
            if (/\*[^\p{L}\p{N}]*$/u.test(raw)) accent = false;
            return (
              <span key={i} style={{ display: "inline-block", color: on ? theme.accent : "#fff", marginRight: 24 }}>
                {raw.replace(/\*/g, "")}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, bottom: 40 }}>
        <BrandMark brand={yt.channel || project.brand} theme={{ ...theme, ink: "#fff" }} unit={1600} />
      </div>
    </AbsoluteFill>
  );
}
