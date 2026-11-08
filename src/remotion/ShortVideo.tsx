import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Theme } from "../shared/themes";
import type { CastMember, Project, Scene } from "../shared/types";
import { FPS } from "../shared/types";
import { VOICE_LEAD, formatSeconds, getTimeline, spokenText } from "../shared/timeline";
import { THEMES } from "../shared/themes";
import { OutroCard, SceneCard, TitleCard } from "./cards";
import {
  ChapterLayout,
  FeaturesLayout,
  LayoutShell,
  ProblemLayout,
  ScreenLayout,
  StatLayout,
  TestimonialLayout,
} from "./layouts";
import { ProductCta } from "./product";
import { CreatorChip, ProgressSegments, UgcBeat, UgcCta, UgcHook } from "./ugc";
import { SfxTrack } from "./sfx";
import { SceneTransition } from "./transitions";
import { Letterbox, asset, hexAlpha } from "./visual";
import { ChapterTag, EndScreen, Subtitles, TalkSegment } from "./youtube";

/** One scene, drawn by its layout. */
function SceneBody({
  project,
  scene,
  theme,
  cast,
  index,
  total,
  frames,
  chapterNumber,
}: {
  project: Project;
  scene: Scene;
  theme: Theme;
  cast: CastMember | null;
  index: number;
  total: number;
  frames: number;
  chapterNumber: number;
}) {
  if (project.kind === "ugc") {
    return <UgcBeat scene={scene} project={project} theme={theme} durationInFrames={frames} />;
  }
  const shell = (children: React.ReactNode, align: "center" | "start" = "center") => (
    <LayoutShell scene={scene} theme={theme} brand={project.brand} durationInFrames={frames} align={align}>
      {children}
    </LayoutShell>
  );
  switch (scene.layout) {
    case "problem":
    case "bullets":
      return shell(<ProblemLayout scene={scene} theme={theme} kind={scene.layout} />);
    case "features":
      return shell(<FeaturesLayout scene={scene} theme={theme} />);
    case "screen":
      return shell(<ScreenLayout scene={scene} theme={theme} project={project} />);
    case "stat":
      return shell(<StatLayout scene={scene} theme={theme} />);
    case "testimonial":
      return shell(<TestimonialLayout scene={scene} theme={theme} cast={cast} />);
    case "chapter":
      return shell(<ChapterLayout scene={scene} theme={theme} number={chapterNumber} />);
    case "talk":
      return <TalkSegment scene={scene} theme={theme} cast={cast} durationInFrames={frames} />;
    default:
      return (
        <SceneCard
          scene={scene}
          cast={cast}
          theme={theme}
          brand={project.brand}
          index={index}
          total={total}
          showCaptions={project.showCaptions}
          durationInFrames={frames}
        />
      );
  }
}

export function ShortVideo(rawProps: Project) {
  const project = rawProps;
  const cast = project.cast ?? [];
  const { width, height, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const theme = THEMES[project.theme] ?? THEMES.cinematic;
  const timeline = getTimeline(project);
  const unit = Math.min(width, height);
  const kind = project.kind ?? "reel";
  const firstImage = project.scenes.find((scene) => scene.image)?.image ?? null;
  const runtime = formatSeconds(durationInFrames / FPS);
  const hasVoice = project.scenes.some((scene) => scene.voiceFile);
  const outroStart = timeline.durationInFrames - timeline.outroFrames;
  const T = timeline.transitionFrames;
  const leak = kind !== "ugc";
  // UGC moves with quick punch-zooms; the other kinds use each scene's own transition.
  const transitionOf = (scene: Scene | undefined) => (kind === "ugc" ? "zoom" : scene?.transition ?? "fade");
  const firstTransition = project.scenes.length ? transitionOf(project.scenes[0]) : "fade";

  // Chapter numbers and the chapter label in effect for each scene (YouTube).
  let chapterCount = 0;
  let currentChapter = "";
  const chapters = project.scenes.map((scene) => {
    if (scene.layout === "chapter") chapterCount += 1;
    const title = scene.chapter || (scene.layout === "chapter" ? scene.heading : "");
    if (title) currentChapter = title;
    return { number: chapterCount, label: currentChapter };
  });

  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        fontFamily: theme.sans,
        overflow: "hidden",
      }}
    >
      {project.music ? (
        <Audio
          src={asset(project.music)}
          loop
          volume={(audioFrame) => {
            const fade = 24;
            const total = timeline.durationInFrames;
            const inAmount = Math.min(1, audioFrame / fade);
            const outAmount = Math.min(1, (total - audioFrame) / fade);
            // Duck the music under a voiceover.
            return Math.max(0, Math.min(inAmount, outAmount)) * (hasVoice ? 0.14 : 0.42);
          }}
        />
      ) : null}

      <SfxTrack project={project} timeline={timeline} />

      <Sequence from={0} durationInFrames={timeline.titleFrames} name="Title" premountFor={30}>
        <SceneTransition enter={null} exit={firstTransition} frames={T} durationInFrames={timeline.titleFrames} theme={theme} leak={leak}>
        {kind === "ugc" ? (
          <UgcHook project={project} theme={theme} durationInFrames={timeline.titleFrames} />
        ) : (
          <TitleCard
            topic={project.topic}
            hook={project.hook}
            brand={project.brand}
            runtime={runtime}
            image={firstImage}
            theme={theme}
            durationInFrames={timeline.titleFrames}
          />
        )}
        </SceneTransition>
      </Sequence>

      {timeline.scenes.map((timing) => {
        const scene = project.scenes[timing.index];
        if (!scene) return null;
        const featured = cast.find((member) => member.id === scene.castId) ?? null;
        const say = spokenText(project, scene);
        const chapter = chapters[timing.index];
        const next = project.scenes[timing.index + 1];
        return (
          <Sequence
            key={timing.id}
            from={timing.start}
            durationInFrames={timing.frames}
            name={`Scene ${timing.index + 1} · ${scene.layout}`}
            premountFor={30}
          >
            <SceneTransition
              enter={transitionOf(scene)}
              exit={next ? transitionOf(next) : kind === "ugc" ? "zoom" : "fade"}
              frames={T}
              durationInFrames={timing.frames}
              theme={theme}
              leak={leak}
            >
            <SceneBody
              project={project}
              scene={scene}
              theme={theme}
              cast={featured}
              index={timing.index}
              total={timeline.scenes.length}
              frames={timing.frames}
              chapterNumber={chapter.number}
            />
            {kind === "youtube" && chapter.label && scene.layout !== "chapter" ? <ChapterTag text={chapter.label} theme={theme} /> : null}
            {kind === "youtube" && project.youtube.subtitles && say ? <Subtitles text={say} seconds={scene.voiceSeconds} /> : null}
            </SceneTransition>
            {scene.voiceFile ? (
              <Sequence from={Math.round(VOICE_LEAD * FPS)} layout="none">
                <Audio src={asset(scene.voiceFile)} />
              </Sequence>
            ) : null}
          </Sequence>
        );
      })}

      <Sequence from={outroStart} durationInFrames={timeline.outroFrames} name="Outro" premountFor={30}>
        <SceneTransition enter={kind === "ugc" ? "zoom" : "fade"} exit={null} frames={T} durationInFrames={timeline.outroFrames} theme={theme} leak={leak} fadeOutToBlack={kind !== "ugc"}>
        {kind === "ugc" ? (
          <UgcCta project={project} theme={theme} />
        ) : kind === "product" ? (
          <ProductCta project={project} theme={theme} />
        ) : kind === "youtube" ? (
          <EndScreen project={project} theme={theme} />
        ) : (
          <OutroCard brand={project.brand} cta={project.cta} topic={project.topic} theme={theme} />
        )}
        </SceneTransition>
      </Sequence>

      {kind === "ugc" ? (
        <>
          <ProgressSegments
            segments={[
              { from: 0, frames: timeline.titleFrames },
              ...timeline.scenes.map((s) => ({ from: s.start, frames: s.frames })),
              { from: outroStart, frames: timeline.outroFrames },
            ]}
          />
          <CreatorChip creator={cast[0] ?? null} />
        </>
      ) : null}

      {theme.letterbox && kind !== "ugc" ? <Letterbox color="#000000" height={unit * 0.055} /> : null}

      {kind !== "ugc" ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: Math.max(3, unit * 0.005),
            background: hexAlpha(theme.ink.startsWith("#") ? theme.ink : "#ffffff", 0.16),
            zIndex: 40,
          }}
        >
          <div style={{ height: "100%", width: `${progress * 100}%`, background: theme.accent }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
