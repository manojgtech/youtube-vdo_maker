import type { Scene, SceneLayout, VideoKind } from "./types";

export const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** The layout a new scene starts with for each kind of video. */
const FIRST_LAYOUT: Record<VideoKind, SceneLayout> = {
  reel: "card",
  product: "card",
  ugc: "talk",
  youtube: "card",
};

export const newScene = (index: number, kind: VideoKind = "reel"): Scene => ({
  id: makeId("scene"),
  heading: "",
  body: "",
  image: null,
  duration: 4,
  transition: (["fade", "slide", "wipe", "zoom"] as const)[index % 4],
  castId: null,
  layout: FIRST_LAYOUT[kind],
  say: "",
  chapter: "",
  sticker: "",
  device: "browser",
});

export const clampText = (value: string, max: number) => value.slice(0, max);
