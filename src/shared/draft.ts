import { makeId } from "./ids";
import { IMAGE_PRESETS } from "./presets";
import type { Project, Scene, SceneLayout, ThemeId, TransitionId, VideoKind } from "./types";

type Recipe = { heading: string; body: string };
type KindRecipe = { layout: SceneLayout; heading: string; body: string; say?: string; sticker?: string; chapter?: string };

/** Structures for the non-reel kinds. Claims stay generic; numbers are marked as examples. */
const KIND_RECIPES: Record<Exclude<VideoKind, "reel">, KindRecipe[]> = {
  product: [
    { layout: "problem", heading: "Sound familiar?", body: "Too many tools\nWork falls through the cracks\nNo clear picture", say: "Too many tools, work falling through the cracks, and no clear picture." },
    { layout: "screen", heading: "Meet *{brand}*", body: "Live overview", say: "{brand} puts {topic} in one simple place." },
    { layout: "features", heading: "Built for real work", body: "⚡ Fast setup — Live in minutes\n🔁 Automations — Skip the busywork\n📊 Reports — See what matters", say: "Set up in minutes, automate the busywork and see what matters." },
    { layout: "stat", heading: "2x", body: "faster, in our example workflow (example)", say: "Teams move faster." },
  ],
  ugc: [
    { layout: "talk", heading: "", body: "Okay so I have to tell you about {topic}." },
    { layout: "talk", heading: "", body: "I was honestly sceptical at first, I have tried so many of these.", sticker: "Day 1" },
    { layout: "broll", heading: "", body: "But {brand} is so easy. You just use it and that is it.", sticker: "Day 3" },
    { layout: "review", heading: "", body: "Now I actually look forward to using it." },
  ],
  youtube: [
    { layout: "talk", heading: "", body: "", say: "Today we are looking at {topic}, and what actually works." },
    { layout: "chapter", heading: "The problem", body: "", say: "First, the problem." },
    { layout: "bullets", heading: "Why it is hard", body: "Too many options\nNo clear plan\nNo way to measure", say: "Most people get stuck for three reasons: too many options, no clear plan, and no way to measure progress." },
    { layout: "chapter", heading: "The fix", body: "", say: "Now, the fix." },
    { layout: "features", heading: "What to do instead", body: "🎯 Pick one goal — Start small\n📅 Make a plan — One step a day\n📈 Track it — Weekly check-in", say: "Pick one goal, make a simple plan, and track it every week." },
    { layout: "chapter", heading: "Recap", body: "", say: "Let's recap." },
    { layout: "bullets", heading: "Remember this", body: "One goal\nOne plan\nOne check-in a week", say: "One goal, one plan, one check-in a week. That is all it takes." },
  ],
};

/**
 * A local copywriting starter. No API key, no hallucinated brand claims:
 * the user's topic and names are slotted into a proven short-form structure.
 */
const RECIPES: Partial<Record<ThemeId, Recipe[]>> = {
  cinematic: [
    {
      heading: "Some stories start quietly.",
      body: "Before the noise, before the notifications, there is a version of {topic} worth paying attention to.",
    },
    {
      heading: "The details do the talking.",
      body: "{brand} built this around the parts most people rush past. {name} shows us why that matters.",
    },
    {
      heading: "Made to be felt.",
      body: "Not louder. Not faster. Just closer to what {topic} was always meant to be.",
    },
    {
      heading: "Stay for the good part.",
      body: "One idea, told properly. That is the whole pitch. {cta}",
    },
  ],
  neon: [
    {
      heading: "You heard it here first.",
      body: "{topic} is not a trend. It is the new default — and it starts now.",
    },
    {
      heading: "No filler. All signal.",
      body: "{brand} stripped it back to the thing that actually moves people.",
    },
    {
      heading: "Meet the main character.",
      body: "{name} on why {topic} hits different when you stop copying everyone else.",
    },
    {
      heading: "Your turn.",
      body: "The feed moves fast. This is the part worth saving. {cta}",
    },
  ],
  editorial: [
    {
      heading: "A quiet obsession with {topic}.",
      body: "We spent months on the details nobody asked for. That is usually where the good work lives.",
    },
    {
      heading: "Considered, not complicated.",
      body: "{brand} makes the case for fewer, better things — and the rituals that make them last.",
    },
    {
      heading: "The people behind it.",
      body: "{name} on the small decisions that never make the credits but change the whole story.",
    },
    {
      heading: "The long version.",
      body: "There is more to {topic} than a headline. Come find it. {cta}",
    },
  ],
  corporate: [
    {
      heading: "Less busywork. More momentum.",
      body: "Teams lose hours to the gaps between tools. {brand} closes them, so {topic} moves at the speed of the idea.",
    },
    {
      heading: "Built for the way teams actually work.",
      body: "No rip-and-replace. No six-month rollout. Connect, automate, measure — in that order.",
    },
    {
      heading: "Proof, not promises.",
      body: "Teams using {brand} ship faster, meet fewer times, and finally trust the numbers.",
    },
    {
      heading: "See it on your own workflow.",
      body: "Start small. Keep what works. {cta}",
    },
  ],
};

const TRANSITIONS: TransitionId[] = ["fade", "slide", "wipe", "zoom"];
const DURATIONS = [3.5, 4.5, 4, 4.5];

const topicFragment = (topic: string) =>
  topic
    .trim()
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ")
    .slice(0, 64) || "your next idea";

export function draftStoryboard(project: Project): Project {
  const topic = topicFragment(project.topic);
  const brand = project.brand.trim() || "the studio";
  const name =
    project.cast.find((member) => member.name.trim())?.name.trim() ||
    "the team";
  const cta = project.cta.trim() || "Follow along for the next one.";
  const fill = (value: string) =>
    value
      .replaceAll("{topic}", topic)
      .replaceAll("{brand}", brand)
      .replaceAll("{name}", name)
      .replaceAll("{cta}", cta);

  if (project.kind !== "reel") {
    const host = project.cast[0]?.id ?? null;
    const scenes: Scene[] = KIND_RECIPES[project.kind].map((item, index) => ({
      id: makeId("scene"),
      heading: fill(item.heading),
      body: fill(item.body),
      // Talking beats keep any footage the user already added at that position.
      image: item.layout === "talk" ? project.scenes[index]?.image ?? null : null,
      duration: 4,
      transition: TRANSITIONS[index % TRANSITIONS.length],
      castId: item.layout === "talk" ? host : null,
      layout: item.layout,
      say: item.say ? fill(item.say) : "",
      chapter: item.chapter ?? "",
      sticker: item.sticker ?? "",
      device: "browser",
    }));
    return { ...project, topic: project.topic.trim() || topic, brand, cta, scenes };
  }

  const recipe = RECIPES[project.theme] ?? RECIPES.cinematic ?? [];

  const offsets = [0, 4, 8, 2];
  const scenes: Scene[] = recipe.map((item, index) => {
    const preset = IMAGE_PRESETS[offsets[index] % IMAGE_PRESETS.length];
    return {
      id: `scene-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
      heading: fill(item.heading),
      body: fill(item.body),
      image: preset.url,
      duration: DURATIONS[index] ?? 4,
      transition: TRANSITIONS[index % TRANSITIONS.length],
      castId:
        index === 1
          ? project.cast[0]?.id ?? null
          : index === 2
            ? project.cast[1]?.id ?? null
            : null,
      layout: "card",
      say: "",
      chapter: "",
      sticker: "",
      device: "browser",
    };
  });

  return {
    ...project,
    topic: project.topic.trim() || "A story worth telling",
    hook: project.hook.trim() || `A short film about ${topic}.`,
    brand,
    cta,
    scenes,
  };
}
