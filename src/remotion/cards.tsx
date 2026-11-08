import type { CSSProperties } from "react";
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
import type { CastMember, Scene } from "../shared/types";
import {
  AnimatedWords,
  BackgroundImage,
  BrandMark,
  CastTag,
  GeneratedBackground,
  Grain,
  CAMERA_MOVES,
  Monogram,
  RevealText,
  Scrim,
  Vignette,
  hexAlpha,
  isLightTheme,
} from "./visual";

const pad = (unit: number) => unit * 0.075;

const headingSize = (theme: Theme, unit: number) => {
  if (theme.id === "neon") return unit * 0.112;
  if (theme.id === "corporate") return unit * 0.07;
  if (theme.id === "editorial") return unit * 0.076;
  return unit * 0.078;
};

const headingStyle = (theme: Theme, unit: number): CSSProperties => ({
  fontFamily: theme.display,
  fontSize: headingSize(theme, unit),
  lineHeight: theme.id === "neon" ? 0.92 : 1.04,
  fontWeight: theme.id === "corporate" ? 700 : theme.id === "neon" ? 400 : 500,
  letterSpacing: theme.letterSpacing,
  textTransform: theme.uppercase ? "uppercase" : "none",
  color: theme.ink,
  margin: 0,
  textWrap: "balance",
  textShadow: isLightTheme(theme)
    ? "0 1px 0 rgba(255,255,255,0.35)"
    : "0 8px 40px rgba(0,0,0,0.45)",
});

export function TitleCard({
  topic,
  hook,
  brand,
  runtime,
  image,
  theme,
  durationInFrames,
}: {
  topic: string;
  hook: string;
  brand: string;
  runtime: string;
  image: string | null;
  theme: Theme;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const unit = Math.min(width, height);
  const wide = width > height;
  const enter = spring({ frame, fps, config: { damping: 200, stiffness: 90 } });
  const rule = interpolate(enter, [0, 1], [0, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <BackgroundImage src={image} theme={theme} move="out" durationInFrames={durationInFrames} />
      <AbsoluteFill style={{ background: theme.titleOverlay }} />
      <Grain />
      <Vignette opacity={isLightTheme(theme) ? 0.18 : 0.55} />

      <AbsoluteFill
        style={{
          padding: pad(unit),
          paddingBottom: pad(unit) + (theme.letterbox ? unit * 0.055 : 0),
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <BrandMark brand={brand} theme={theme} unit={unit} />
          <span
            style={{
              fontFamily: theme.sans,
              fontSize: unit * 0.014,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: theme.muted,
            }}
          >
            A short film
          </span>
        </div>

        <div style={{ maxWidth: wide ? width * 0.7 : width * 0.92 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: unit * 0.016,
              marginBottom: unit * 0.03,
              opacity: enter,
            }}
          >
            <span
              style={{
                fontFamily: theme.sans,
                fontSize: unit * 0.014,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: theme.accent,
                fontWeight: 600,
              }}
            >
              {hook ? "Presenting" : "Story no. 01"}
            </span>
            <span
              style={{
                height: 1,
                width: unit * 0.16 * rule,
                background: theme.accent,
                opacity: 0.8,
              }}
            />
          </div>

          <h1
            style={{
              ...headingStyle(theme, unit),
              fontSize: headingSize(theme, unit) * 1.34,
            }}
          >
            <RevealText text={topic || "A story worth telling"} delay={4} stagger={3.5} />
          </h1>

          {hook ? (
            <p
              style={{
                fontFamily: theme.sans,
                fontSize: unit * 0.027,
                lineHeight: 1.5,
                color: theme.muted,
                maxWidth: wide ? width * 0.52 : width * 0.8,
                margin: `${unit * 0.03}px 0 0`,
                opacity: interpolate(frame, [8, 26], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {hook}
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            opacity: interpolate(frame, [18, 34], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontFamily: theme.sans,
              fontSize: unit * 0.014,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: theme.muted,
            }}
          >
            {brand || "SceneForge"} · {runtime}
          </span>
          <span
            style={{
              fontFamily: theme.sans,
              fontSize: unit * 0.014,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: theme.accent,
            }}
          >
            01 — The open
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function SceneCard({
  scene,
  cast,
  theme,
  brand,
  index,
  total,
  showCaptions,
  durationInFrames,
}: {
  scene: Scene;
  cast: CastMember | null;
  theme: Theme;
  brand: string;
  index: number;
  total: number;
  showCaptions: boolean;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const unit = Math.min(width, height);
  const wide = width > height;
  const contentLift =
    scene.transition === "slide"
      ? interpolate(frame, [0, 20], [unit * 0.05, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : 0;
  const contentScale =
    scene.transition === "zoom"
      ? interpolate(frame, [0, 26], [0.965, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : 1;

  const chapterRule = interpolate(frame, [4, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <BackgroundImage
        src={scene.image}
        theme={theme}
        move={CAMERA_MOVES[index % CAMERA_MOVES.length]}
        durationInFrames={durationInFrames}
      />
      <Scrim theme={theme} />
      <Grain />
      <Vignette opacity={isLightTheme(theme) ? 0.14 : 0.48} />

      <AbsoluteFill
        style={{
          padding: pad(unit),
          paddingBottom: pad(unit) + (theme.letterbox ? unit * 0.055 : 0),
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          zIndex: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <BrandMark brand={brand} theme={theme} unit={unit} />
          <span
            style={{
              fontFamily: theme.sans,
              fontSize: unit * 0.015,
              letterSpacing: "0.2em",
              color: theme.ink,
              opacity: 0.65,
            }}
          >
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
        </div>

        <div
          style={{
            maxWidth: wide ? width * 0.64 : width * 0.9,
            transform: `translateY(${contentLift}px) scale(${contentScale})`,
            transformOrigin: "left bottom",
          }}
        >
          {cast ? <CastTag member={cast} theme={theme} unit={unit} /> : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: unit * 0.014,
              marginBottom: unit * 0.022,
            }}
          >
            <span
              style={{
                fontFamily: theme.sans,
                fontSize: unit * 0.014,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: theme.accent,
              }}
            >
              Chapter {String(index + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                height: 1,
                width: unit * 0.2 * chapterRule,
                background: theme.accent,
                opacity: 0.85,
              }}
            />
          </div>

          {scene.heading ? (
            <h2 style={headingStyle(theme, unit)}>
              <RevealText text={scene.heading} delay={8} stagger={3} />
            </h2>
          ) : null}

          {showCaptions && scene.body ? (
            <AnimatedWords
              text={scene.body}
              delay={6}
              stagger={2.2}
              style={{
                fontFamily: theme.sans,
                fontSize: unit * 0.03,
                lineHeight: 1.5,
                color: theme.muted,
                marginTop: unit * 0.026,
                maxWidth: wide ? width * 0.5 : width * 0.78,
                textShadow: isLightTheme(theme)
                  ? "none"
                  : "0 4px 24px rgba(0,0,0,0.35)",
              }}
            />
          ) : null}
        </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
}

export function OutroCard({
  brand,
  cta,
  topic,
  theme,
}: {
  brand: string;
  cta: string;
  topic: string;
  theme: Theme;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const unit = Math.min(width, height);
  const wide = width > height;
  const enter = spring({ frame, fps, config: { damping: 200, stiffness: 80 } });
  const pulse = Math.sin(frame / 18) * 0.5 + 0.5;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <GeneratedBackground theme={theme} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(75% 55% at 50% 42%, ${hexAlpha(
            theme.accent,
            0.22,
          )} 0%, rgba(0,0,0,0) 68%)`,
        }}
      />
      <Grain />
      <Vignette opacity={isLightTheme(theme) ? 0.12 : 0.5} />

      <AbsoluteFill
        style={{
          padding: pad(unit),
          paddingBottom: pad(unit) + (theme.letterbox ? unit * 0.055 : 0),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            transform: `scale(${0.9 + enter * 0.1})`,
            opacity: enter,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: wide ? width * 0.62 : width * 0.86,
          }}
        >
          <div style={{ position: "relative", marginBottom: unit * 0.038 }}>
            <div
              style={{
                position: "absolute",
                inset: -unit * 0.03,
                borderRadius: "50%",
                border: `1px solid ${hexAlpha(theme.accent, 0.25 + pulse * 0.2)}`,
                transform: `scale(${1 + pulse * 0.04})`,
              }}
            />
            <Monogram brand={brand} theme={theme} unit={unit} />
          </div>

          <span
            style={{
              fontFamily: theme.sans,
              fontSize: unit * 0.014,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: theme.accent,
              fontWeight: 600,
              marginBottom: unit * 0.024,
            }}
          >
            The last frame
          </span>

          <div
            style={{
              fontFamily: theme.display,
              fontSize: unit * (theme.id === "neon" ? 0.085 : 0.062),
              lineHeight: 1.06,
              letterSpacing: theme.letterSpacing,
              color: theme.ink,
              fontWeight: theme.id === "corporate" ? 700 : 500,
              textTransform: theme.uppercase ? "uppercase" : "none",
              textWrap: "balance",
            }}
          >
            {cta || "Follow the story."}
          </div>

          <div
            style={{
              width: unit * 0.22,
              height: 2,
              background: theme.accent,
              margin: `${unit * 0.038}px 0`,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: unit * 0.01,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: theme.sans,
                fontSize: unit * 0.018,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: theme.ink,
              }}
            >
              {brand || "SceneForge"}
            </span>
            {topic ? (
              <span
                style={{
                  fontFamily: theme.sans,
                  fontSize: unit * 0.017,
                  color: theme.muted,
                  maxWidth: wide ? width * 0.44 : width * 0.7,
                }}
              >
                {topic}
              </span>
            ) : null}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
