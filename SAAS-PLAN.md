# SceneForge SaaS: product and build plan

Status: draft · Created 2026-11-06 · Owner: Manoj

Turn SceneForge (the local Next.js + Remotion video studio) into a paid web product with two plans:

- **Manual plan**: users fill the form themselves and render videos.
- **AI plan**: everything in Manual, plus AI that writes the script and generates the voiceover.

Work happens **one step at a time**. Each step ends with something you can try, and the next step starts only after you approve.

---

## 1. What the product does

One studio, four video types, all from a form:

| Type | Output |
|---|---|
| Reel / short film | 9:16, 1:1 or 16:9 photo scenes with titles and captions |
| Product / SaaS promo | Pain points, app screen demo, features, proof, CTA end card |
| UGC ad | 9:16 creator footage, word-by-word captions, stickers, review card, shop card |
| YouTube video | 16:9 with chapters, subtitles, end screen, 1280×720 thumbnail, upload text (title, description, chapters, tags) |

Also built in:
- 9 themes
- Live preview
- H.264 MP4 output

All of this already works locally (Step 1, done).

## 2. The two plans

| Feature | Manual | AI |
|---|---|---|
| All 4 video types, 9 themes, templates | ✅ | ✅ |
| Image and video uploads, music | ✅ | ✅ |
| Live preview and MP4 render | ✅ | ✅ |
| YouTube thumbnail and chapter text | ✅ | ✅ |
| Auto-draft (fixed structure, no AI) | ✅ | ✅ |
| Upload your own voice recording per scene | ✅ | ✅ |
| AI writes scenes, voice lines, YouTube title, description and tags | 🔒 | ✅ |
| AI voiceover (English, Hindi, Hinglish) | 🔒 | ✅ |
| Videos per month | 20 | 30 + top-ups |

### Pricing (starting point; test before launch)

| | Price | Includes |
|---|---|---|
| Free trial | ₹0 | 3 videos, watermark, 1 AI video |
| Manual | ₹299/month | 20 videos, no watermark |
| AI | ₹799/month | 30 videos, 30 AI scripts, about 30 minutes of AI voice |
| AI credit pack | ₹199 | 10 more AI videos |
| Yearly | 10× the monthly price | About 2 months free |

### Cost per video (estimates; check provider prices before launch)

| Cost | Manual | AI |
|---|---|---|
| Rendering, 30–60 s video (Remotion Lambda or VPS) | ₹2–5 | ₹2–5 |
| Storage and bandwidth | ₹0.5–1 | ₹0.5–1 |
| AI script (Claude API, one storyboard) | — | ₹1–4 |
| AI voice (cloud TTS, about 500–1000 characters) | — | ₹1–12, by provider |
| **Total** | **₹3–6** | **₹5–22** |

Target: gross margin above 70% on both plans. Usage limits per plan keep the AI plan from losing money.

## 3. Licences and terms (must clear before charging money)

| Item | Status | Action |
|---|---|---|
| Remotion | Free for individuals and companies of up to 3 people | Check remotion.dev/license. Buy the company licence, or the plan for apps where customers make videos, when the team or usage grows. |
| Claude (AI script) | The local `claude` CLI login is personal, so it **cannot** serve customers | Use the **Claude API** with an API key under Anthropic's commercial terms |
| Voiceover | Windows voices are for local use only | Use a commercial TTS (Azure Neural, Google Cloud TTS or ElevenLabs), or Piper with voices whose licence allows commercial use |
| Fonts (Google Fonts, OFL) | OK | — |
| Unsplash sample images | OK as starter images | Keep the attribution rules |
| User uploads | Users are responsible for their content | Terms of service, takedown process, basic moderation |
| UGC ads | Risk of fake reviews | Keep the "(sample)" labels. The terms forbid presenting AI or stock content as real customer reviews. |

## 4. Architecture

### Today (local, single user)
```
Browser ──► Next.js (form, preview, API) ──► Remotion render on the same PC
                     │                         └─► .renders/*.mp4 on disk
                     ├─► Windows TTS (PowerShell)
                     └─► claude CLI (personal login)
Jobs in memory, one render at a time, no accounts.
```

### Target (SaaS)
```
Browser / mobile app
   │
   ▼
Next.js web app (Vercel or VPS)
   ├─ Auth (Clerk / NextAuth / Supabase Auth)
   ├─ Postgres (Supabase / Neon): users, plans, credits, projects, renders
   ├─ Object storage (Cloudflare R2 / S3): uploads, voice clips, MP4s, thumbnails
   ├─ /api/draft  ──► Claude API (AI plan only)
   ├─ /api/voice  ──► Cloud TTS (AI plan only)
   └─ /api/render ──► Render queue
                         ├─ Option A: Remotion Lambda (AWS): parallel, pay per render
                         └─ Option B: VPS worker + BullMQ/Redis + Chrome: cheaper, self-managed
   Payments: Razorpay (India) / Stripe (global) + webhooks
```

### Data model (first version)
- **User**: id, email, name, plan (`trial | manual | ai`), planRenewsAt, videoCredits, aiCredits, voiceSecondsLeft
- **Project**: id, userId, kind, title, data (the `Project` JSON), updatedAt
- **Render**: id, userId, projectId, status, progress, videoUrl, thumbnailUrl, uploadTextUrl, seconds, costEstimate, createdAt
- **Asset**: id, userId, type (image/video/audio/voice), url, bytes, createdAt
- **UsageEvent**: id, userId, type (`render | ai_script | ai_voice`), amount, createdAt, for billing and abuse checks
- **Payment**: id, userId, provider, plan, amount, status, periodStart, periodEnd

### Plan checks (always enforced on the server)
- `/api/draft` returns 402 unless the plan is `ai` (or the user has AI credits), and spends 1 AI credit.
- The AI-voice step in `/api/render` and `/api/voice` checks `voiceSecondsLeft`.
- `/api/render` checks `videoCredits` and adds the watermark on the trial.
- The screen shows 🔒 "Upgrade to AI" on locked features, but the server always decides.

## 5. Build steps (one at a time)

Each step is small and ends with a check you can do yourself.

### Phase 0: finish locally (no accounts yet)
| # | Step | Done when |
|---|---|---|
| 0.1 | Fix the `claude` CLI on this PC and test "Write with Claude" | Clicking the button fills scenes for all 4 types |
| 0.2 | Add a plan switch (`manual` / `ai`) with server checks | In Manual, the AI button and AI voice are locked and the API refuses them; in AI, they work |
| 0.3 | Per-scene "upload my own voice recording" | A recorded voice plays in the right scene of the MP4 |
| 0.4 | Update README and PLAN.md | Docs match the app |

### Phase 1: SaaS foundation
| # | Step | Done when |
|---|---|---|
| 1.1 | Pick and set up auth (Clerk / Supabase Auth) | Sign up, log in, log out work |
| 1.2 | Postgres + ORM (Prisma or Drizzle) with the data model above | Tables are created and a user row appears on sign-up |
| 1.3 | Save projects to the database instead of only localStorage | A project opens on another browser after login |
| 1.4 | Move uploads to R2/S3 with signed upload URLs | Uploaded images and videos load from storage in preview and render |

### Phase 2: rendering for many users
| # | Step | Done when |
|---|---|---|
| 2.1 | Choose Lambda or VPS worker (decide with a cost test) | Decision written down, with cost per 30 s video |
| 2.2 | Render queue + jobs saved in the database | 3 renders from 3 users finish one after another without errors |
| 2.3 | Upload finished MP4s and thumbnails to storage, with a "My videos" page | Downloads work after a server restart |
| 2.4 | Limit image URLs to allowed hosts; add rate limits | A render can't fetch arbitrary URLs; spam requests are blocked |

### Phase 3: AI plan
| # | Step | Done when |
|---|---|---|
| 3.1 | Replace the `claude` CLI with the Claude API (API key on the server) | "Write with Claude" works on the hosted app |
| 3.2 | Cloud TTS with English + Hindi voices; voice picker | AI voiceover in Hindi renders correctly |
| 3.3 | Credits: count renders, AI scripts and voice seconds; show usage in the app | Usage page matches the UsageEvent rows |

### Phase 4: payments
| # | Step | Done when |
|---|---|---|
| 4.1 | Razorpay subscriptions for Manual and AI + webhooks | Paying moves a test user to the plan; cancelling stops renewal |
| 4.2 | Credits reset monthly; AI credit-pack purchase | Top-up adds credits immediately |
| 4.3 | Trial watermark; upgrade screens | Trial videos have the watermark; paid ones don't |

### Phase 5: launch
| # | Step | Done when |
|---|---|---|
| 5.1 | Terms, privacy, refund policy, takedown contact | Pages are live and linked in the footer |
| 5.2 | Basic moderation (upload type and size, text blocklist) and abuse limits | Bad uploads are refused |
| 5.3 | Landing page with sample videos for each type; pricing page | A visitor can sign up and buy |
| 5.4 | Analytics and error tracking (e.g. PostHog + Sentry) | Errors and sign-ups are visible |
| 5.5 | Confirm the Remotion licence for the team size and usage | Licence bought or confirmed free |

### Phase 6: later (optional)
- Mobile app (Flutter) that uses the same API: create on the phone, render on the server.
- Team workspaces and brand kits (logo, colours, fonts saved once).
- More templates per niche (coaches, restaurants, real estate, D2C).
- Auto-captions from the user's own recorded voice (speech-to-text).
- Direct publishing to YouTube and Instagram.

## 6. Decisions still open
1. Auth provider: Clerk (fastest) or Supabase (auth + database in one).
2. Rendering: Remotion Lambda (simple, scales) or VPS worker (cheaper at low volume).
3. TTS provider for Hindi: Azure Neural (cheap, good Hindi) or ElevenLabs (most natural, pricier).
4. Payment provider: Razorpay only (India), or also Stripe (global).
5. Final prices and credit amounts after a cost test (step 2.1).
6. Product name and domain (SceneForge or new).

## 7. Risks
| Risk | Mitigation |
|---|---|
| Render costs higher than expected | Cost test in step 2.1; limits per plan; smaller output (CRF 23 already) |
| AI costs abused | Server-side credits, rate limits, max scenes and characters per request |
| Slow renders at peak times | Queue with position shown; Lambda parallelism |
| Licence or terms issues | Clear section 3 before taking payments |
| Fake-review UGC ads | Sample labels, terms, moderation |

## 8. Success measures (first 3 months)
- 100 sign-ups, 20 paying users.
- Render success rate above 98%.
- Average render time under 3 minutes for a 30 s video.
- Gross margin above 70%.

---

**Next step:** 0.1, fix the `claude` CLI and test "Write with Claude", or 0.2, the plan switch. Start one only when approved.
