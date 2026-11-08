import { defaultProject, defaultVoice, emptyProduct, emptyYoutube } from "./defaults";
import { LAYOUTS_BY_KIND } from "./themes";
import {
  MAX_SCENES,
  MAX_SCENE_SECONDS,
  MAX_YOUTUBE_SCENES,
  MIN_SCENE_SECONDS,
} from "./types";
import type {
  AspectId,
  CastMember,
  ProductInfo,
  Project,
  Scene,
  ThemeId,
  TransitionId,
  VideoKind,
  VoiceSettings,
  YoutubeInfo,
} from "./types";

export const THEME_IDS: ThemeId[] = [
  "cinematic",
  "neon",
  "editorial",
  "corporate",
  "sunset",
  "chalkboard",
  "terminal",
  "luxury",
  "pastel",
];
const ASPECT_IDS: AspectId[] = ["portrait", "square", "landscape"];
const TRANSITION_IDS: TransitionId[] = ["fade", "slide", "wipe", "zoom"];
const KIND_IDS: VideoKind[] = ["reel", "product", "ugc", "youtube"];

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.slice(0, max) : "";

const oneOf = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T => (allowed.includes(value as T) ? (value as T) : fallback);

const number = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

/** Accepts our own uploads and remote https media only. */
export const safeMediaUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (
    url.startsWith("/uploads/") &&
    /^\/uploads\/[a-z0-9-]+\.(png|jpe?g|webp|gif|avif|mp3|wav|m4a|ogg|mp4|webm|mov)$/i.test(url)
  ) {
    return url;
  }
  if (/^https:\/\/[^\s"'<>]+$/i.test(url)) return url;
  return null;
};

export const isVideoUrl = (url: string | null | undefined): boolean =>
  !!url && /\.(mp4|webm|mov)(\?|$)/i.test(url);

const normalizeCast = (value: unknown): CastMember[] => {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 6)
    .map((entry, index) => {
      const member = (entry ?? {}) as Record<string, unknown>;
      const name = text(member.name, 40).trim();
      if (!name) return null;
      return {
        id: text(member.id, 60) || `cast-${index + 1}`,
        name,
        role: text(member.role, 60).trim(),
        image: safeMediaUrl(member.image),
      } satisfies CastMember;
    })
    .filter((member): member is CastMember => member !== null);
};

const normalizeScenes = (value: unknown, kind: VideoKind): Scene[] => {
  if (!Array.isArray(value)) return [];
  const layouts = LAYOUTS_BY_KIND[kind].map((layout) => layout.id);
  const max = kind === "youtube" ? MAX_YOUTUBE_SCENES : MAX_SCENES;
  return value.slice(0, max).map((entry, index) => {
    const scene = (entry ?? {}) as Record<string, unknown>;
    return {
      id: text(scene.id, 60) || `scene-${index + 1}`,
      heading: text(scene.heading, 120),
      body: text(scene.body, 420),
      image: safeMediaUrl(scene.image),
      duration: number(scene.duration, MIN_SCENE_SECONDS, MAX_SCENE_SECONDS, 4),
      transition: oneOf(scene.transition, TRANSITION_IDS, "fade"),
      castId: text(scene.castId, 60) || null,
      layout: oneOf(scene.layout, layouts, layouts[0]),
      say: text(scene.say, 400).trim(),
      chapter: text(scene.chapter, 60).trim(),
      sticker: text(scene.sticker, 24).trim(),
      device: scene.device === "phone" ? "phone" : "browser",
    } satisfies Scene;
  });
};

const normalizeProduct = (value: unknown): ProductInfo => {
  const p = (value ?? {}) as Record<string, unknown>;
  return {
    name: text(p.name, 60).trim(),
    price: text(p.price, 24).trim(),
    oldPrice: text(p.oldPrice, 24).trim(),
    url: text(p.url, 80).trim(),
    rating: number(p.rating, 0, 5, 0),
    reviews: text(p.reviews, 60).trim(),
    image: safeMediaUrl(p.image),
    emoji: text(p.emoji, 8).trim() || emptyProduct.emoji,
  };
};

const normalizeYoutube = (value: unknown): YoutubeInfo => {
  const y = (value ?? {}) as Record<string, unknown>;
  return {
    channel: text(y.channel, 60).trim(),
    handle: text(y.handle, 40).trim(),
    title: text(y.title, 100).trim(),
    description: text(y.description, 2000).trim(),
    tags: text(y.tags, 400).trim(),
    thumbText: text(y.thumbText, 40).trim(),
    thumbBadge: text(y.thumbBadge, 16).trim(),
    thumbEmoji: text(y.thumbEmoji, 8).trim(),
    thumbImage: safeMediaUrl(y.thumbImage),
    subtitles: y.subtitles !== false,
  };
};

const normalizeVoice = (value: unknown): VoiceSettings => {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    enabled: v.enabled === true,
    // Voice names are passed to SelectVoice; keep them to plain characters.
    name: text(v.name, 60).replace(/[^\w .()-]/g, "").trim(),
    rate: Math.round(number(v.rate, -10, 10, defaultVoice.rate)),
  };
};

export function normalizeProject(input: unknown): Project {
  const value = (input ?? {}) as Record<string, unknown>;
  const kind = oneOf(value.kind, KIND_IDS, "reel");
  const scenes = normalizeScenes(value.scenes, kind);
  const cast = normalizeCast(value.cast);

  return {
    kind,
    topic: text(value.topic, 120).trim(),
    hook: text(value.hook, 160).trim(),
    brand: text(value.brand, 60).trim(),
    cta: text(value.cta, 140).trim(),
    theme: oneOf(value.theme, THEME_IDS, defaultProject.theme),
    aspect: oneOf(value.aspect, ASPECT_IDS, defaultProject.aspect),
    scenes:
      scenes.length > 0
        ? scenes.map((scene) => ({
            ...scene,
            castId: cast.some((member) => member.id === scene.castId)
              ? scene.castId
              : null,
          }))
        : [
            {
              ...defaultProject.scenes[0],
              layout: LAYOUTS_BY_KIND[kind][0].id,
              heading: text(value.topic, 120).trim() || "A story worth telling",
              body: text(value.hook, 420).trim(),
            },
          ],
    cast,
    music: safeMediaUrl(value.music),
    showCaptions: value.showCaptions !== false,
    sfx: value.sfx !== false,
    titleDuration: number(value.titleDuration, 1, 8, 3),
    outroDuration: number(value.outroDuration, 1, 8, 3.5),
    product: normalizeProduct(value.product),
    youtube: normalizeYoutube(value.youtube),
    voice: normalizeVoice(value.voice),
  };
}

export function getProjectErrors(project: Project): string[] {
  const errors: string[] = [];
  if (!project.topic.trim()) errors.push("Give the film a topic.");
  const usable = project.scenes.filter(
    (scene) => scene.heading.trim() || scene.body.trim() || scene.image || scene.say.trim(),
  );
  if (usable.length === 0) errors.push("Add at least one scene with a line or an image.");
  const max = project.kind === "youtube" ? MAX_YOUTUBE_SCENES : MAX_SCENES;
  if (project.scenes.length > max) errors.push(`Keep it to ${max} scenes or fewer.`);
  if ((project.kind === "ugc" || project.kind === "product") && !project.product.name.trim() && !project.brand.trim()) {
    errors.push("Add the product name (or a brand).");
  }
  return errors;
}
