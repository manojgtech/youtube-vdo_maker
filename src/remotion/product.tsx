import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../shared/themes";
import type { Project } from "../shared/types";
import { Highlight, Stars, useUnit } from "./layouts";
import { ProductShot } from "./ugc";
import { GeneratedBackground, Grain, Monogram, hexAlpha, isLightTheme } from "./visual";

/** Product promo end card: product, price, rating, a pulsing CTA button and the URL. */
export function ProductCta({ project, theme }: { project: Project; theme: Theme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { unit } = useUnit();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const btn = spring({ frame: frame - 18, fps, config: { damping: 12 } });
  const pulse = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2);
  const p = project.product;
  const label = project.cta || `Try ${p.name || project.brand}`;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <GeneratedBackground theme={theme} />
      <Grain />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: unit * 0.045, padding: unit * 0.08, fontFamily: theme.sans }}>
        <div style={{ transform: `scale(${enter})` }}>
          {p.image || p.emoji ? <ProductShot project={project} theme={theme} size={unit * 0.24} /> : <Monogram brand={project.brand} theme={theme} unit={unit} />}
        </div>
        <Highlight text={p.name || project.brand || project.topic} theme={theme} size={unit * 0.085} delay={6} />
        {p.rating > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: unit * 0.016 }}>
            <Stars value={p.rating} size={unit * 0.045} delay={10} />
            {p.reviews ? <span style={{ color: theme.muted, fontSize: unit * 0.03 }}>{p.reviews}</span> : null}
          </div>
        ) : null}
        {p.price ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: unit * 0.02, opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            <span style={{ fontSize: unit * 0.065, fontWeight: 900, color: theme.accent }}>{p.price}</span>
            {p.oldPrice ? <span style={{ fontSize: unit * 0.04, color: theme.muted, textDecoration: "line-through" }}>{p.oldPrice}</span> : null}
          </div>
        ) : null}
        <div
          style={{
            transform: `scale(${btn * pulse})`,
            padding: `${unit * 0.03}px ${unit * 0.075}px`,
            borderRadius: 999,
            fontSize: unit * 0.046,
            fontWeight: 800,
            color: isLightTheme(theme) ? "#fff" : theme.bg,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            boxShadow: `0 ${unit * 0.015}px ${unit * 0.05}px ${hexAlpha(theme.accent, 0.5)}`,
            textAlign: "center",
          }}
        >
          {label} →
        </div>
        {p.url ? <div style={{ fontSize: unit * 0.038, fontWeight: 700, color: theme.ink }}>{p.url}</div> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
