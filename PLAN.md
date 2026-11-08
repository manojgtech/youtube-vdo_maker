# SceneForge — build plan

## Goal

Ship a local web app that turns a structured brief into a downloadable short video. The user supplies a topic, scenes, style, names/people, images, and the required finishing details (hook, brand, CTA, music, aspect ratio). One click must produce a real MP4 — not a storyboard, GIF, or mock.

## Key decision: Remotion instead of raw FFmpeg

| | Remotion | Raw FFmpeg |
| --- | --- | --- |
| Composition | React components with a real timeline, transitions, and fonts | Hand-written `filter_complex` strings |
| Preview | Same component powers an interactive Player | Needs a separate preview implementation |
| Animation | Frame-based `interpolate`/`spring`, no external editor | Manual `zoompan`, `xfade`, drawtext timings |
| Audio | `<Audio>` with loop and volume envelopes | Additional filter graph work |
| Output | `@remotion/renderer` handles Chrome capture + H.264 muxing | Full control, but more code and more failure modes |
| Cost | Larger install; headless Chrome required; per-job bundle | Small binary, fast startup |

**Chosen: Remotion.** The same React composition can be previewed in the browser and rendered on the server, which removes the “preview lies about the export” class of bugs. FFmpeg would have meant reimplementing every caption card, image treatment, and transition twice. Remotion's renderer still uses FFmpeg internally for encoding.

## Milestones

1. **Scaffold** — Next.js 15 (App Router) + React 19 + TypeScript + Remotion 4. Keep the app self-contained instead of dropping HTML files into the static-demo workspace.
2. **Domain model** — shared `Project`, `Scene`, `CastMember`, and `Timeline` types; normalization and validation on both client and server; frame math derived from durations.
3. **Composition** — title card, scene cards with four transition styles, cast lower-thirds, outro, progress bar, letterboxing, music with fade-in/out.
4. **Studio UI** — six numbered sections (brief, look, storyboard, names, sound, finish), live preview, scene jump chips, autosave, render history.
5. **Uploads** — image/audio picker with type and size validation, stored in `public/uploads/`.
6. **Render pipeline** — POST starts an in-memory job, bundles the entry point, selects the composition with input props, renders H.264 into `.renders/`, and exposes status.
7. **Delivery** — stream the MP4 with `Range`/`206` support and a named download response.
8. **QA** — typecheck, UI screenshots at desktop/tablet/phone widths, visual frame checks, end-to-end render, playback/seek verification, production build.

## Architecture choices

- **Deferred bundling.** The POST returns the job ID first (`setImmediate`) so the UI can show progress before webpack starts. Bundling happens per job because newly uploaded assets must be in the bundle.
- **Server-only render.** `@remotion/renderer` and `@remotion/bundler` are marked as `serverExternalPackages`; the render route is Node runtime and `force-dynamic`.
- **Local browser reuse.** `src/lib/browser.ts` checks for Chrome/Edge (including `REMOTION_BROWSER_EXECUTABLE`), then lets Remotion download its managed browser as a fallback.
- **Smaller output.** `crf: 23`, `jpegQuality: 80`, `x264Preset: "veryfast"`. The first 690-frame render was 11.5 MB; the tuned render was 3.6 MB with no visible quality loss at review size.
- **Range-aware delivery.** Browsers request byte ranges when seeking; the video route returns `206` with `content-range` and falls back to a full response.
- **Autosave, not accounts.** `localStorage` keeps the draft; no database or auth. Render jobs are process-local and intentionally ephemeral.

## Verification log

- `npx tsc --noEmit` — passes.
- Desktop UI (1440×1200), 1000×800, and emulated 390×844 — checked via headless Chrome/CDP; no horizontal overflow at 390 px, no console errors.
- Composition stills at frames 45, 150, 277, 405, 525, and 640 — title, scene 1, cast scene, scene 3, cast scene 4, and outro all render correctly.
- End-to-end render — 690 frames, 23 s, 1080×1920, H.264 MP4; progress reached 100% and both download/open actions worked.
- Playback — video metadata reports `duration: 23`, `readyState: 4`; seeking to 17.5 s completes with `currentTime: 17.500838`.
- Range request — `curl -H "Range: bytes=1000-1999"` returns `206 Partial Content` with `content-range: bytes 1000-1999/<size>`.
- Production build — `npm run build` completes; `/`, `/_not-found`, and all four API routes build as expected (static page, dynamic render routes).
- Production smoke render — `npm start` served the built app, and a 105-frame 1920×1080 landscape project rendered to completion in ~29 s with status `done` and a valid download URL. The build must be run with the dev server stopped and a clean `.next` directory; sharing `.next` between `next dev` and `next build` corrupts both.

## Deliberately out of scope

- Voice-over / text-to-speech and auto-captions.
- Multiple concurrent renders, cancellation, and a durable job queue.
- Cloud storage or multi-user projects.
- Timeline scrubbing beyond the Player controls; there is no keyframe editor.
- Cleaning old `.renders/` files automatically.

## Possible next steps

1. Persist jobs and downloads in SQLite so history survives a server restart.
2. Add a cancel button and a render queue.
3. Generate SRT captions and burn-in/export as a sidecar file.
4. Add drag-to-reorder scenes (currently arrow buttons).
5. Add a font/theme picker per project rather than one theme per film.
6. Prune `.renders/` on a schedule and show disk usage in the UI.
