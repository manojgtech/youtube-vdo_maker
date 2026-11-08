import { presetUrl } from "./presets";
import type { Project, ProductInfo, Scene, VideoKind, VoiceSettings, YoutubeInfo } from "./types";

const scene = (id: string, fields: Partial<Scene>): Scene => ({
  id,
  heading: "",
  body: "",
  image: null,
  duration: 4,
  transition: "fade",
  castId: null,
  layout: "card",
  say: "",
  chapter: "",
  sticker: "",
  device: "browser",
  ...fields,
});

export const emptyProduct: ProductInfo = {
  name: "",
  price: "",
  oldPrice: "",
  url: "",
  rating: 0,
  reviews: "",
  image: null,
  emoji: "🛍️",
};

export const emptyYoutube: YoutubeInfo = {
  channel: "",
  handle: "",
  title: "",
  description: "",
  tags: "",
  thumbText: "",
  thumbBadge: "",
  thumbEmoji: "",
  thumbImage: null,
  subtitles: true,
};

export const defaultVoice: VoiceSettings = { enabled: false, name: "", rate: 0 };

/** Reel / short film: the original SceneForge sample. */
export const defaultProject: Project = {
  kind: "reel",
  topic: "The quiet luxury of slow mornings",
  hook: "A short film about doing less, better.",
  brand: "Alder & Wren",
  cta: "Start your slow morning — alderandwren.com",
  theme: "cinematic",
  aspect: "portrait",
  showCaptions: true,
  sfx: true,
  titleDuration: 3,
  outroDuration: 3.5,
  music: null,
  product: emptyProduct,
  youtube: emptyYoutube,
  voice: defaultVoice,
  cast: [
    {
      id: "cast-mara",
      name: "Mara Ellison",
      role: "Founder, Alder & Wren",
      image: presetUrl("portrait-w"),
    },
    {
      id: "cast-jonah",
      name: "Jonah Reed",
      role: "Creative director",
      image: presetUrl("portrait-m"),
    },
  ],
  scenes: [
    scene("scene-1", {
      heading: "Before the world wakes",
      body: "There is a version of the morning that belongs to no one but you.",
      image: presetUrl("coffee"),
    }),
    scene("scene-2", {
      heading: "A slower kind of luxury",
      body: "Linen, low light, and a cup that is allowed to go cold.",
      image: presetUrl("interior"),
      duration: 4.5,
      transition: "slide",
      castId: "cast-mara",
    }),
    scene("scene-3", {
      heading: "Made for the everyday",
      body: "Objects with weight. Rituals with room to breathe.",
      image: presetUrl("table"),
      transition: "wipe",
    }),
    scene("scene-4", {
      heading: "Your morning, considered",
      body: "Alder & Wren. Essentials for the hours that set the tone.",
      image: presetUrl("coast"),
      transition: "zoom",
      castId: "cast-jonah",
    }),
  ],
};

/** SaaS / product promo sample. Numbers and the quote are marked as samples. */
export const productSample: Project = {
  ...defaultProject,
  kind: "product",
  topic: "Still tracking work in spreadsheets?",
  hook: "There is a faster way.",
  brand: "TaskFlow",
  cta: "Try TaskFlow free",
  theme: "corporate",
  aspect: "portrait",
  voice: { enabled: true, name: "Microsoft Zira Desktop", rate: 1 },
  product: {
    ...emptyProduct,
    name: "TaskFlow",
    price: "Free plan",
    url: "taskflow.example",
    emoji: "✅",
  },
  cast: [{ id: "cast-priya", name: "Priya Sharma", role: "Ops lead (sample)", image: presetUrl("portrait-w") }],
  scenes: [
    scene("p-1", {
      layout: "problem",
      heading: "Sound familiar?",
      body: "Missed deadlines\nEndless status meetings\nNobody knows who owns what",
      say: "Missed deadlines. Endless status meetings. Nobody knows who owns what.",
      duration: 4.5,
    }),
    scene("p-2", {
      layout: "screen",
      heading: "Meet TaskFlow",
      body: "Live progress",
      say: "TaskFlow shows every project, owner and deadline on one live dashboard.",
      duration: 5,
      transition: "slide",
    }),
    scene("p-3", {
      layout: "features",
      heading: "Everything in one place",
      body: "⚡ Automations — Skip the busywork\n📊 Live reports — No more status meetings\n🤝 Team inbox — Every update in one feed",
      say: "Automate the busywork, get live reports, and keep every update in one feed.",
      duration: 5,
      transition: "wipe",
    }),
    scene("p-4", {
      layout: "stat",
      heading: "6 hrs",
      body: "saved per person, every week (example)",
      say: "Teams save hours every week.",
      duration: 3.5,
      transition: "zoom",
    }),
    scene("p-5", {
      layout: "testimonial",
      body: "We cut our weekly meetings in half within a month.",
      castId: "cast-priya",
      say: "We cut our weekly meetings in half within a month.",
    }),
  ],
};

/** UGC-style product ad sample. */
export const ugcSample: Project = {
  ...defaultProject,
  kind: "ugc",
  topic: "I stopped buying café coffee",
  hook: "here's why",
  brand: "Brewly",
  cta: "Grab it before the sale ends",
  theme: "sunset",
  aspect: "portrait",
  titleDuration: 2.5,
  outroDuration: 4,
  voice: { enabled: true, name: "Microsoft David Desktop", rate: 1 },
  product: {
    name: "Brewly Cold Brew Kit",
    price: "₹899",
    oldPrice: "₹1,299",
    url: "",
    rating: 4.8,
    reviews: "2,300+ reviews (sample)",
    image: null,
    emoji: "☕",
  },
  cast: [{ id: "cast-me", name: "@yourhandle", role: "Your Name", image: presetUrl("portrait-m") }],
  scenes: [
    scene("u-1", {
      layout: "talk",
      body: "I was spending almost three thousand rupees a month on cold coffee.",
      image: presetUrl("portrait-m"),
      castId: "cast-me",
    }),
    scene("u-2", {
      layout: "broll",
      body: "Then I found this kit. Add coffee, add water, leave it overnight.",
      sticker: "Day 1",
    }),
    scene("u-3", {
      layout: "talk",
      body: "Next morning it tastes smooth and not bitter at all.",
      image: presetUrl("coffee"),
      sticker: "Day 2",
    }),
    scene("u-4", {
      layout: "review",
      body: "Honestly better than my usual café order.",
    }),
  ],
};

/** YouTube explainer sample. */
export const youtubeSample: Project = {
  ...defaultProject,
  kind: "youtube",
  topic: "Why your team keeps missing deadlines",
  hook: "and three fixes that work",
  brand: "TaskFlow",
  cta: "Try TaskFlow free — link in the description",
  theme: "corporate",
  aspect: "landscape",
  outroDuration: 6,
  voice: { enabled: true, name: "Microsoft David Desktop", rate: 0 },
  product: { ...emptyProduct, name: "TaskFlow", url: "taskflow.example" },
  youtube: {
    channel: "Your Name",
    handle: "@yourchannel",
    title: "How to Stop Missing Deadlines (3 Simple Fixes)",
    description: "Three simple fixes for teams that keep missing deadlines, plus a quick look at TaskFlow.",
    tags: "project management, productivity, team workflow",
    thumbText: "Stop *missing* deadlines",
    thumbBadge: "3 FIXES",
    thumbEmoji: "⏰",
    thumbImage: presetUrl("portrait-m"),
    subtitles: true,
  },
  cast: [{ id: "cast-host", name: "Your Name", role: "Host", image: presetUrl("portrait-m") }],
  scenes: [
    scene("y-1", {
      layout: "talk",
      image: presetUrl("portrait-m"),
      castId: "cast-host",
      say: "If your team keeps missing deadlines, it is usually not about effort. Here are three simple fixes.",
    }),
    scene("y-2", { layout: "chapter", heading: "One owner per task", say: "Fix number one. One owner per task." }),
    scene("y-3", {
      layout: "bullets",
      heading: "Shared tasks get dropped",
      body: "Every task gets one name\nOwners set their own dates\nReview owners weekly",
      say: "When a task belongs to everyone, it belongs to no one. Give every task one owner, and review it weekly.",
    }),
    scene("y-4", { layout: "chapter", heading: "Make progress visible", say: "Fix number two. Make progress visible." }),
    scene("y-5", {
      layout: "screen",
      heading: "One live dashboard",
      body: "Live progress",
      say: "A live dashboard replaces most status meetings. Everyone can see what is on track.",
    }),
    scene("y-6", { layout: "chapter", heading: "Automate the busywork", say: "Fix number three. Automate the busywork." }),
    scene("y-7", {
      layout: "features",
      heading: "Let the tool do it",
      body: "⚡ Auto reminders — Before every due date\n🔁 Recurring tasks — Set once\n📨 Weekly digest — Every Monday",
      say: "Reminders, recurring tasks and a weekly digest remove the small jobs that slow everyone down.",
    }),
  ],
};

export const SAMPLES: Record<VideoKind, Project> = {
  reel: defaultProject,
  product: productSample,
  ugc: ugcSample,
  youtube: youtubeSample,
};

export const emptyProject: Project = {
  ...defaultProject,
  topic: "",
  hook: "",
  brand: "",
  cta: "",
  music: null,
  cast: [],
  scenes: [scene("scene-1", {})],
};
