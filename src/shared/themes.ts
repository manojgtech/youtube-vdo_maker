import type { ThemeId } from "./types";

export type Theme = {
  id: ThemeId;
  label: string;
  blurb: string;
  /** Colours used for the swatch in the form, in order. */
  swatch: [string, string, string];
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
  /** Gradient laid over imagery so type stays legible. */
  overlay: string;
  /** 0–1. Editorial is intentionally washed out. */
  imageOpacity: number;
  display: string;
  sans: string;
  uppercase: boolean;
  letterSpacing: string;
  letterbox: boolean;
  /** Extra treatment for the title card. */
  titleOverlay: string;
};

const SANS = "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";

const BASE_THEMES = {
  cinematic: {
    id: "cinematic",
    label: "Cinematic",
    blurb: "Warm film stock, serif titles, slow push-ins.",
    swatch: ["#0a0b0d", "#e0a45e", "#f6f1e6"],
    bg: "#08090b",
    ink: "#f6f1e6",
    muted: "rgba(246, 241, 230, 0.72)",
    accent: "#e0a45e",
    accent2: "#c9814a",
    overlay:
      "linear-gradient(180deg, rgba(8,9,11,0.42) 0%, rgba(8,9,11,0.18) 38%, rgba(8,9,11,0.9) 100%)",
    imageOpacity: 1,
    display: '"Playfair Display", "Iowan Old Style", Georgia, serif',
    sans: SANS,
    uppercase: false,
    letterSpacing: "-0.02em",
    letterbox: true,
    titleOverlay:
      "radial-gradient(120% 90% at 20% 100%, rgba(224,164,94,0.24) 0%, rgba(8,9,11,0) 62%), linear-gradient(180deg, rgba(8,9,11,0.5), rgba(8,9,11,0.96))",
  },
  neon: {
    id: "neon",
    label: "Neon Pop",
    blurb: "Oversized type, magenta glow, after-dark energy.",
    swatch: ["#08050f", "#ff3d8b", "#35e6ff"],
    bg: "#08050f",
    ink: "#f8f2ff",
    muted: "rgba(248, 242, 255, 0.74)",
    accent: "#ff3d8b",
    accent2: "#35e6ff",
    overlay:
      "linear-gradient(180deg, rgba(8,5,15,0.55) 0%, rgba(8,5,15,0.25) 42%, rgba(8,5,15,0.94) 100%)",
    imageOpacity: 0.72,
    display: '"Bebas Neue", Impact, "Arial Narrow", sans-serif',
    sans: SANS,
    uppercase: true,
    letterSpacing: "0.01em",
    letterbox: false,
    titleOverlay:
      "radial-gradient(80% 70% at 80% 10%, rgba(53,230,255,0.26) 0%, rgba(8,5,15,0) 60%), radial-gradient(90% 80% at 10% 90%, rgba(255,61,139,0.32) 0%, rgba(8,5,15,0) 64%), linear-gradient(180deg, rgba(8,5,15,0.7), rgba(8,5,15,0.98))",
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    blurb: "Paper tones, rust accents, magazine layouts.",
    swatch: ["#f4efe5", "#b5482c", "#1b1a17"],
    bg: "#f4efe5",
    ink: "#1b1a17",
    muted: "rgba(27, 26, 23, 0.66)",
    accent: "#b5482c",
    accent2: "#7c7a5c",
    overlay:
      "linear-gradient(180deg, rgba(244,239,229,0.28) 0%, rgba(244,239,229,0.72) 46%, rgba(244,239,229,0.97) 100%)",
    imageOpacity: 0.9,
    display: '"Playfair Display", "Iowan Old Style", Georgia, serif',
    sans: SANS,
    uppercase: false,
    letterSpacing: "-0.015em",
    letterbox: false,
    titleOverlay:
      "radial-gradient(100% 80% at 85% 15%, rgba(181,72,44,0.16) 0%, rgba(244,239,229,0) 60%), linear-gradient(180deg, rgba(244,239,229,0.86), rgba(244,239,229,1))",
  },
  corporate: {
    id: "corporate",
    label: "Signal",
    blurb: "Clean product-launch look with cool blue light.",
    swatch: ["#08101f", "#5b9dff", "#7ef0c0"],
    bg: "#08101f",
    ink: "#f4f8ff",
    muted: "rgba(244, 248, 255, 0.7)",
    accent: "#5b9dff",
    accent2: "#7ef0c0",
    overlay:
      "linear-gradient(180deg, rgba(8,16,31,0.5) 0%, rgba(8,16,31,0.35) 40%, rgba(8,16,31,0.95) 100%)",
    imageOpacity: 0.85,
    display: SANS,
    sans: SANS,
    uppercase: false,
    letterSpacing: "-0.03em",
    letterbox: false,
    titleOverlay:
      "radial-gradient(80% 70% at 15% 15%, rgba(91,157,255,0.28) 0%, rgba(8,16,31,0) 60%), radial-gradient(70% 60% at 90% 80%, rgba(126,240,192,0.18) 0%, rgba(8,16,31,0) 62%), linear-gradient(180deg, rgba(8,16,31,0.78), rgba(8,16,31,1))",
  },
} satisfies Partial<Record<ThemeId, Theme>>;

const darkOverlay = (rgb: string) =>
  `linear-gradient(180deg, rgba(${rgb},0.5) 0%, rgba(${rgb},0.25) 40%, rgba(${rgb},0.94) 100%)`;

const EXTRA_THEMES = {
  sunset: {
    id: "sunset",
    label: "Sunset",
    blurb: "Orange-to-violet sky, bold condensed type. Travel, lifestyle, UGC.",
    swatch: ["#ff7e5f", "#ffe66d", "#5b1a8c"],
    bg: "#3a1250",
    ink: "#ffffff",
    muted: "rgba(255, 240, 248, 0.8)",
    accent: "#ffe66d",
    accent2: "#ff4d8d",
    overlay: darkOverlay("58,18,80"),
    imageOpacity: 0.9,
    display: '"Bebas Neue", Impact, "Arial Narrow", sans-serif',
    sans: SANS,
    uppercase: true,
    letterSpacing: "0.01em",
    letterbox: false,
    titleOverlay:
      "radial-gradient(90% 70% at 50% 20%, rgba(255,230,109,0.35) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(255,126,95,0.75), rgba(91,26,140,0.98))",
  },
  chalkboard: {
    id: "chalkboard",
    label: "Chalkboard",
    blurb: "Green board, handwritten chalk type. Lessons and explainers.",
    swatch: ["#1f3b2d", "#fde68a", "#f1f5f0"],
    bg: "#1f3b2d",
    ink: "#f1f5f0",
    muted: "rgba(241, 245, 240, 0.78)",
    accent: "#fde68a",
    accent2: "#93c5fd",
    overlay: darkOverlay("31,59,45"),
    imageOpacity: 0.75,
    display: '"Caveat", "Segoe Print", cursive',
    sans: SANS,
    uppercase: false,
    letterSpacing: "0em",
    letterbox: false,
    titleOverlay:
      "radial-gradient(70% 50% at 30% 30%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(31,59,45,0.82), rgba(31,59,45,1))",
  },
  terminal: {
    id: "terminal",
    label: "Terminal",
    blurb: "Black screen, green mono type. Tech, coding, cyber.",
    swatch: ["#020a02", "#22c55e", "#d1fae5"],
    bg: "#020a02",
    ink: "#d1fae5",
    muted: "rgba(209, 250, 229, 0.72)",
    accent: "#22c55e",
    accent2: "#a3e635",
    overlay: darkOverlay("2,10,2"),
    imageOpacity: 0.6,
    display: '"JetBrains Mono", Consolas, monospace',
    sans: '"JetBrains Mono", Consolas, monospace',
    uppercase: false,
    letterSpacing: "-0.02em",
    letterbox: false,
    titleOverlay:
      "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, transparent 2px, transparent 6px), linear-gradient(180deg, rgba(2,10,2,0.8), rgba(2,10,2,1))",
  },
  luxury: {
    id: "luxury",
    label: "Luxury",
    blurb: "Black and gold, serif titles. Premium products, quotes.",
    swatch: ["#0a0a0a", "#d4af37", "#f5f5f4"],
    bg: "#0a0a0a",
    ink: "#f5f5f4",
    muted: "rgba(245, 245, 244, 0.7)",
    accent: "#d4af37",
    accent2: "#f5e6c4",
    overlay: darkOverlay("10,10,10"),
    imageOpacity: 0.85,
    display: '"Playfair Display", "Iowan Old Style", Georgia, serif',
    sans: SANS,
    uppercase: false,
    letterSpacing: "-0.01em",
    letterbox: true,
    titleOverlay:
      "radial-gradient(80% 60% at 50% 40%, rgba(212,175,55,0.2) 0%, rgba(0,0,0,0) 62%), linear-gradient(180deg, rgba(10,10,10,0.6), rgba(10,10,10,0.98))",
  },
  pastel: {
    id: "pastel",
    label: "Pastel",
    blurb: "Soft pink and sky, dark type. Beauty, wellness, lifestyle.",
    swatch: ["#fdf2f8", "#db2777", "#7c3aed"],
    bg: "#fdf2f8",
    ink: "#1f2937",
    muted: "rgba(31, 41, 55, 0.68)",
    accent: "#db2777",
    accent2: "#7c3aed",
    overlay:
      "linear-gradient(180deg, rgba(253,242,248,0.25) 0%, rgba(253,242,248,0.7) 46%, rgba(253,242,248,0.97) 100%)",
    imageOpacity: 0.92,
    display: SANS,
    sans: SANS,
    uppercase: false,
    letterSpacing: "-0.03em",
    letterbox: false,
    titleOverlay:
      "radial-gradient(90% 70% at 85% 15%, rgba(124,58,237,0.18) 0%, rgba(253,242,248,0) 60%), linear-gradient(180deg, rgba(253,242,248,0.85), rgba(224,242,254,1))",
  },
} satisfies Partial<Record<ThemeId, Theme>>;

export const THEMES: Record<ThemeId, Theme> = { ...BASE_THEMES, ...EXTRA_THEMES };

export const THEME_LIST: Theme[] = [
  THEMES.cinematic,
  THEMES.neon,
  THEMES.editorial,
  THEMES.corporate,
  THEMES.sunset,
  THEMES.chalkboard,
  THEMES.terminal,
  THEMES.luxury,
  THEMES.pastel,
];

export const KINDS = [
  { id: "reel" as const, label: "Reel / short film", note: "Photo scenes, captions, title and end card" },
  { id: "product" as const, label: "Product / SaaS promo", note: "Pain points, app demo, features, proof, CTA" },
  { id: "ugc" as const, label: "UGC ad", note: "Creator footage, bold captions, review, price card" },
  { id: "youtube" as const, label: "YouTube video", note: "16:9, chapters, subtitles, end screen, thumbnail" },
];

export const LAYOUTS = {
  card: { id: "card" as const, label: "Photo card", hint: "Image, headline and caption." },
  problem: { id: "problem" as const, label: "Pain points", hint: "Headline + one pain point per caption line." },
  bullets: { id: "bullets" as const, label: "Numbered list", hint: "Headline + one point per caption line." },
  features: { id: "features" as const, label: "Feature cards", hint: "One per caption line: ⚡ Title — short text" },
  screen: { id: "screen" as const, label: "App screen", hint: "Image = screenshot (or a mock dashboard). Caption = callout label." },
  stat: { id: "stat" as const, label: "Big number", hint: "Headline = number like 48% or 6 hrs. Caption = what it means." },
  testimonial: { id: "testimonial" as const, label: "Testimonial", hint: "Caption = quote. Pick the person under Featuring." },
  talk: { id: "talk" as const, label: "Talking / footage", hint: "Image or video of a person. Caption is shown word by word." },
  broll: { id: "broll" as const, label: "B-roll", hint: "Product in use. No image = product floats on the background." },
  review: { id: "review" as const, label: "Review card", hint: "Caption = one-line review, shown with stars and the product." },
  chapter: { id: "chapter" as const, label: "Chapter title", hint: "Headline = chapter name. Starts a YouTube chapter." },
};

type LayoutEntry = (typeof LAYOUTS)[keyof typeof LAYOUTS];

export const LAYOUTS_BY_KIND: Record<"reel" | "product" | "ugc" | "youtube", LayoutEntry[]> = {
  reel: [LAYOUTS.card, LAYOUTS.bullets, LAYOUTS.stat],
  product: [LAYOUTS.card, LAYOUTS.problem, LAYOUTS.screen, LAYOUTS.features, LAYOUTS.stat, LAYOUTS.testimonial],
  ugc: [LAYOUTS.talk, LAYOUTS.broll, LAYOUTS.review],
  youtube: [
    LAYOUTS.card,
    LAYOUTS.chapter,
    LAYOUTS.talk,
    LAYOUTS.bullets,
    LAYOUTS.screen,
    LAYOUTS.features,
    LAYOUTS.stat,
    LAYOUTS.testimonial,
  ],
};

export const ASPECTS = [
  { id: "portrait" as const, label: "Portrait", ratio: "9:16", note: "Reels · Shorts · TikTok" },
  { id: "square" as const, label: "Square", ratio: "1:1", note: "Feed posts" },
  { id: "landscape" as const, label: "Landscape", ratio: "16:9", note: "YouTube · web" },
];

export const TRANSITIONS = [
  { id: "fade" as const, label: "Dip to black" },
  { id: "slide" as const, label: "Slide up" },
  { id: "wipe" as const, label: "Accent wipe" },
  { id: "zoom" as const, label: "Push in" },
];
