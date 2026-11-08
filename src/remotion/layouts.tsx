import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Theme } from "../shared/themes";
import type { CastMember, Project, Scene } from "../shared/types";
import {
  BackgroundImage,
  BrandMark,
  GeneratedBackground,
  Grain,
  Scrim,
  Vignette,
  asset,
  hexAlpha,
  isLightTheme,
  panelStyle,
} from "./visual";

/* Layouts used by product promos, YouTube videos and reels besides the photo card.
 * Text fields are read from the scene: heading, body (one item per line), image. */

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const useUnit = () => {
  const { width, height } = useVideoConfig();
  return { unit: Math.min(width, height), width, height, wide: width > height * 1.2 };
};

export const lines = (body: string) =>
  body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

function pop(frame: number, fps: number, delay: number) {
  return spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 160, mass: 0.6 } });
}

/** Words with *starred* parts in the accent colour, popping in one by one. */
export function Highlight({
  text,
  theme,
  size,
  delay = 4,
  stagger = 2.5,
  align = "center",
  font,
  weight,
  color,
}: {
  text: string;
  theme: Theme;
  size: number;
  delay?: number;
  stagger?: number;
  align?: "center" | "left";
  font?: string;
  weight?: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let accent = false;
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      if (raw.startsWith("*")) accent = true;
      const on = accent;
      if (/\*[^\p{L}\p{N}]*$/u.test(raw.slice(raw.startsWith("*") ? 1 : 0))) accent = false;
      return { word: raw.replace(/\*/g, ""), on };
    });
  return (
    <div
      style={{
        fontFamily: font ?? theme.display,
        fontSize: size,
        fontWeight: weight ?? (theme.id === "neon" || theme.id === "sunset" ? 400 : 700),
        lineHeight: 1.08,
        letterSpacing: theme.letterSpacing,
        textTransform: theme.uppercase ? "uppercase" : "none",
        color: color ?? theme.ink,
        textAlign: align,
        textWrap: "balance",
      }}
    >
      {words.map((w, i) => {
        const p = pop(frame, fps, delay + i * stagger);
        return (
          <span
            key={`${w.word}-${i}`}
            style={{
              display: "inline-block",
              marginRight: "0.25em",
              opacity: interpolate(p, [0, 0.4], [0, 1], clampOpts),
              transform: `translateY(${(1 - p) * 0.4}em)`,
              filter: p < 0.98 ? `blur(${Math.max(0, 1 - p) * 6}px)` : undefined,
              color: w.on ? theme.accent : undefined,
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}

/** Background, fade in/out and the scene's transition, around any layout. */
export function LayoutShell({
  scene,
  theme,
  brand,
  durationInFrames,
  children,
  align = "center",
  dimImage = 0.75,
}: {
  scene: Scene;
  theme: Theme;
  brand: string;
  durationInFrames: number;
  children: ReactNode;
  align?: "center" | "start";
  dimImage?: number;
}) {
  const frame = useCurrentFrame();
  const { unit } = useUnit();
  const enter = interpolate(frame, [0, 22], [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) });
  const transform =
    scene.transition === "slide"
      ? `translateY(${(1 - enter) * unit * 0.06}px)`
      : scene.transition === "zoom"
        ? `scale(${0.94 + 0.06 * enter})`
        : "none";

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {scene.image && scene.layout !== "screen" ? (
        <>
          <BackgroundImage src={scene.image} theme={theme} move="in" durationInFrames={durationInFrames} />
          <AbsoluteFill style={{ background: theme.bg, opacity: dimImage }} />
        </>
      ) : (
        <GeneratedBackground theme={theme} />
      )}
      <Scrim theme={theme} />
      <Grain />
      <Vignette opacity={isLightTheme(theme) ? 0.12 : 0.4} />
      <AbsoluteFill
        style={{
          padding: unit * 0.075,
          paddingBottom: unit * 0.075 + (theme.letterbox ? unit * 0.055 : 0),
          display: "flex",
          flexDirection: "column",
          justifyContent: align === "center" ? "center" : "flex-start",
          alignItems: "center",
          zIndex: 16,
          transform,
        }}
      >
        <div style={{ position: "absolute", top: unit * 0.075 + (theme.letterbox ? unit * 0.055 : 0), left: unit * 0.075 }}>
          <BrandMark brand={brand} theme={theme} unit={unit} />
        </div>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

const card = (theme: Theme, unit: number): CSSProperties => ({
  ...panelStyle(theme),
  borderRadius: unit * 0.028,
  padding: `${unit * 0.028}px ${unit * 0.034}px`,
});

export function ProblemLayout({ scene, theme, kind }: { scene: Scene; theme: Theme; kind: "problem" | "bullets" }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit, wide } = useUnit();
  const items = lines(scene.body);
  return (
    <div style={{ width: wide ? "70%" : "100%" }}>
      {scene.heading ? (
        <div style={{ marginBottom: unit * 0.05 }}>
          <Highlight text={scene.heading} theme={theme} size={unit * 0.075} align="left" />
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: unit * 0.024 }}>
        {items.map((item, i) => {
          const p = pop(frame, fps, 10 + i * 18);
          return (
            <div
              key={i}
              style={{
                ...card(theme, unit),
                display: "flex",
                alignItems: "center",
                gap: unit * 0.028,
                opacity: interpolate(p, [0, 0.5], [0, 1], clampOpts),
                transform: `translateX(${(1 - p) * -unit * 0.1}px)`,
                border: kind === "problem" ? `1px solid rgba(239,68,68,0.45)` : panelStyle(theme).border,
              }}
            >
              <div
                style={{
                  width: unit * 0.06,
                  height: unit * 0.06,
                  flexShrink: 0,
                  borderRadius: kind === "problem" ? "50%" : unit * 0.016,
                  background: kind === "problem" ? "#ef4444" : `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: theme.sans,
                  fontWeight: 800,
                  fontSize: unit * 0.032,
                }}
              >
                {kind === "problem" ? "✕" : i + 1}
              </div>
              <div style={{ fontFamily: theme.sans, fontSize: unit * 0.042, fontWeight: 600, color: theme.ink, lineHeight: 1.2 }}>{item}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** "⚡ Title — short text" → icon, title, text. */
export const parseFeature = (line: string) => {
  const icon = line.match(/^[^\p{L}\p{N}\s]+/u)?.[0] ?? "";
  const rest = line.slice(icon.length).trim();
  const [title, ...more] = rest.split(/\s+[—–-]\s+|:\s+/);
  return { icon: icon || "✦", title: title?.trim() || rest, text: more.join(" — ").trim() };
};

export function FeaturesLayout({ scene, theme }: { scene: Scene; theme: Theme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit, wide } = useUnit();
  const items = lines(scene.body).map(parseFeature);
  const cols = wide ? Math.min(3, items.length) : 1;
  return (
    <div style={{ width: "100%" }}>
      {scene.heading ? (
        <div style={{ marginBottom: unit * 0.05 }}>
          <Highlight text={scene.heading} theme={theme} size={unit * 0.072} />
        </div>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: unit * 0.026 }}>
        {items.map((item, i) => {
          const p = pop(frame, fps, 10 + i * 16);
          return (
            <div
              key={i}
              style={{
                ...card(theme, unit),
                display: "flex",
                flexDirection: cols > 1 ? "column" : "row",
                alignItems: cols > 1 ? "flex-start" : "center",
                gap: unit * 0.026,
                opacity: interpolate(p, [0, 0.5], [0, 1], clampOpts),
                transform: `translateY(${(1 - p) * unit * 0.06}px) scale(${0.92 + 0.08 * p})`,
              }}
            >
              <div
                style={{
                  width: unit * 0.09,
                  height: unit * 0.09,
                  flexShrink: 0,
                  borderRadius: unit * 0.024,
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: unit * 0.048,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ fontFamily: theme.sans, fontSize: unit * 0.042, fontWeight: 800, color: theme.ink }}>{item.title}</div>
                {item.text ? (
                  <div style={{ fontFamily: theme.sans, fontSize: unit * 0.031, color: theme.muted, marginTop: unit * 0.006 }}>{item.text}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** "48%", "$1.2M", "6 hrs" → prefix, number, suffix, decimals. */
export const parseStat = (value: string) => {
  const match = value.trim().match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!match) return null;
  const raw = match[2].replace(/,/g, "");
  return {
    prefix: match[1],
    value: Number(raw),
    suffix: match[3],
    decimals: raw.includes(".") ? raw.split(".")[1].length : 0,
    grouped: match[2].includes(","),
  };
};

export function StatLayout({ scene, theme }: { scene: Scene; theme: Theme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit } = useUnit();
  const stat = parseStat(scene.heading);
  const p = interpolate(frame, [6, 50], [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) });
  const label = pop(frame, fps, 28);
  const shown = stat
    ? `${stat.prefix}${(stat.value * p).toLocaleString("en-US", {
        minimumFractionDigits: stat.decimals,
        maximumFractionDigits: stat.decimals,
        useGrouping: stat.grouped || stat.value >= 10000,
      })}${stat.suffix}`
    : scene.heading;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: unit * 0.03 }}>
      <div
        style={{
          fontFamily: theme.display,
          fontSize: unit * 0.22,
          fontWeight: theme.id === "neon" || theme.id === "sunset" ? 400 : 800,
          lineHeight: 1,
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {shown}
      </div>
      {scene.body ? (
        <div
          style={{
            fontFamily: theme.sans,
            fontSize: unit * 0.045,
            color: theme.ink,
            textAlign: "center",
            maxWidth: unit * 0.82,
            opacity: label,
            transform: `translateY(${(1 - label) * unit * 0.03}px)`,
          }}
        >
          {scene.body}
        </div>
      ) : null}
    </div>
  );
}

export function Stars({ value, size, delay = 0 }: { value: number; size: number; delay?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: size * 0.12 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <div key={i} style={{ position: "relative", fontSize: size, lineHeight: 1, transform: `scale(${pop(frame, fps, delay + i * 3)})` }}>
            <span style={{ color: "rgba(150,150,150,0.35)" }}>★</span>
            <span style={{ position: "absolute", left: 0, top: 0, width: `${fill * 100}%`, overflow: "hidden", color: "#fbbf24" }}>★</span>
          </div>
        );
      })}
    </div>
  );
}

export function TestimonialLayout({ scene, theme, cast }: { scene: Scene; theme: Theme; cast: CastMember | null }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit, wide } = useUnit();
  const enter = pop(frame, fps, 0);
  const name = cast?.name ?? scene.heading;
  const initials = (name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        ...card(theme, unit),
        width: wide ? "62%" : "100%",
        padding: unit * 0.055,
        display: "flex",
        flexDirection: "column",
        gap: unit * 0.032,
        opacity: enter,
        transform: `scale(${0.92 + 0.08 * enter})`,
      }}
    >
      <Stars value={5} size={unit * 0.055} delay={8} />
      <Highlight text={`“${scene.body}”`} theme={theme} size={unit * 0.05} font={theme.sans} weight={600} align="left" delay={12} stagger={1.6} />
      {name ? (
        <div style={{ display: "flex", alignItems: "center", gap: unit * 0.022 }}>
          <div
            style={{
              width: unit * 0.09,
              height: unit * 0.09,
              borderRadius: "50%",
              overflow: "hidden",
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.sans,
              fontWeight: 800,
              fontSize: unit * 0.034,
              color: "#fff",
            }}
          >
            {cast?.image ? <Img src={asset(cast.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
          </div>
          <div style={{ fontFamily: theme.sans }}>
            <div style={{ fontSize: unit * 0.036, fontWeight: 800, color: theme.ink }}>{name}</div>
            {cast?.role ? <div style={{ fontSize: unit * 0.028, color: theme.muted }}>{cast.role}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ChapterLayout({ scene, theme, number }: { scene: Scene; theme: Theme; number: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit } = useUnit();
  const line = interpolate(frame, [6, 26], [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: unit * 0.024 }}>
      <div
        style={{
          fontFamily: theme.display,
          fontSize: unit * 0.15,
          fontWeight: 800,
          lineHeight: 1,
          color: hexAlpha(theme.accent, 0.95),
          transform: `translateX(${(1 - pop(frame, fps, 0)) * -unit * 0.1}px)`,
        }}
      >
        {String(number).padStart(2, "0")}
      </div>
      <div style={{ width: unit * 0.55 * line, height: unit * 0.01, borderRadius: unit, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})` }} />
      <Highlight text={scene.heading || `Chapter ${number}`} theme={theme} size={unit * 0.1} align="left" delay={10} />
    </div>
  );
}

/* ---- App screen: browser/phone frame, screenshot or mock dashboard, cursor ---- */

function BrowserFrame({ w, h, url, children }: { w: number; h: number; url: string; children: ReactNode }) {
  const bar = w * 0.055;
  return (
    <div style={{ width: w, height: h, borderRadius: w * 0.025, overflow: "hidden", background: "#fff", boxShadow: `0 ${w * 0.04}px ${w * 0.1}px rgba(0,0,0,0.45)`, display: "flex", flexDirection: "column" }}>
      <div style={{ height: bar, background: "#eef0f4", display: "flex", alignItems: "center", gap: bar * 0.22, padding: `0 ${bar * 0.4}px`, flexShrink: 0 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: bar * 0.26, height: bar * 0.26, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ flex: 1, marginLeft: bar * 0.3, height: bar * 0.56, borderRadius: bar * 0.28, background: "#fff", color: "#6b7280", fontSize: bar * 0.3, display: "flex", alignItems: "center", paddingLeft: bar * 0.3, fontFamily: "Inter, sans-serif" }}>
          {url}
        </div>
      </div>
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function PhoneFrame({ h, children }: { h: number; children: ReactNode }) {
  const w = h * 0.49;
  return (
    <div style={{ width: w, height: h, borderRadius: w * 0.14, background: "#0a0a0a", padding: w * 0.035, boxShadow: `0 ${h * 0.03}px ${h * 0.08}px rgba(0,0,0,0.5)` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: w * 0.11, overflow: "hidden", background: "#fff" }}>{children}</div>
    </div>
  );
}

function MockDashboard({ theme, brand, w, phone }: { theme: Theme; brand: string; w: number; phone: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = w / 100;
  const font = phone ? f * 4.2 : f * 2.4;
  const stats = [
    { label: "Revenue", value: 48.2, unit: "k", color: theme.accent },
    { label: "Users", value: 3120, unit: "", color: theme.accent2 },
    { label: "Growth", value: 24, unit: "%", color: "#22c55e" },
  ];
  const bars = [42, 58, 50, 71, 64, 83, 77, 95];
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#f6f7fb", color: "#111827", fontSize: font, fontFamily: "Inter, sans-serif" }}>
      {!phone ? (
        <div style={{ width: "22%", background: "#111827", padding: f * 2, display: "flex", flexDirection: "column", gap: f * 1.6 }}>
          <div style={{ color: "#fff", fontWeight: 800 }}>{brand || "Your app"}</div>
          {["Dashboard", "Projects", "Reports", "Team"].map((item, i) => (
            <div key={item} style={{ color: i === 0 ? "#fff" : "#9ca3af", background: i === 0 ? hexAlpha(theme.accent, 0.35) : "transparent", borderRadius: f * 0.8, padding: `${f * 0.7}px ${f}px` }}>
              {item}
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ flex: 1, padding: phone ? f * 6 : f * 2.6, paddingTop: phone ? f * 14 : f * 2.6, display: "flex", flexDirection: "column", gap: phone ? f * 4 : f * 2 }}>
        <div style={{ fontWeight: 800, fontSize: font * 1.5 }}>Overview</div>
        <div style={{ display: "flex", flexDirection: phone ? "column" : "row", gap: f * 1.8 }}>
          {stats.map((s, i) => {
            const v = s.value * interpolate(frame, [8 + i * 4, 40 + i * 4], [0, 1], clampOpts);
            return (
              <div key={s.label} style={{ flex: 1, background: "#fff", borderRadius: f * 1.4, padding: f * 2, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                <div style={{ color: "#6b7280" }}>{s.label}</div>
                <div style={{ fontWeight: 800, fontSize: font * 1.7, color: s.color }}>
                  {s.value % 1 ? v.toFixed(1) : Math.round(v).toLocaleString("en-US")}
                  {s.unit}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: f * 1.4, padding: f * 2, display: "flex", alignItems: "flex-end", gap: f * 1.4, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${b * pop(frame, fps, 12 + i * 3)}%`,
                borderRadius: f * 0.6,
                background: i === bars.length - 1 ? `linear-gradient(180deg, ${theme.accent2}, ${theme.accent})` : hexAlpha(theme.accent, 0.3),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Cursor({ w, h, start, end }: { w: number; h: number; start: number; end: number }) {
  const frame = useCurrentFrame();
  const path = [
    { x: 0.92, y: 0.95 },
    { x: 0.35, y: 0.32 },
    { x: 0.75, y: 0.72 },
  ];
  const times = path.map((_, i) => start + ((end - start) / (path.length - 1)) * i);
  const ease = { ...clampOpts, easing: Easing.out(Easing.cubic) };
  const x = interpolate(frame, times, path.map((p) => p.x * w), ease);
  const y = interpolate(frame, times, path.map((p) => p.y * h), ease);
  const size = Math.max(w, h) * 0.035;
  return (
    <>
      {times.slice(1).map((at, i) => {
        const r = interpolate(frame, [at, at + 14], [0, 1], clampOpts);
        if (frame < at || r >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: path[i + 1].x * w - size * 1.2,
              top: path[i + 1].y * h - size * 1.2,
              width: size * 2.4,
              height: size * 2.4,
              borderRadius: "50%",
              border: `${size * 0.12}px solid rgba(59,130,246,${1 - r})`,
              transform: `scale(${0.3 + r})`,
            }}
          />
        );
      })}
      <svg width={size} height={size * 1.4} viewBox="0 0 20 28" style={{ position: "absolute", left: x, top: y, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}>
        <path d="M1 1 L1 22 L7 17 L11 26 L15 24 L11 15 L19 15 Z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </>
  );
}

export function ScreenLayout({ scene, theme, project }: { scene: Scene; theme: Theme; project: Project }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { unit, width, height, wide } = useUnit();
  const phone = scene.device === "phone";
  const enter = pop(frame, fps, 4);
  const headH = scene.heading ? unit * 0.2 : 0;
  const maxW = width - unit * 0.16;
  const maxH = height - unit * 0.26 - headH;
  const ratio = wide ? 0.6 : 1.15;
  const browserW = Math.min(maxW, maxH / ratio, wide ? width * 0.68 : maxW);
  const browserH = browserW * ratio;
  const phoneH = Math.min(maxH, maxW / 0.49);
  const innerW = phone ? phoneH * 0.49 * 0.93 : browserW;
  const innerH = phone ? phoneH * 0.93 : browserH - browserW * 0.055;
  const zoom = interpolate(frame, [durationInFrames * 0.4, durationInFrames * 0.85], [1, 1.25], {
    ...clampOpts,
    easing: (x) => x * x * (3 - 2 * x),
  });
  const callout = pop(frame, fps, 24);
  const url = project.product.url || `${(project.brand || "app").toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;

  const screen = (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "70% 70%" }}>
      {scene.image ? (
        <Img src={asset(scene.image)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%" }} />
      ) : (
        <MockDashboard theme={theme} brand={project.brand} w={innerW} phone={phone} />
      )}
      {scene.body ? (
        <div style={{ position: "absolute", left: "55%", top: "42%", transform: `translate(-50%, -100%) scale(${callout})`, transformOrigin: "50% 100%" }}>
          <div style={{ background: theme.accent, color: isLightTheme(theme) ? "#fff" : theme.bg, fontFamily: theme.sans, fontWeight: 800, fontSize: unit * (phone ? 0.03 : 0.028), padding: `${unit * 0.01}px ${unit * 0.024}px`, borderRadius: 999, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            {scene.body.split("\n")[0]}
          </div>
        </div>
      ) : null}
      <Cursor w={innerW} h={innerH} start={20} end={durationInFrames * 0.75} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: unit * 0.04 }}>
      {scene.heading ? <Highlight text={scene.heading} theme={theme} size={unit * 0.068} /> : null}
      <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * unit * 0.15}px) scale(${0.9 + 0.1 * enter})` }}>
        {phone ? <PhoneFrame h={phoneH}>{screen}</PhoneFrame> : <BrowserFrame w={browserW} h={browserH} url={url}>{screen}</BrowserFrame>}
      </div>
    </div>
  );
}
