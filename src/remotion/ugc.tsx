import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../shared/themes";
import { VOICE_LEAD } from "../shared/timeline";
import type { CastMember, Project, Scene } from "../shared/types";
import { Stars, useUnit } from "./layouts";
import { BackgroundImage, GeneratedBackground, asset, hexAlpha } from "./visual";

/* UGC-style ad pieces: creator footage, sticker hook, word-by-word captions,
 * review card and a shop CTA. Always 1080x1920. */

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (frame: number, fps: number, delay: number) =>
  spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 170, mass: 0.6 } });
const strip = (text: string) => text.replace(/\*/g, "");

function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && `${line} ${word}`.length > max) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

export function ProductShot({ project, theme, size }: { project: Project; theme: Theme; size: number }) {
  const p = project.product;
  if (p.image) {
    return <Img src={asset(p.image)} style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.45))" }} />;
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        boxShadow: `0 ${size * 0.06}px ${size * 0.15}px rgba(0,0,0,0.45)`,
      }}
    >
      {p.emoji || "🛍️"}
    </div>
  );
}

/** Footage behind a beat: its image/video, or the product floating on the theme background. */
function Footage({ scene, project, theme, blur }: { scene: Scene | null; project: Project; theme: Theme; blur: boolean }) {
  const frame = useCurrentFrame();
  const { unit } = useUnit();
  const src = scene?.image ?? null;
  if (src) {
    return (
      <AbsoluteFill style={{ filter: blur ? "blur(14px) brightness(0.6)" : undefined, transform: blur ? "scale(1.1)" : undefined }}>
        <BackgroundImage src={src} theme={{ ...theme, imageOpacity: 1 }} zoomFrom={1.04} zoomTo={1.14} position="50% 20%" />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <GeneratedBackground theme={theme} />
      {!blur ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ transform: `translateY(${Math.sin(frame / 20) * unit * 0.016 - unit * 0.11}px) rotate(${Math.sin(frame / 30) * 3}deg)` }}>
            <ProductShot project={project} theme={theme} size={unit * 0.5} />
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
}

const Shade = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)" }} />
);

export function CreatorChip({ creator }: { creator: CastMember | null }) {
  const { unit } = useUnit();
  if (!creator) return null;
  return (
    <div style={{ position: "absolute", top: unit * 0.1, left: unit * 0.04, display: "flex", alignItems: "center", gap: unit * 0.016, zIndex: 30, fontFamily: "Inter, sans-serif", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
      <div style={{ width: unit * 0.07, height: unit * 0.07, borderRadius: "50%", overflow: "hidden", border: `${unit * 0.003}px solid #fff`, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: unit * 0.032 }}>
        {creator.image ? <Img src={asset(creator.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : creator.name.replace("@", "").slice(0, 1).toUpperCase()}
      </div>
      <div>
        <div style={{ fontSize: unit * 0.033, fontWeight: 800 }}>{creator.name}</div>
        {creator.role ? <div style={{ fontSize: unit * 0.026, opacity: 0.85 }}>{creator.role}</div> : null}
      </div>
    </div>
  );
}

/** Story-style progress segments across the top. */
export function ProgressSegments({ segments }: { segments: { from: number; frames: number }[] }) {
  const frame = useCurrentFrame();
  const { unit } = useUnit();
  return (
    <div style={{ position: "absolute", top: unit * 0.05, left: unit * 0.04, right: unit * 0.04, display: "flex", gap: unit * 0.008, zIndex: 30 }}>
      {segments.map((s, i) => (
        <div key={i} style={{ flex: s.frames, height: unit * 0.0065, borderRadius: unit, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#fff", width: `${interpolate(frame, [s.from, s.from + s.frames], [0, 100], clampOpts)}%` }} />
        </div>
      ))}
    </div>
  );
}

/** Opening beat: footage with the hook as white sticker boxes. */
export function UgcHook({ project, theme, durationInFrames }: { project: Project; theme: Theme; durationInFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit } = useUnit();
  const first = project.scenes.find((s) => s.image) ?? null;
  const text = [project.topic, project.hook].filter(Boolean).join(" — ");
  return (
    <AbsoluteFill>
      <Footage scene={first} project={project} theme={theme} blur={false} />
      <Shade />
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: unit * 0.48 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: unit * 0.01, transform: "rotate(-2deg)" }}>
          {wrap(strip(text), 18).map((line, i) => (
            <div key={i} style={{ background: "#fff", color: "#111", fontFamily: "Inter, sans-serif", fontSize: unit * 0.072, fontWeight: 900, padding: `${unit * 0.008}px ${unit * 0.028}px`, borderRadius: unit * 0.016, transform: `scale(${pop(frame, fps, i * 4)})`, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
              {line}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Bold captions a few words at a time; the word being spoken is highlighted. */
function Captions({ text, seconds, theme }: { text: string; seconds?: number; theme: Theme }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { unit } = useUnit();
  const words = strip(text).split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const per = 3;
  const start = VOICE_LEAD * fps;
  const span = (seconds ?? Math.max(0.5, durationInFrames / fps - VOICE_LEAD - 0.4)) * fps;
  const weights = words.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const starts = weights.map((w) => {
    const at = start + (acc / total) * span;
    acc += w;
    return at;
  });
  let current = 0;
  starts.forEach((at, i) => {
    if (frame >= at) current = i;
  });
  const chunk = Math.floor(current / per);
  const shown = words.slice(chunk * per, chunk * per + per);
  const p = pop(frame, fps, starts[chunk * per]);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: unit * 1.1, paddingInline: unit * 0.055 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${unit * 0.006}px ${unit * 0.02}px`, transform: `scale(${0.8 + 0.2 * p})` }}>
        {shown.map((w, i) => {
          const active = chunk * per + i === current;
          return (
            <span
              key={`${chunk}-${i}`}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: unit * 0.085,
                fontWeight: 900,
                textTransform: "uppercase",
                color: active ? "#111" : "#fff",
                background: active ? theme.accent : "transparent",
                borderRadius: unit * 0.015,
                padding: `0 ${unit * 0.013}px`,
                WebkitTextStroke: active ? undefined : `${unit * 0.003}px #000`,
                paintOrder: "stroke fill",
                textShadow: active ? "none" : `0 ${unit * 0.004}px ${unit * 0.012}px rgba(0,0,0,0.8)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Sticker({ text, theme }: { text: string; theme: Theme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit } = useUnit();
  return (
    <div style={{ position: "absolute", top: unit * 0.22, right: unit * 0.045, transform: `rotate(4deg) scale(${pop(frame, fps, 6)})`, background: theme.accent, color: "#111", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: unit * 0.04, padding: `${unit * 0.012}px ${unit * 0.03}px`, borderRadius: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 25 }}>
      {text}
    </div>
  );
}

function ReviewCard({ scene, project, theme }: { scene: Scene; project: Project; theme: Theme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit } = useUnit();
  const p = pop(frame, fps, 0);
  const rating = project.product.rating || 5;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: unit * 0.065 }}>
      <div style={{ width: "100%", background: "rgba(255,255,255,0.96)", color: "#111", borderRadius: unit * 0.04, padding: unit * 0.052, display: "flex", flexDirection: "column", alignItems: "center", gap: unit * 0.028, transform: `translateY(${(1 - p) * unit * 0.28}px)`, opacity: p, boxShadow: "0 30px 80px rgba(0,0,0,0.45)", fontFamily: "Inter, sans-serif" }}>
        <ProductShot project={project} theme={theme} size={unit * 0.28} />
        <div style={{ fontSize: unit * 0.046, fontWeight: 800, textAlign: "center" }}>{project.product.name || project.brand}</div>
        <div style={{ display: "flex", alignItems: "center", gap: unit * 0.018 }}>
          <Stars value={rating} size={unit * 0.058} delay={10} />
          <div style={{ fontSize: unit * 0.037, fontWeight: 700 }}>{rating.toFixed(1)}</div>
        </div>
        {project.product.reviews ? <div style={{ fontSize: unit * 0.03, color: "#555" }}>{project.product.reviews}</div> : null}
        <div style={{ fontSize: unit * 0.04, fontStyle: "italic", textAlign: "center", lineHeight: 1.3, opacity: interpolate(frame, [15, 30], [0, 1], clampOpts) }}>
          “{strip(scene.body)}”
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** One UGC beat: talk / b-roll with captions, or the review card. */
export function UgcBeat({ scene, project, theme, durationInFrames }: { scene: Scene; project: Project; theme: Theme; durationInFrames: number }) {
  const frame = useCurrentFrame();
  const review = scene.layout === "review";
  // b-roll without its own media shows the product; talk falls back to the creator photo.
  const creator = project.cast[0] ?? null;
  const media: Scene | null = scene.image
    ? scene
    : scene.layout === "talk" && creator?.image
      ? { ...scene, image: creator.image }
      : null;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Footage scene={media ?? (review ? project.scenes.find((s) => s.image) ?? null : null)} project={project} theme={theme} blur={review} />
      <Shade />
      {review ? <ReviewCard scene={scene} project={project} theme={theme} /> : <Captions text={scene.body} seconds={scene.voiceSeconds} theme={theme} />}
      {scene.sticker ? <Sticker text={scene.sticker} theme={theme} /> : null}
    </AbsoluteFill>
  );
}

/** Closing card: product, price, Shop now, "Link in bio". */
export function UgcCta({ project, theme }: { project: Project; theme: Theme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit } = useUnit();
  const p = pop(frame, fps, 0);
  const btn = pop(frame, fps, 16);
  const pulse = 1 + 0.05 * Math.sin((frame / fps) * Math.PI * 2.4);
  const arrow = Math.sin((frame / fps) * Math.PI * 3) * unit * 0.013;
  const background = project.scenes.find((s) => s.image) ?? null;
  const product = project.product;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Footage scene={background} project={project} theme={theme} blur />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: unit * 0.065, flexDirection: "column", gap: unit * 0.045, fontFamily: "Inter, sans-serif", color: "#fff" }}>
        <div style={{ fontSize: unit * 0.07, fontWeight: 900, textAlign: "center", textShadow: "0 4px 20px rgba(0,0,0,0.6)", transform: `scale(${p})` }}>{strip(project.cta || "Get yours today")}</div>
        <div style={{ width: "100%", background: "#fff", color: "#111", borderRadius: unit * 0.037, padding: unit * 0.037, display: "flex", alignItems: "center", gap: unit * 0.033, transform: `translateY(${(1 - p) * unit * 0.18}px)`, opacity: p }}>
          <ProductShot project={project} theme={theme} size={unit * 0.2} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: unit * 0.042, fontWeight: 800 }}>{product.name || project.brand}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: unit * 0.016, marginTop: unit * 0.008 }}>
              {product.price ? <div style={{ fontSize: unit * 0.052, fontWeight: 900, color: theme.id === "pastel" ? theme.accent : hexAlpha(theme.accent2, 1) }}>{product.price}</div> : null}
              {product.oldPrice ? <div style={{ fontSize: unit * 0.035, color: "#888", textDecoration: "line-through" }}>{product.oldPrice}</div> : null}
            </div>
          </div>
        </div>
        <div style={{ transform: `scale(${btn * pulse})`, padding: `${unit * 0.03}px ${unit * 0.083}px`, borderRadius: 999, fontSize: unit * 0.052, fontWeight: 900, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: "#111", boxShadow: `0 ${unit * 0.015}px ${unit * 0.046}px ${hexAlpha(theme.accent, 0.6)}` }}>
          Shop now
        </div>
        <div style={{ fontSize: unit * 0.037, fontWeight: 700, transform: `translateY(${arrow}px)`, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{product.url || "Link in bio"} ↓</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
