"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { IMAGE_PRESETS } from "@/shared/presets";
import { Icon, type IconName } from "./icons";

export function Field({
  label,
  hint,
  required,
  counter,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  counter?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required ? <em className="req">Required</em> : null}
        {counter ? <span className="field-count">{counter}</span> : null}
      </span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function IconButton({
  icon,
  label,
  onClick,
  disabled,
  tone = "default",
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      className={`icon-btn ${tone === "danger" ? "is-danger" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch ${checked ? "is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-dot" />
    </button>
  );
}

/** Uploads to /api/upload and returns a same-origin URL. */
export function useMediaUpload(kind: "image" | "audio" | "media") {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    const ok =
      kind === "media"
        ? file.type.startsWith("image/") || file.type.startsWith("video/")
        : file.type.startsWith(`${kind}/`);
    if (!ok) {
      setError(kind === "image" ? "Use an image file." : kind === "media" ? "Use an image or video file." : "Use an audio file.");
      return null;
    }

    setBusy(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Upload failed.");
      }
      return data.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { upload, busy, error, setError };
}

export function MediaPicker({
  value,
  onChange,
  variant = "scene",
  allowVideo = false,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  variant?: "scene" | "avatar";
  /** Also accept MP4/WebM/MOV footage (talking and b-roll scenes). */
  allowVideo?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, busy, error, setError } = useMediaUpload(allowVideo ? "media" : "image");
  const isVideo = !!value && /\.(mp4|webm|mov)(\?|$)/i.test(value);
  const [dragging, setDragging] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await upload(file);
    if (url) onChange(url);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const applyUrl = () => {
    const trimmed = urlValue.trim();
    if (!/^https:\/\//i.test(trimmed)) {
      setError(allowVideo ? "Paste a full https:// image or video URL." : "Paste a full https:// image URL.");
      return;
    }
    setError(null);
    onChange(trimmed);
    setUrlValue("");
    setUrlOpen(false);
  };

  return (
    <div className={`media ${variant === "avatar" ? "media-avatar" : ""}`}>
      <input
        ref={inputRef}
        type="file"
        accept={allowVideo ? "image/*,video/mp4,video/webm,video/quicktime" : "image/*"}
        className="visually-hidden"
        onChange={handleInput}
        tabIndex={-1}
      />

      <button
        type="button"
        className={`media-thumb ${dragging ? "is-dragging" : ""} ${
          value ? "has-image" : ""
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        aria-label={value ? "Replace image" : "Add image"}
      >
        {value && isVideo ? (
          <video src={value} muted playsInline preload="metadata" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" />
        ) : (
          <span className="media-empty">
            <Icon name="image" size={variant === "avatar" ? 16 : 22} />
            {variant === "scene" ? <span>{allowVideo ? "Drop image or video" : "Drop image"}</span> : null}
          </span>
        )}
        {busy ? (
          <span className="media-busy">
            <Icon name="loader" className="spin" size={16} />
          </span>
        ) : null}
      </button>

      {variant === "scene" ? (
        <div className="media-tools">
          <button type="button" className="media-link" onClick={() => inputRef.current?.click()}>
            Upload
          </button>
          <button
            type="button"
            className="media-link"
            onClick={() => {
              setLibraryOpen((open) => !open);
              setUrlOpen(false);
            }}
          >
            Library
          </button>
          {value ? (
            <button
              type="button"
              className="media-link is-danger"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          ) : null}
          <button
            type="button"
            className="media-link"
            onClick={() => {
              setUrlOpen((open) => !open);
              setLibraryOpen(false);
            }}
          >
            URL
          </button>
        </div>
      ) : (
        <div className="media-tools">
          <button type="button" className="media-link" onClick={() => inputRef.current?.click()}>
            Photo
          </button>
          <button
            type="button"
            className="media-link"
            onClick={() => setLibraryOpen((open) => !open)}
          >
            Library
          </button>
          {value ? (
            <button
              type="button"
              className="media-link is-danger"
              onClick={() => onChange(null)}
            >
              Clear
            </button>
          ) : null}
        </div>
      )}

      {urlOpen ? (
        <div className="media-pop media-url">
          <input
            className="input"
            value={urlValue}
            placeholder="https://images.example.com/frame.jpg"
            onChange={(event) => setUrlValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyUrl();
              }
            }}
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={applyUrl}>
            Use URL
          </button>
        </div>
      ) : null}

      {libraryOpen ? (
        <div className="media-pop media-library">
          <div className="media-pop-head">
            <strong>Image library</strong>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close library"
              onClick={() => setLibraryOpen(false)}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
          <div className="preset-grid">
            {IMAGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset ${value === preset.url ? "is-active" : ""}`}
                onClick={() => {
                  onChange(preset.url);
                  setLibraryOpen(false);
                }}
                title={preset.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preset.url} alt={preset.label} loading="lazy" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="media-error">{error}</p> : null}
    </div>
  );
}

export function AudioPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, busy, error } = useMediaUpload("audio");

  return (
    <div className="audio-picker">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="visually-hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          const url = await upload(file);
          if (url) onChange(url);
        }}
        tabIndex={-1}
      />

      {value ? (
        <div className="audio-current">
          <div className="audio-meta">
            <span className="audio-icon">
              <Icon name="music" size={17} />
            </span>
            <div>
              <strong>Music track added</strong>
              <span>Loops for the full film, faded in and out.</span>
            </div>
          </div>
          <audio src={value} controls className="audio-preview" />
          <button
            type="button"
            className="media-link is-danger"
            onClick={() => onChange(null)}
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="upload-zone"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Icon name="loader" className="spin" size={18} />
          ) : (
            <Icon name="music" size={18} />
          )}
          <span>
            <strong>{busy ? "Uploading…" : "Add a music bed"}</strong>
            <em>MP3, WAV, M4A or OGG · under 25 MB</em>
          </span>
        </button>
      )}

      {error ? <p className="media-error">{error}</p> : null}
      <p className="field-hint">
        Use a track you have the rights to. The music is mixed under the
        visuals at 42% volume.
      </p>
    </div>
  );
}
