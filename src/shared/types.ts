/**
 * Shared domain types.
 *
 * These live outside `src/remotion` so the Next.js form, the API
 * normaliser and the Remotion composition all speak the same language.
 */

export const FPS = 30;
export const MIN_SCENE_SECONDS = 1.5;
export const MAX_SCENE_SECONDS = 12;
/** A scene with a voiceover may run longer than the slider allows. */
export const MAX_VOICED_SECONDS = 45;
export const MAX_SCENES = 10;
export const MAX_YOUTUBE_SCENES = 24;

export type ThemeId =
  | "cinematic"
  | "neon"
  | "editorial"
  | "corporate"
  | "sunset"
  | "chalkboard"
  | "terminal"
  | "luxury"
  | "pastel";
export type AspectId = "portrait" | "square" | "landscape";
export type TransitionId = "fade" | "slide" | "wipe" | "zoom";

/** What kind of video the project is. Each kind has its own layouts and end card. */
export type VideoKind = "reel" | "product" | "ugc" | "youtube";

/**
 * How one scene is drawn.
 *  card        photo + headline + caption (the original SceneForge scene)
 *  problem     headline + pain points (one per caption line)
 *  bullets     headline + numbered points (one per caption line)
 *  features    headline + feature cards ("⚡ Title — text" per caption line)
 *  screen      app screenshot (or mock dashboard) in a browser/phone frame
 *  stat        big animated number (headline) + label (caption)
 *  testimonial quote (caption) + featured person + stars
 *  talk        footage of a person talking, word-by-word captions or lower third
 *  broll       footage or floating product shot with captions
 *  review      star-rating product card with a one-line review (caption)
 *  chapter     YouTube section card (headline)
 */
export type SceneLayout =
  | "card"
  | "problem"
  | "bullets"
  | "features"
  | "screen"
  | "stat"
  | "testimonial"
  | "talk"
  | "broll"
  | "review"
  | "chapter";

export type CastMember = {
  id: string;
  name: string;
  role: string;
  image: string | null;
};

export type Scene = {
  id: string;
  heading: string;
  body: string;
  /** Image or (UGC/YouTube talk & b-roll) video. */
  image: string | null;
  /** Seconds on screen. */
  duration: number;
  transition: TransitionId;
  castId: string | null;
  layout: SceneLayout;
  /** Voiceover line. Empty = no voice for this scene (UGC falls back to the caption). */
  say: string;
  /** YouTube: starts a chapter with this title. */
  chapter: string;
  /** UGC: small corner label, e.g. "Day 3". */
  sticker: string;
  /** Screen layout frame. */
  device: "browser" | "phone";
  /** Filled in by the renderer after text-to-speech. */
  voiceFile?: string | null;
  voiceSeconds?: number;
};

export type ProductInfo = {
  name: string;
  price: string;
  oldPrice: string;
  url: string;
  /** 0–5, 0 hides the stars. */
  rating: number;
  reviews: string;
  image: string | null;
  /** Shown when there is no product image. */
  emoji: string;
};

export type YoutubeInfo = {
  channel: string;
  handle: string;
  title: string;
  description: string;
  tags: string;
  thumbText: string;
  thumbBadge: string;
  thumbEmoji: string;
  thumbImage: string | null;
  subtitles: boolean;
};

export type VoiceSettings = {
  enabled: boolean;
  /** Installed Windows voice, e.g. "Microsoft Zira Desktop". Empty = system default. */
  name: string;
  /** -10 (slow) to 10 (fast). */
  rate: number;
};

export type Project = {
  kind: VideoKind;
  topic: string;
  hook: string;
  brand: string;
  cta: string;
  theme: ThemeId;
  aspect: AspectId;
  scenes: Scene[];
  cast: CastMember[];
  /** Optional background music. A same-origin upload or an https URL. */
  music: string | null;
  showCaptions: boolean;
  /** Whooshes and hits on transitions. */
  sfx: boolean;
  /** Seconds. */
  titleDuration: number;
  /** Seconds. */
  outroDuration: number;
  product: ProductInfo;
  youtube: YoutubeInfo;
  voice: VoiceSettings;
};

export type SceneTiming = {
  id: string;
  index: number;
  /** Absolute frame where the scene begins. */
  start: number;
  frames: number;
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  titleFrames: number;
  outroFrames: number;
  /** Frames each segment overlaps the next one during a transition. */
  transitionFrames: number;
  scenes: SceneTiming[];
  durationInFrames: number;
};

export type Format = {
  width: number;
  height: number;
  label: string;
  ratio: string;
};
