"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { emptyProject, SAMPLES } from "@/shared/defaults";
import { draftStoryboard } from "@/shared/draft";
import { makeId, newScene } from "@/shared/ids";
import { normalizeProject } from "@/shared/normalize";
import { THEME_LIST, ASPECTS, TRANSITIONS, KINDS, LAYOUTS, LAYOUTS_BY_KIND } from "@/shared/themes";
import { FIXED_ASPECT, formatSeconds, getRuntimeSeconds, sceneSeconds } from "@/shared/timeline";
import { MAX_SCENES, MAX_YOUTUBE_SCENES } from "@/shared/types";
import type {
  AspectId,
  CastMember,
  ProductInfo,
  Project,
  Scene,
  ThemeId,
  VideoKind,
  VoiceSettings,
  YoutubeInfo,
} from "@/shared/types";
import { Field, IconButton, MediaPicker, AudioPicker, Toggle } from "./fields";
import { Icon, LogoMark } from "./icons";

const PreviewPanel = dynamic(
  () => import("./preview-panel").then((module) => module.PreviewPanel),
  {
    ssr: false,
    loading: () => (
      <div className="preview-panel preview-skeleton" aria-hidden="true">
        <div className="skeleton-line short" />
        <div className="skeleton-stage" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </div>
    ),
  },
);

const STORAGE_KEY = "sceneforge.project.v1";

/** "Write with Claude" stays hidden until plan step 0.1 (set NEXT_PUBLIC_ENABLE_AI_DRAFT=1 to show it). */
const AI_DRAFT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_DRAFT === "1";

const KIND_ICONS: Record<VideoKind, string> = { reel: "🎞️", product: "🚀", ugc: "🤳", youtube: "▶️" };

/** Brief labels that read naturally for each kind of video. */
const BRIEF_COPY: Record<VideoKind, { topic: string; topicHint: string; hook: string; cta: string }> = {
  reel: { topic: "Topic or working title", topicHint: "This becomes the opening title card.", hook: "Hook / subtitle", cta: "Call to action" },
  product: { topic: "Opening hook", topicHint: "The question or claim on the first card, e.g. “Still tracking work in spreadsheets?”", hook: "Subtitle", cta: "Button text on the end card" },
  ugc: { topic: "Hook sticker", topicHint: "3–7 words shown big over the first shot, like text added in a phone editor.", hook: "Second line (optional)", cta: "Urgency line on the shop card" },
  youtube: { topic: "Video title on screen", topicHint: "The opening card. The upload title goes in the YouTube panel.", hook: "Subtitle", cta: "End-screen line" },
};

export function Studio() {
  const [project, setProject] = useState<Project>(SAMPLES.reel);
  const [hydrated, setHydrated] = useState(false);
  const [voices, setVoices] = useState<string[]>([]);
  const [claude, setClaude] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  useEffect(() => {
    fetch("/api/voices")
      .then((response) => response.json())
      .then((data: { voices?: string[] }) => setVoices(data.voices ?? []))
      .catch(() => setVoices([]));
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProject(normalizeProject(JSON.parse(stored)));
      }
    } catch {
      // A corrupt draft is not worth breaking the studio over.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Private mode or full storage: autosave is best-effort.
    }
  }, [project, hydrated]);

  const update = (patch: Partial<Project>) =>
    setProject((current) => ({ ...current, ...patch }));

  const updateScene = (id: string, patch: Partial<Scene>) =>
    setProject((current) => ({
      ...current,
      scenes: current.scenes.map((scene) =>
        scene.id === id ? { ...scene, ...patch } : scene,
      ),
    }));

  const moveScene = (index: number, delta: number) =>
    setProject((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.scenes.length) return current;
      const scenes = [...current.scenes];
      [scenes[index], scenes[target]] = [scenes[target], scenes[index]];
      return { ...current, scenes };
    });

  const removeScene = (id: string) =>
    setProject((current) =>
      current.scenes.length <= 1
        ? current
        : { ...current, scenes: current.scenes.filter((scene) => scene.id !== id) },
    );

  const maxScenes = project.kind === "youtube" ? MAX_YOUTUBE_SCENES : MAX_SCENES;

  const addScene = () =>
    setProject((current) =>
      current.scenes.length >= (current.kind === "youtube" ? MAX_YOUTUBE_SCENES : MAX_SCENES)
        ? current
        : { ...current, scenes: [...current.scenes, newScene(current.scenes.length, current.kind)] },
    );

  const updateProduct = (patch: Partial<ProductInfo>) =>
    setProject((current) => ({ ...current, product: { ...current.product, ...patch } }));
  const updateYoutube = (patch: Partial<YoutubeInfo>) =>
    setProject((current) => ({ ...current, youtube: { ...current.youtube, ...patch } }));
  const updateVoice = (patch: Partial<VoiceSettings>) =>
    setProject((current) => ({ ...current, voice: { ...current.voice, ...patch } }));

  /** Switch the kind of video; scenes keep their text but move to a layout the kind supports. */
  const setKind = (kind: VideoKind) =>
    setProject((current) => {
      const allowed = LAYOUTS_BY_KIND[kind].map((layout) => layout.id);
      return {
        ...current,
        kind,
        aspect: FIXED_ASPECT[kind] ?? current.aspect,
        scenes: current.scenes.map((scene) =>
          allowed.includes(scene.layout) ? scene : { ...scene, layout: allowed[0] },
        ),
      };
    });

  const writeWithClaude = async () => {
    setClaude({ busy: true, error: null });
    try {
      const response = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = (await response.json().catch(() => ({}))) as { project?: Project; error?: string };
      if (!response.ok || !data.project) throw new Error(data.error ?? "Claude could not write the storyboard.");
      setProject(data.project);
      setClaude({ busy: false, error: null });
    } catch (cause) {
      setClaude({ busy: false, error: cause instanceof Error ? cause.message : "Claude could not write the storyboard." });
    }
  };

  const addCast = () =>
    setProject((current) =>
      current.cast.length >= 6
        ? current
        : {
            ...current,
            cast: [
              ...current.cast,
              { id: makeId("cast"), name: "", role: "", image: null },
            ],
          },
    );

  const updateCast = (id: string, patch: Partial<CastMember>) =>
    setProject((current) => ({
      ...current,
      cast: current.cast.map((member) =>
        member.id === id ? { ...member, ...patch } : member,
      ),
    }));

  const removeCast = (id: string) =>
    setProject((current) => ({
      ...current,
      cast: current.cast.filter((member) => member.id !== id),
      scenes: current.scenes.map((scene) =>
        scene.castId === id ? { ...scene, castId: null } : scene,
      ),
    }));

  const loadSample = () => setProject(SAMPLES[project.kind]);

  const startNew = () =>
    setProject({
      ...emptyProject,
      kind: project.kind,
      aspect: FIXED_ASPECT[project.kind] ?? emptyProject.aspect,
      scenes: [newScene(0, project.kind)],
      cast: [],
      music: null,
    });

  const draftScenes = () => setProject((current) => draftStoryboard(current));

  const runtime = formatSeconds(getRuntimeSeconds(project));
  const namedCast = project.cast.filter((member) => member.name.trim());
  const copy = BRIEF_COPY[project.kind];
  const layouts = LAYOUTS_BY_KIND[project.kind];
  const fixedAspect = FIXED_ASPECT[project.kind];
  const showProduct = project.kind === "product" || project.kind === "ugc";

  return (
    <div className="app">
      <header className="site-head">
        <div className="head-inner">
          <a className="brand" href="#top" aria-label="SceneForge home">
            <LogoMark />
            <span className="brand-word">SceneForge</span>
            <span className="brand-tag">Studio</span>
          </a>
          <div className="head-right">
            <span className="head-status">
              <span className="env-dot" /> Runs locally
            </span>
            <button type="button" className="btn btn-quiet btn-sm" onClick={loadSample}>
              <Icon name="wand" size={15} /> Load sample
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={startNew}>
              <Icon name="plus" size={15} /> New film
            </button>
          </div>
        </div>
      </header>

      <main className="shell" id="top">
        <section className="intro">
          <div className="intro-copy">
            <span className="eyebrow">
              <span className="accent-dot" /> Brief → storyboard → MP4
            </span>
            <h1>
              Make the short.
              <br />
              <em>Skip the timeline.</em>
            </h1>
            <p className="lede">
              Describe the film, drop in your scenes, names and images, pick a
              look. SceneForge writes the composition and renders a real MP4 —
              right here on this machine.
            </p>
            <div className="intro-chips">
              <span>Form → preview → MP4</span>
              <span>9:16 · 1:1 · 16:9</span>
              <span>H.264 · 30 fps</span>
            </div>
          </div>
          <div className="intro-card">
            <span className="eyebrow">In the box</span>
            <ul>
              <li>
                <Icon name="film" size={17} />
                Reels, product promos, UGC ads and YouTube videos in nine themes
              </li>
              <li>
                <Icon name="music" size={17} />
                Free offline voiceover with the voices built into Windows
              </li>
              <li>
                <Icon name="play" size={17} />
                A live Remotion preview before you spend a render
              </li>
              <li>
                <Icon name="download" size={17} />
                One-click H.264 download, no watermark and no upload
              </li>
            </ul>
          </div>
        </section>

        <div className="studio-grid">
          <div className="form-col">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">00 — The format</span>
                  <h2>What are you making?</h2>
                  <p>
                    Each type has its own scene layouts and end card. Switching
                    keeps your text.
                  </p>
                </div>
              </div>
              <div className="theme-grid kind-grid" role="radiogroup" aria-label="Video type">
                {KINDS.map((kind) => {
                  const active = project.kind === kind.id;
                  return (
                    <button
                      key={kind.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`theme-card ${active ? "is-active" : ""}`}
                      onClick={() => setKind(kind.id)}
                    >
                      <span className="kind-icon" aria-hidden="true">{KIND_ICONS[kind.id]}</span>
                      <span className="theme-copy">
                        <strong>{kind.label}</strong>
                        <em>{kind.note}</em>
                      </span>
                      <span className="theme-check" aria-hidden="true">
                        {active ? <Icon name="check" size={13} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="btn btn-quiet btn-sm" onClick={loadSample}>
                <Icon name="wand" size={15} /> Load the {KINDS.find((k) => k.id === project.kind)?.label} sample
              </button>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">01 — The brief</span>
                  <h2>What is this film about?</h2>
                  <p>
                    One topic, one promise. Keep the hook under a sentence —
                    short-form rewards clarity.
                  </p>
                </div>
              </div>

              <Field
                label={copy.topic}
                hint={copy.topicHint}
                required
              >
                <input
                  className="input input-lg"
                  value={project.topic}
                  maxLength={120}
                  placeholder="e.g. The quiet luxury of slow mornings"
                  onChange={(event) => update({ topic: event.target.value })}
                />
              </Field>

              <div className="two-col">
                <Field label={copy.hook} hint="The line under the title.">
                  <input
                    className="input"
                    value={project.hook}
                    maxLength={160}
                    placeholder="A short film about doing less, better."
                    onChange={(event) => update({ hook: event.target.value })}
                  />
                </Field>
                <Field label="Brand or name" hint="Shown on every scene and the end card.">
                  <input
                    className="input"
                    value={project.brand}
                    maxLength={60}
                    placeholder="Alder & Wren"
                    onChange={(event) => update({ brand: event.target.value })}
                  />
                </Field>
              </div>

              <Field
                label={copy.cta}
                hint="The last thing on screen. Keep it to one instruction."
                counter={`${project.cta.length}/140`}
              >
                <input
                  className="input"
                  value={project.cta}
                  maxLength={140}
                  placeholder="Start your slow morning — alderandwren.com"
                  onChange={(event) => update({ cta: event.target.value })}
                />
              </Field>

              <div className="draft-row">
                <button type="button" className="btn btn-ghost draft-btn" onClick={draftScenes}>
                  <Icon name="sparkles" size={17} />
                  Auto-draft from this brief
                </button>
                {AI_DRAFT_ENABLED ? (
                  <button
                    type="button"
                    className="btn btn-primary draft-btn"
                    onClick={() => void writeWithClaude()}
                    disabled={claude.busy}
                  >
                    {claude.busy ? <Icon name="loader" className="spin" size={17} /> : <Icon name="wand" size={17} />}
                    {claude.busy ? "Claude is writing…" : "Write with Claude"}
                  </button>
                ) : null}
              </div>
              <p className="field-hint draft-hint">
                Auto-draft fills a proven structure for this video type
                instantly, using your brief and cast. You can edit every line
                afterwards.
                {AI_DRAFT_ENABLED
                  ? " “Write with Claude” asks your local Claude Code to write the scenes, voice lines and YouTube details — about a minute."
                  : ""}
              </p>
              {claude.error ? <p className="media-error">{claude.error}</p> : null}
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">02 — The look</span>
                  <h2>Pick the world it lives in.</h2>
                  <p>
                    The theme changes type, colour, transitions and the way
                    images are graded.
                  </p>
                </div>
              </div>

              <div className="theme-grid" role="radiogroup" aria-label="Video theme">
                {THEME_LIST.map((theme) => {
                  const active = project.theme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`theme-card ${active ? "is-active" : ""}`}
                      onClick={() => update({ theme: theme.id as ThemeId })}
                    >
                      <span className="theme-swatch" aria-hidden="true">
                        {theme.swatch.map((colour) => (
                          <span key={colour} style={{ background: colour }} />
                        ))}
                      </span>
                      <span className="theme-copy">
                        <strong>{theme.label}</strong>
                        <em>{theme.blurb}</em>
                      </span>
                      <span className="theme-check" aria-hidden="true">
                        {active ? <Icon name="check" size={13} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="field">
                <span className="field-label">Frame</span>
                {fixedAspect ? (
                  <span className="field-hint">
                    {project.kind === "ugc" ? "UGC ads are always 9:16." : "YouTube videos are always 16:9."}
                  </span>
                ) : null}
                <div className={`aspect-grid ${fixedAspect ? "is-locked" : ""}`} role="radiogroup" aria-label="Aspect ratio">
                  {ASPECTS.map((aspect) => {
                    const active = (fixedAspect ?? project.aspect) === aspect.id;
                    return (
                      <button
                        key={aspect.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!!fixedAspect && !active}
                        className={`aspect-card ${active ? "is-active" : ""}`}
                        onClick={() => update({ aspect: aspect.id as AspectId })}
                      >
                        <span className={`aspect-glyph aspect-${aspect.id}`} aria-hidden="true" />
                        <strong>{aspect.label}</strong>
                        <em>{aspect.ratio}</em>
                        <span>{aspect.note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">03 — The storyboard</span>
                  <h2>Four scenes. Or ten. Your call.</h2>
                  <p>
                    Each scene holds one image, one headline and an optional
                    caption. Reorder with the arrows.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={addScene}
                  disabled={project.scenes.length >= maxScenes}
                >
                  <Icon name="plus" size={15} /> Add scene
                </button>
              </div>

              <div className="scene-list">
                {project.scenes.map((scene, index) => {
                  const featured = project.cast.find(
                    (member) => member.id === scene.castId,
                  );
                  return (
                    <article className="scene-card" key={scene.id}>
                      <header className="scene-top">
                        <div className="scene-id">
                          <span className="scene-number">
                            Scene {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="scene-duration">
                            {sceneSeconds(project, scene).toFixed(1)}s
                          </span>
                          <span className="scene-cast">{LAYOUTS[scene.layout]?.label}</span>
                          {featured?.name ? (
                            <span className="scene-cast">{featured.name}</span>
                          ) : null}
                        </div>
                        <div className="scene-tools">
                          <IconButton
                            icon="arrow-up"
                            label="Move scene up"
                            disabled={index === 0}
                            onClick={() => moveScene(index, -1)}
                          />
                          <IconButton
                            icon="arrow-down"
                            label="Move scene down"
                            disabled={index === project.scenes.length - 1}
                            onClick={() => moveScene(index, 1)}
                          />
                          <IconButton
                            icon="trash"
                            label="Remove scene"
                            tone="danger"
                            disabled={project.scenes.length <= 1}
                            onClick={() => removeScene(scene.id)}
                          />
                        </div>
                      </header>

                      <div className="scene-body">
                        <MediaPicker
                          value={scene.image}
                          allowVideo={scene.layout === "talk" || scene.layout === "broll" || scene.layout === "card"}
                          onChange={(image) => updateScene(scene.id, { image })}
                        />

                        <div className="scene-fields">
                          <label className="mini-field">
                            <span>Layout</span>
                            <select
                              className="select"
                              value={scene.layout}
                              onChange={(event) =>
                                updateScene(scene.id, { layout: event.target.value as Scene["layout"] })
                              }
                            >
                              {layouts.map((layout) => (
                                <option key={layout.id} value={layout.id}>
                                  {layout.label}
                                </option>
                              ))}
                            </select>
                            <em className="layout-hint">{LAYOUTS[scene.layout]?.hint}</em>
                          </label>
                          <Field label="Headline" counter={`${scene.heading.length}/120`}>
                            <input
                              className="input"
                              value={scene.heading}
                              maxLength={120}
                              placeholder="A slower kind of luxury"
                              onChange={(event) =>
                                updateScene(scene.id, { heading: event.target.value })
                              }
                            />
                          </Field>

                          <Field
                            label={project.kind === "ugc" ? "What they say (caption)" : "Caption"}
                            counter={`${scene.body.length}/420`}
                            hint={
                              ["problem", "bullets", "features"].includes(scene.layout)
                                ? "One item per line."
                                : project.kind === "ugc"
                                  ? "Shown word by word, and spoken when voiceover is on."
                                  : "Revealed word by word. Hide captions in step 05."
                            }
                          >
                            <textarea
                              className="textarea"
                              rows={["problem", "bullets", "features"].includes(scene.layout) ? 3 : 2}
                              value={scene.body}
                              maxLength={420}
                              placeholder="Linen, low light, and a cup that is allowed to go cold."
                              onChange={(event) =>
                                updateScene(scene.id, { body: event.target.value })
                              }
                            />
                          </Field>

                          {project.voice.enabled ? (
                            <Field
                              label="Voiceover line"
                              counter={`${scene.say.length}/400`}
                              hint={
                                project.kind === "ugc"
                                  ? "Leave empty to speak the caption."
                                  : "Spoken by the narrator. The scene stretches to fit."
                              }
                            >
                              <textarea
                                className="textarea"
                                rows={2}
                                value={scene.say}
                                maxLength={400}
                                placeholder="What the narrator says during this scene."
                                onChange={(event) => updateScene(scene.id, { say: event.target.value })}
                              />
                            </Field>
                          ) : null}

                          {project.kind === "youtube" || project.kind === "ugc" || scene.layout === "screen" ? (
                            <div className="scene-meta-row">
                              {project.kind === "youtube" ? (
                                <label className="mini-field">
                                  <span>Starts chapter</span>
                                  <input
                                    className="input"
                                    value={scene.chapter}
                                    maxLength={60}
                                    placeholder={scene.layout === "chapter" ? "Uses the headline" : "Optional"}
                                    onChange={(event) => updateScene(scene.id, { chapter: event.target.value })}
                                  />
                                </label>
                              ) : null}
                              {project.kind === "ugc" ? (
                                <label className="mini-field">
                                  <span>Sticker</span>
                                  <input
                                    className="input"
                                    value={scene.sticker}
                                    maxLength={24}
                                    placeholder="e.g. Day 3"
                                    onChange={(event) => updateScene(scene.id, { sticker: event.target.value })}
                                  />
                                </label>
                              ) : null}
                              {scene.layout === "screen" ? (
                                <label className="mini-field">
                                  <span>Device</span>
                                  <select
                                    className="select"
                                    value={scene.device}
                                    onChange={(event) =>
                                      updateScene(scene.id, { device: event.target.value as Scene["device"] })
                                    }
                                  >
                                    <option value="browser">Browser window</option>
                                    <option value="phone">Phone</option>
                                  </select>
                                </label>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="scene-meta-row">
                            <label className="mini-field">
                              <span>Duration</span>
                              <span className="mini-range">
                                <input
                                  type="range"
                                  min={1.5}
                                  max={12}
                                  step={0.5}
                                  value={scene.duration}
                                  onChange={(event) =>
                                    updateScene(scene.id, {
                                      duration: Number(event.target.value),
                                    })
                                  }
                                />
                                <em>{scene.duration.toFixed(1)}s</em>
                              </span>
                            </label>

                            <label className="mini-field">
                              <span>Transition</span>
                              <select
                                className="select"
                                value={scene.transition}
                                onChange={(event) =>
                                  updateScene(scene.id, {
                                    transition: event.target.value as Scene["transition"],
                                  })
                                }
                              >
                                {TRANSITIONS.map((transition) => (
                                  <option key={transition.id} value={transition.id}>
                                    {transition.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="mini-field">
                              <span>Featuring</span>
                              <select
                                className="select"
                                value={scene.castId ?? ""}
                                onChange={(event) =>
                                  updateScene(scene.id, {
                                    castId: event.target.value || null,
                                  })
                                }
                              >
                                <option value="">No one</option>
                                {namedCast.map((member) => (
                                  <option key={member.id} value={member.id}>
                                    {member.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">04 — The names</span>
                  <h2>Who is on screen?</h2>
                  <p>
                    {project.kind === "ugc"
                      ? "The first person is the creator: put the @handle as the name and their real name as the role. Their photo is used when a talking beat has no footage."
                      : "Add people once, then feature them in any scene. They show up as a lower-third name tag."}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={addCast}
                  disabled={project.cast.length >= 6}
                >
                  <Icon name="plus" size={15} /> Add person
                </button>
              </div>

              {project.cast.length === 0 ? (
                <div className="empty-cast">
                  <span className="empty-icon">
                    <Icon name="sparkles" size={18} />
                  </span>
                  <div>
                    <strong>No cast yet — that is fine.</strong>
                    <span>
                      A film can be all place and product. Add a name only if
                      someone should get a credit.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="cast-list">
                  {project.cast.map((member, index) => (
                    <div className="cast-row" key={member.id}>
                      <MediaPicker
                        variant="avatar"
                        value={member.image}
                        onChange={(image) => updateCast(member.id, { image })}
                      />
                      <Field label={`Name ${index + 1}`}>
                        <input
                          className="input"
                          value={member.name}
                          maxLength={40}
                          placeholder="Mara Ellison"
                          onChange={(event) =>
                            updateCast(member.id, { name: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Role / credit">
                        <input
                          className="input"
                          value={member.role}
                          maxLength={60}
                          placeholder="Founder, Alder & Wren"
                          onChange={(event) =>
                            updateCast(member.id, { role: event.target.value })
                          }
                        />
                      </Field>
                      <IconButton
                        icon="x"
                        label={`Remove ${member.name || "person"}`}
                        tone="danger"
                        onClick={() => removeCast(member.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {showProduct ? (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">04b — The product</span>
                    <h2>What are you selling?</h2>
                    <p>
                      Shown on the review card and the end card. Use only real
                      prices and real ratings.
                    </p>
                  </div>
                </div>
                <div className="product-row">
                  <MediaPicker variant="avatar" value={project.product.image} onChange={(image) => updateProduct({ image })} />
                  <Field label="Product name" required>
                    <input className="input" value={project.product.name} maxLength={60} placeholder="Brewly Cold Brew Kit" onChange={(event) => updateProduct({ name: event.target.value })} />
                  </Field>
                  <Field label="Emoji" hint="Used when there is no photo.">
                    <input className="input" value={project.product.emoji} maxLength={8} onChange={(event) => updateProduct({ emoji: event.target.value })} />
                  </Field>
                </div>
                <div className="two-col">
                  <Field label="Price">
                    <input className="input" value={project.product.price} maxLength={24} placeholder="₹899 or Free plan" onChange={(event) => updateProduct({ price: event.target.value })} />
                  </Field>
                  <Field label="Old price" hint="Only for a real discount.">
                    <input className="input" value={project.product.oldPrice} maxLength={24} placeholder="₹1,299" onChange={(event) => updateProduct({ oldPrice: event.target.value })} />
                  </Field>
                </div>
                <div className="two-col">
                  <Field label="Website / link" hint="Shown on the end card and in app screens.">
                    <input className="input" value={project.product.url} maxLength={80} placeholder="yourbrand.com" onChange={(event) => updateProduct({ url: event.target.value })} />
                  </Field>
                  <div className="field">
                    <span className="field-label">
                      Rating
                      <span className="field-count">{project.product.rating ? project.product.rating.toFixed(1) : "Off"}</span>
                    </span>
                    <input type="range" min={0} max={5} step={0.1} value={project.product.rating} onChange={(event) => updateProduct({ rating: Number(event.target.value) })} />
                  </div>
                </div>
                <Field label="Reviews line" hint="e.g. “2,300+ reviews” — only if true.">
                  <input className="input" value={project.product.reviews} maxLength={60} onChange={(event) => updateProduct({ reviews: event.target.value })} />
                </Field>
              </section>
            ) : null}

            {project.kind === "youtube" ? (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">04b — YouTube</span>
                    <h2>Upload details and thumbnail.</h2>
                    <p>
                      The render also makes a 1280×720 thumbnail and a text file
                      with the title, description, chapter timestamps and tags.
                    </p>
                  </div>
                </div>
                <div className="two-col">
                  <Field label="Channel name">
                    <input className="input" value={project.youtube.channel} maxLength={60} onChange={(event) => updateYoutube({ channel: event.target.value })} />
                  </Field>
                  <Field label="Handle">
                    <input className="input" value={project.youtube.handle} maxLength={40} placeholder="@yourchannel" onChange={(event) => updateYoutube({ handle: event.target.value })} />
                  </Field>
                </div>
                <Field label="Upload title" counter={`${project.youtube.title.length}/100`} hint="Under 70 characters shows in full. Keep it honest.">
                  <input className="input" value={project.youtube.title} maxLength={100} onChange={(event) => updateYoutube({ title: event.target.value })} />
                </Field>
                <Field label="Description" hint="Chapter timestamps are added automatically.">
                  <textarea className="textarea" rows={3} value={project.youtube.description} maxLength={2000} onChange={(event) => updateYoutube({ description: event.target.value })} />
                </Field>
                <Field label="Tags" hint="Comma separated.">
                  <input className="input" value={project.youtube.tags} maxLength={400} onChange={(event) => updateYoutube({ tags: event.target.value })} />
                </Field>
                <div className="product-row">
                  <MediaPicker variant="avatar" value={project.youtube.thumbImage} onChange={(thumbImage) => updateYoutube({ thumbImage })} />
                  <Field label="Thumbnail text" hint="2–4 words. *Star* one to highlight it.">
                    <input className="input" value={project.youtube.thumbText} maxLength={40} placeholder="Stop *missing* deadlines" onChange={(event) => updateYoutube({ thumbText: event.target.value })} />
                  </Field>
                  <Field label="Badge">
                    <input className="input" value={project.youtube.thumbBadge} maxLength={16} placeholder="3 FIXES" onChange={(event) => updateYoutube({ thumbBadge: event.target.value })} />
                  </Field>
                  <Field label="Emoji">
                    <input className="input" value={project.youtube.thumbEmoji} maxLength={8} placeholder="⏰" onChange={(event) => updateYoutube({ thumbEmoji: event.target.value })} />
                  </Field>
                </div>
                <div className="toggle-row">
                  <div>
                    <strong>Subtitles</strong>
                    <span>Show the voiceover as subtitles at the bottom.</span>
                  </div>
                  <Toggle label="Show subtitles" checked={project.youtube.subtitles} onChange={(subtitles) => updateYoutube({ subtitles })} />
                </div>
              </section>
            ) : null}

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">05 — Sound & pacing</span>
                  <h2>Set the tempo.</h2>
                  <p>
                    Bookend lengths and music. Captions can be turned off if the
                    image should do all the talking.
                  </p>
                </div>
              </div>

              <div className="two-col">
                <div className="field">
                  <span className="field-label">
                    Title card
                    <span className="field-count">{project.titleDuration.toFixed(1)}s</span>
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={project.titleDuration}
                    onChange={(event) =>
                      update({ titleDuration: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="field">
                  <span className="field-label">
                    End card
                    <span className="field-count">{project.outroDuration.toFixed(1)}s</span>
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={project.outroDuration}
                    onChange={(event) =>
                      update({ outroDuration: Number(event.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="toggle-row">
                <div>
                  <strong>Scene captions</strong>
                  <span>Reveal the caption copy word by word on each scene.</span>
                </div>
                <Toggle
                  label="Show scene captions"
                  checked={project.showCaptions}
                  onChange={(showCaptions) => update({ showCaptions })}
                />
              </div>

              <div className="toggle-row">
                <div>
                  <strong>Sound effects</strong>
                  <span>Whooshes on transitions and a deep hit on the title and end card.</span>
                </div>
                <Toggle
                  label="Sound effects"
                  checked={project.sfx}
                  onChange={(sfx) => update({ sfx })}
                />
              </div>

              <div className="toggle-row">
                <div>
                  <strong>Voiceover</strong>
                  <span>
                    Speak each scene's voiceover line with the voices built into
                    Windows — free and offline. Recorded when you render.
                  </span>
                </div>
                <Toggle
                  label="Voiceover"
                  checked={project.voice.enabled}
                  onChange={(enabled) => updateVoice({ enabled })}
                />
              </div>
              {project.voice.enabled ? (
                <div className="two-col">
                  <Field label="Voice" hint={voices.length ? "Installed on this PC." : "No Windows voices found; the default voice is used."}>
                    <select className="select" value={project.voice.name} onChange={(event) => updateVoice({ name: event.target.value })}>
                      <option value="">System default</option>
                      {voices.map((voice) => (
                        <option key={voice} value={voice}>
                          {voice}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="field">
                    <span className="field-label">
                      Speed
                      <span className="field-count">{project.voice.rate > 0 ? `+${project.voice.rate}` : project.voice.rate}</span>
                    </span>
                    <input type="range" min={-5} max={5} step={1} value={project.voice.rate} onChange={(event) => updateVoice({ rate: Number(event.target.value) })} />
                  </div>
                </div>
              ) : null}

              <AudioPicker
                value={project.music}
                onChange={(music) => update({ music })}
              />
            </section>

            <section className="panel panel-ready">
              <div className="ready-copy">
                <span className="eyebrow">06 — Finish</span>
                <h2>Ready when you are.</h2>
                <p>
                  The preview is live. When the story feels right, send it to
                  the renderer and download the MP4.
                </p>
                <a className="btn btn-primary btn-lg" href="#render">
                  <Icon name="film" size={18} /> Go to the render
                </a>
              </div>
              <dl className="summary">
                <div>
                  <dt>Type</dt>
                  <dd>{KINDS.find((kind) => kind.id === project.kind)?.label}</dd>
                </div>
                <div>
                  <dt>Topic</dt>
                  <dd>{project.topic.trim() || "Not set yet"}</dd>
                </div>
                <div>
                  <dt>Cast</dt>
                  <dd>{namedCast.length > 0 ? `${namedCast.length} people` : "None"}</dd>
                </div>
                <div>
                  <dt>Scenes</dt>
                  <dd>
                    {project.scenes.length} · {runtime}
                  </dd>
                </div>
                <div>
                  <dt>Look</dt>
                  <dd>
                    {THEME_LIST.find((theme) => theme.id === project.theme)?.label ??
                      "Cinematic"}{" "}
                    · {fixedAspect ?? project.aspect}
                  </dd>
                </div>
              </dl>
              <p className="autosave">
                <Icon name="check" size={14} /> Draft autosaved in this browser.
                Images and music stay on this machine.
              </p>
            </section>
          </div>

          <aside className="preview-col">
            <PreviewPanel project={project} />
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <LogoMark size={26} />
            <span>SceneForge</span>
          </div>
          <p>
            A Remotion short-video studio. Form in, MP4 out — composited and
            encoded locally.
          </p>
          <span className="footer-meta">Next.js · Remotion · H.264</span>
        </div>
      </footer>
    </div>
  );
}
