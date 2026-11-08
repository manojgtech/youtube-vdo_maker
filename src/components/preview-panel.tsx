"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { ShortVideo } from "@/remotion/ShortVideo";
import { getProjectErrors } from "@/shared/normalize";
import {
  formatSeconds,
  getFormat,
  getRuntimeSeconds,
  getTimeline,
  projectAspect,
} from "@/shared/timeline";
import type { Project } from "@/shared/types";
import { Icon } from "./icons";

type RenderStatus = "idle" | "starting" | "running" | "done" | "error";

type RenderState = {
  status: RenderStatus;
  progress: number;
  stage: string;
  url: string | null;
  downloadUrl: string | null;
  thumbnailUrl?: string | null;
  uploadTextUrl?: string | null;
  error: string | null;
};

type HistoryItem = {
  id: string;
  title: string;
  url: string;
  downloadUrl: string | null;
  meta: string;
  at: number;
};

type JobPayload = {
  status: "queued" | "bundling" | "rendering" | "done" | "error";
  progress: number;
  stage: string;
  url: string | null;
  downloadUrl: string | null;
  thumbnailUrl?: string | null;
  uploadTextUrl?: string | null;
  error: string | null;
};

const EMPTY: RenderState = {
  status: "idle",
  progress: 0,
  stage: "",
  url: null,
  downloadUrl: null,
  error: null,
};

export function PreviewPanel({ project }: { project: Project }) {
  const playerRef = useRef<PlayerRef>(null);
  const timeline = getTimeline(project);
  const aspect = projectAspect(project);
  const format = getFormat(aspect);
  const runtime = formatSeconds(getRuntimeSeconds(project));
  const [render, setRender] = useState<RenderState>(EMPTY);
  const [issues, setIssues] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const startedAt = useRef<number | null>(null);
  const titleAtRender = useRef("Untitled film");

  const busy = render.status === "starting" || render.status === "running";

  useEffect(() => {
    if (render.status !== "starting" && render.status !== "running") return;
    const timer = setInterval(() => {
      setElapsed(
        Math.round((Date.now() - (startedAt.current ?? Date.now())) / 1000),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [render.status]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const response = await fetch(`/api/render/${jobId}`, {
          cache: "no-store",
        });
        const job = (await response.json()) as JobPayload & { error?: string };
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(job.error ?? "Lost track of the render.");
        }

        const nextStatus: RenderStatus =
          job.status === "done"
            ? "done"
            : job.status === "error"
              ? "error"
              : "running";

        setRender({
          status: nextStatus,
          progress: job.progress ?? 0,
          stage: job.stage ?? "",
          url: job.url,
          downloadUrl: job.downloadUrl,
          thumbnailUrl: job.thumbnailUrl,
          uploadTextUrl: job.uploadTextUrl,
          error: job.error,
        });

        if (job.status === "done" && job.url) {
          const item: HistoryItem = {
            id: jobId,
            title: titleAtRender.current,
            url: job.url,
            downloadUrl: job.downloadUrl,
            meta: `${format.label} · ${format.ratio} · ${runtime}`,
            at: Date.now(),
          };
          setHistory((previous) =>
            previous.some((entry) => entry.id === item.id)
              ? previous
              : [item, ...previous].slice(0, 3),
          );
          return;
        }

        if (job.status === "error") return;
        timer = setTimeout(tick, 900);
      } catch (cause) {
        if (cancelled) return;
        setRender({
          status: "error",
          progress: 0,
          stage: "Failed",
          url: null,
          downloadUrl: null,
          error:
            cause instanceof Error ? cause.message : "Lost track of the render.",
        });
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, format.label, format.ratio, runtime]);

  const startRender = async () => {
    const errors = getProjectErrors(project);
    if (errors.length > 0) {
      setIssues(errors);
      setRender({ ...EMPTY, status: "error", error: errors[0] });
      return;
    }

    setIssues([]);
    setRender({
      status: "starting",
      progress: 0,
      stage: "Handing the brief to the renderer…",
      url: null,
      downloadUrl: null,
      error: null,
    });
    setElapsed(0);
    startedAt.current = Date.now();
    titleAtRender.current = project.topic.trim() || "Untitled film";

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        jobId?: string;
        activeJobId?: string;
        error?: string;
      };

      if (response.status === 409 && data.activeJobId) {
        setJobId(data.activeJobId);
        setRender((previous) => ({
          ...previous,
          status: "running",
          stage: "Joining the render already in progress…",
        }));
        return;
      }

      if (!response.ok || !data.jobId) {
        throw new Error(data.error ?? "Could not start the render.");
      }

      setJobId(data.jobId);
      setRender({
        status: "running",
        progress: 0.01,
        stage: "Bundling the composition",
        url: null,
        downloadUrl: null,
        error: null,
      });
    } catch (cause) {
      setRender({
        status: "error",
        progress: 0,
        stage: "Failed",
        url: null,
        downloadUrl: null,
        error:
          cause instanceof Error ? cause.message : "Could not start the render.",
      });
    }
  };

  const percent = Math.round(render.progress * 100);

  return (
    <div className="preview-panel">
      <div className="preview-head">
        <div>
          <span className="eyebrow">Live preview</span>
          <h2>Watch it come together</h2>
        </div>
        <span className="pill">
          {format.ratio} · {format.label}
        </span>
      </div>

      <div className={`preview-frame preview-${aspect}`}>
        <Player
          ref={playerRef}
          component={ShortVideo}
          inputProps={project}
          durationInFrames={timeline.durationInFrames}
          compositionWidth={format.width}
          compositionHeight={format.height}
          fps={30}
          controls
          loop
          doubleClickToFullscreen
          spaceKeyToPlayOrPause
          acknowledgeRemotionLicense
          style={{ width: "100%" }}
        />
      </div>

      <p className="preview-hint">
        <Icon name="play" size={12} /> Scrub the timeline, or double-click for
        fullscreen.
        {project.voice.enabled
          ? " Voiceover is recorded at render; the preview times scenes from the word count."
          : ""}
      </p>

      <div className="jump-row" aria-label="Jump to a scene">
        <button
          type="button"
          className="jump"
          onClick={() => {
            playerRef.current?.seekTo(0);
            playerRef.current?.pause();
          }}
        >
          Open
        </button>
        {timeline.scenes.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            className="jump"
            title={project.scenes[index]?.heading || `Scene ${index + 1}`}
            onClick={() => {
              playerRef.current?.seekTo(scene.start);
              playerRef.current?.pause();
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        ))}
        <button
          type="button"
          className="jump"
          onClick={() => {
            playerRef.current?.seekTo(
              Math.max(0, timeline.durationInFrames - timeline.outroFrames),
            );
            playerRef.current?.pause();
          }}
        >
          End
        </button>
      </div>

      <div className="spec-strip">
        <div>
          <span>Scenes</span>
          <strong>{project.scenes.length}</strong>
        </div>
        <div>
          <span>Runtime</span>
          <strong>{runtime}</strong>
        </div>
        <div>
          <span>Size</span>
          <strong>
            {format.width}×{format.height}
          </strong>
        </div>
        <div>
          <span>Rate</span>
          <strong>30 fps</strong>
        </div>
      </div>

      <div className="render-box" id="render">
        <div className="render-box-head">
          <div>
            <span className="eyebrow">Output</span>
            <h3>Render the MP4</h3>
          </div>
          <span className="render-local">
            <span className="env-dot" /> Local
          </span>
        </div>

        {render.status === "done" && render.url ? (
          <div className="render-done">
            <div className="done-head">
              <span className="done-icon">
                <Icon name="check" size={18} />
              </span>
              <div>
                <strong>Your film is ready</strong>
                <span>
                  H.264 · {format.ratio} · {runtime} · {percent}% rendered
                </span>
              </div>
            </div>
            <div className="render-actions">
              <a
                className="btn btn-primary"
                href={render.downloadUrl ?? render.url}
                download
              >
                <Icon name="download" size={16} /> Download MP4
              </a>
              <a
                className="btn btn-ghost"
                href={render.url}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="external" size={15} /> Open
              </a>
            </div>
            {render.thumbnailUrl ? (
              <div className="yt-extras">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={render.thumbnailUrl} alt="YouTube thumbnail" />
                <div className="render-actions">
                  <a className="btn btn-ghost btn-sm" href={`${render.thumbnailUrl}&download=1`} download>
                    <Icon name="download" size={14} /> Thumbnail
                  </a>
                  {render.uploadTextUrl ? (
                    <a className="btn btn-ghost btn-sm" href={render.uploadTextUrl} target="_blank" rel="noreferrer">
                      <Icon name="external" size={14} /> Title, chapters &amp; tags
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setJobId(null);
                void startRender();
              }}
            >
              <Icon name="refresh" size={14} /> Render this version again
            </button>
          </div>
        ) : busy ? (
          <div className="render-progress" role="status" aria-live="polite">
            <div className="progress-row">
              <span>{render.stage || "Working…"}</span>
              <strong>{percent}%</strong>
            </div>
            <div className="progress">
              <span style={{ width: `${Math.max(3, percent)}%` }} />
            </div>
            <p>
              <Icon name="clock" size={13} /> {elapsed}s elapsed · a 30s video
              usually takes 2–4 minutes on a laptop. Keep this tab open.
            </p>
          </div>
        ) : (
          <>
            {render.status === "error" && render.error ? (
              <div className="render-error" role="alert">
                <strong>That did not render.</strong>
                <span>{render.error}</span>
              </div>
            ) : null}
            {issues.length > 0 ? (
              <ul className="issue-list">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}

            <button
              type="button"
              className="btn btn-primary btn-render"
              onClick={() => void startRender()}
            >
              <Icon name="film" size={18} /> Render MP4
            </button>
            <p className="render-note">
              H.264 · {format.width}×{format.height} · 30 fps. Rendered on this
              machine with Remotion — nothing is uploaded to a third party.
            </p>
          </>
        )}

        {history.length > 1 ? (
          <div className="render-history">
            <span className="eyebrow">Earlier in this session</span>
            {history.slice(1).map((item) => (
              <a
                key={item.id}
                className="history-row"
                href={item.downloadUrl ?? item.url}
              >
                <span className="history-icon">
                  <Icon name="film" size={14} />
                </span>
                <span className="history-copy">
                  <strong>{item.title}</strong>
                  <em>{item.meta}</em>
                </span>
                <Icon name="download" size={15} />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
