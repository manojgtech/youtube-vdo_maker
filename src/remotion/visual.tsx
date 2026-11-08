import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import type { Theme } from "../shared/themes";
import type { CastMember } from "../shared/types";

export const NOISE_URI = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="220" height="220" filter="url(#n)" opacity="0.55"/></svg>',
)}`;

/**
 * Same-origin paths (/uploads/…, /voice/…) go through staticFile so they
 * resolve both in the Next.js preview and inside the render bundle.
 */
export const asset = (src: string): string =>
  src.startsWith("/") ? staticFile(src.slice(1)) : src;

export const isVideo = (src: string | null | undefined): boolean =>
  !!src && /\.(mp4|webm|mov)(\?|$)/i.test(src);

export const isLightTheme = (theme: Theme) =>
  theme.id === "editorial" || theme.bg.startsWith("#f");

/** Glass card that works on both light and dark themes. */
export const panelStyle = (theme: Theme): CSSProperties => ({
  background: isLightTheme(theme)
    ? "rgba(255,255,255,0.58)"
    : "rgba(255,255,255,0.075)",
  border: `1px solid ${
    isLightTheme(theme) ? "rgba(27,26,23,0.12)" : "rgba(255,255,255,0.14)"
  }`,
  backdropFilter: "blur(14px)",
  boxShadow: isLightTheme(theme)
    ? "0 18px 60px rgba(27,26,23,0.10)"
    : "0 18px 60px rgba(0,0,0,0.35)",
});

export const Scrim = ({ theme }: { theme: Theme }) => (
  <>
    <AbsoluteFill style={{ background: theme.overlay }} />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 80% at 50% 40%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.28) 100%)",
        opacity: isLightTheme(theme) ? 0.25 : 1,
      }}
    />
  </>
);

/** Film grain that re-rolls every two frames, like real stock. */
export const Grain = () => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 2);
  const x = Math.round(random(`grain-x-${step}`) * 220);
  const y = Math.round(random(`grain-y-${step}`) * 220);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("${NOISE_URI}")`,
        backgroundSize: "220px 220px",
        backgroundPosition: `${x}px ${y}px`,
        opacity: 0.09,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

/** Ken Burns camera moves; scenes cycle through them so no two neighbours move alike. */
export type CameraMove = "in" | "out" | "left" | "right";
export const CAMERA_MOVES: CameraMove[] = ["in", "left", "out", "right"];

const cameraEase = Easing.bezier(0.33, 0, 0.67, 1);

function cameraTransform(move: CameraMove, t: number): string {
  switch (move) {
    case "in":
      return `scale(${1.06 + 0.14 * t})`;
    case "out":
      return `scale(${1.22 - 0.14 * t})`;
    case "left":
      return `scale(1.16) translateX(${3.2 - 6.4 * t}%)`;
    case "right":
      return `scale(1.16) translateX(${-3.2 + 6.4 * t}%)`;
  }
}

export function BackgroundImage({
  src,
  theme,
  zoomFrom = 1.05,
  zoomTo = 1.16,
  pan = 0,
  position = "50% 50%",
  move,
  durationInFrames,
}: {
  src: string | null;
  theme: Theme;
  zoomFrom?: number;
  zoomTo?: number;
  pan?: number;
  /** CSS object-position; people shots use "50% 20%" to keep faces in frame. */
  position?: string;
  /** An eased camera move spread over `durationInFrames` (overrides zoomFrom/zoomTo/pan). */
  move?: CameraMove;
  durationInFrames?: number;
}) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 240], [zoomFrom, zoomTo], {
    extrapolateRight: "extend",
  });
  const translateX = interpolate(frame, [0, 240], [0, pan], {
    extrapolateRight: "extend",
  });

  if (src && isVideo(src)) {
    return (
      <AbsoluteFill style={{ overflow: "hidden", backgroundColor: theme.bg }}>
        <OffthreadVideo
          src={asset(src)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: position, opacity: theme.imageOpacity }}
        />
      </AbsoluteFill>
    );
  }

  if (src) {
    return (
      <AbsoluteFill style={{ overflow: "hidden", backgroundColor: theme.bg }}>
        <Img
          src={asset(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: position,
            transformOrigin: position,
            transform:
              move && durationInFrames
                ? cameraTransform(
                    move,
                    interpolate(frame, [0, durationInFrames], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: cameraEase,
                    }),
                  )
                : `scale(${scale}) translateX(${translateX}px)`,
            opacity: theme.imageOpacity,
            filter: isLightTheme(theme)
              ? "saturate(0.82) contrast(0.98)"
              : "saturate(1.02)",
          }}
        />
      </AbsoluteFill>
    );
  }

  return <GeneratedBackground theme={theme} />;
}

/** Theme-native background for scenes with no photo. */
export function GeneratedBackground({ theme }: { theme: Theme }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        backgroundImage: `radial-gradient(80% 60% at 20% 15%, ${hexAlpha(
          theme.accent,
          0.32,
        )} 0%, rgba(0,0,0,0) 60%), radial-gradient(70% 60% at 90% 85%, ${hexAlpha(
          theme.accent2,
          0.24,
        )} 0%, rgba(0,0,0,0) 62%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(115deg, ${
            isLightTheme(theme) ? "rgba(27,26,23,0.05)" : "rgba(255,255,255,0.035)"
          } 0px, ${
            isLightTheme(theme) ? "rgba(27,26,23,0.05)" : "rgba(255,255,255,0.035)"
          } 1px, transparent 1px, transparent 42px)`,
        }}
      />
    </AbsoluteFill>
  );
}

export function hexAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) {
    return `rgba(255,255,255,${alpha})`;
  }
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AnimatedWords({
  text,
  style,
  delay = 6,
  stagger = 2.4,
  wordDuration = 12,
}: {
  text: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: number;
  wordDuration?: number;
}) {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <div style={{ ...style }}>
      {words.map((word, index) => {
        const start = delay + index * stagger;
        const progress = interpolate(
          frame,
          [start, start + wordDuration],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              opacity: progress,
              transform: `translateY(${(1 - progress) * 0.55}em)`,
              filter: progress < 1 ? `blur(${(1 - progress) * 6}px)` : undefined,
              marginRight: "0.26em",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

export function CastTag({
  member,
  theme,
  unit,
}: {
  member: CastMember;
  theme: Theme;
  unit: number;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [6, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const initials = member.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        ...panelStyle(theme),
        display: "inline-flex",
        alignItems: "center",
        gap: unit * 0.018,
        borderRadius: 999,
        padding: `${unit * 0.012}px ${unit * 0.024}px ${unit * 0.012}px ${
          unit * 0.012
        }px`,
        opacity: progress,
        transform: `translateY(${(1 - progress) * unit * 0.03}px)`,
        marginBottom: unit * 0.032,
      }}
    >
      <div
        style={{
          width: unit * 0.066,
          height: unit * 0.066,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          background: hexAlpha(theme.accent, 0.35),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.sans,
          fontWeight: 700,
          fontSize: unit * 0.022,
          color: theme.ink,
          border: `1px solid ${hexAlpha(theme.accent, 0.5)}`,
        }}
      >
        {member.image ? (
          <Img
            src={asset(member.image)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initials
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: unit * 0.003 }}>
        <span
          style={{
            fontFamily: theme.sans,
            fontSize: unit * 0.019,
            lineHeight: 1.15,
            fontWeight: 600,
            color: theme.ink,
          }}
        >
          {member.name}
        </span>
        {member.role ? (
          <span
            style={{
              fontFamily: theme.sans,
              fontSize: unit * 0.015,
              lineHeight: 1.2,
              color: theme.muted,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            {member.role}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function BrandMark({
  brand,
  theme,
  unit,
  align = "left",
}: {
  brand: string;
  theme: Theme;
  unit: number;
  align?: "left" | "center";
}) {
  if (!brand) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: unit * 0.012,
        justifyContent: align === "center" ? "center" : "flex-start",
        fontFamily: theme.sans,
        fontSize: unit * 0.018,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: theme.ink,
        opacity: 0.9,
      }}
    >
      <span
        style={{
          width: unit * 0.008,
          height: unit * 0.008,
          borderRadius: "50%",
          background: theme.accent,
          display: "inline-block",
        }}
      />
      {brand}
    </div>
  );
}

export function Monogram({
  brand,
  theme,
  unit,
  size,
}: {
  brand: string;
  theme: Theme;
  unit: number;
  size?: number;
}) {
  const initials =
    brand
      .split(/\s+/)
      .filter((word) => word && !["&", "and", "the"].includes(word.toLowerCase()))
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SF";
  const dimension = size ?? unit * 0.18;

  return (
    <div
      style={{
        width: dimension,
        height: dimension,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: hexAlpha(theme.accent, 0.14),
        border: `1px solid ${hexAlpha(theme.accent, 0.55)}`,
        color: theme.ink,
        fontFamily: theme.display,
        fontSize: dimension * 0.36,
        letterSpacing: "-0.02em",
        fontWeight: theme.id === "corporate" ? 600 : 500,
      }}
    >
      {initials}
    </div>
  );
}

export function Letterbox({ color, height }: { color: string; height: number }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height,
          background: color,
          zIndex: 20,
        }}
      />
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          height,
          background: color,
          zIndex: 20,
        }}
      />
    </>
  );
}

export function Vignette({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(115% 95% at 50% 45%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.55) 100%)",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {children}
    </div>
  );
}

const revealEase = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Headline words rising out of a mask, one after another: the classic
 * title-sequence reveal. Render inside a heading so it inherits its type.
 */
export function RevealText({
  text,
  delay = 0,
  stagger = 3,
  duration = 22,
}: {
  text: string;
  delay?: number;
  stagger?: number;
  duration?: number;
}) {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, index) => {
        const start = delay + index * stagger;
        const p = interpolate(frame, [start, start + duration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: revealEase,
        });
        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              overflow: "hidden",
              verticalAlign: "top",
              // Room for descenders inside the mask.
              paddingBottom: "0.14em",
              marginBottom: "-0.14em",
              marginRight: index < words.length - 1 ? "0.24em" : 0,
            }}
          >
            <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 112}%)` }}>{word}</span>
          </span>
        );
      })}
    </>
  );
}
