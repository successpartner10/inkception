# Inkception — Complete Documentation

**Version 0.19.0** · AI-first design studio · Pure black. Pure focus.

Live: **https://inkception.pages.dev/** · GitHub Pages mirror: **https://successpartner10.github.io/inkception/**

---

## 1. What Inkception is

A free, private, in-browser design studio. Everything runs on your device unless
you explicitly opt into a cloud AI step. No account, no tracking, projects live
in your browser's local storage.

Three AI "lanes" — always labeled honestly:

| Lane | Needs | Powers | Cost |
|---|---|---|---|
| **On-device** | nothing | Extract Layers (person/face/text/background), Remove Background, all 358 Actions, Live FX, 2.5D depth motion, all exports | $0 forever |
| **Free lane** | nothing (auto) | Describe Image, AI Headlines & CTA, basic Generate Image — via the `/api/` Pages Function on Cloudflare Workers AI | $0 (rate-limited) |
| **Pro lane** | your Google AI key | Photoreal image generation (Nano Banana), Veo video | ≈$0.05–0.15/image · ≈$0.15/s video — billed to YOUR key |

First cloud use shows a one-time consent gate. Reset it in Settings.

---

## 2. Quick start (first-time user)

1. Open the app → the **Welcome** dialog shows three doors: *Fix a photo · Make a banner · Try the AI magic*.
2. Pick any door — you land inside a real task immediately.
3. In the editor, the **section menu on top** (Edit · Pixel Studio · Fix & AI · Collage · Template · Layers · Export) is your map. The **1-2-3 strip** (Open → Section → Export) shows the basic flow; hide it when you're comfortable.
4. Beginner **tips** are on by default (Settings → Beginner tips to toggle). Search anything with `/` or ⌘K.

---

## 3. The Gallery (home)

- **Section nav**: Edit · Fix & AI · Collage · Templates · Export · Restore — each acts immediately.
- **Projects grid** with live canvas thumbnails; rename inline, delete with confirm.
- **Templates section**: 27 platform sizes as ratio cards with filters + live preview stage; custom sizes via Export → Add size.
- **Samples**: 8 photos to start instantly. Reopen the welcome guide via the ⓘ button.

## 4. The Editor

### Sections (top menu)
| Section | Lands on | Notes |
|---|---|---|
| **Edit** | Layers panel (opens the file picker if empty) | "Edit must have Layers" — it does |
| **Pixel Studio** | Photoshop-style tool bar | see below |
| **Fix & AI** | AI tab | Extract Layers, Describe, Generate, Animate… |
| **Collage** | Collage Studio modal | 12 layouts, 2–12 photos, reference auto-detect |
| **Template** | Templates / collage sizes | |
| **Layers** | Layers panel | every layer visible, toggle, lock, delete |
| **Export** | Export modal | PNG/JPG/WebP/GIF/MP4/PDF/PSD/SVG + multi-size ZIP |

### Pixel Studio (Photoshop-style)
One click from the section menu, the header button, or the dock chip. Bar: **Brush · Erase · Blur · AI Remove · Clone · Heal · Bucket** + size slider. Also reachable by searching "photoshop".

### Extract Layers (AI tab → Extract Layers)
Real AI separation into **Face · Person · one layer per text block · clean Background** (holes filled). MediaPipe person segmentation + BlazeFace + OCR (tesseract, loads once, cached; falls back to a built-in heuristic offline). Every layer is **movable & scalable**, and exports as named PSD layers.

### Face frames (templates)
Template → **Add Face / Photo** → the photo drops into an adjustable frame, auto-centered on the face. **Drag** to pan (show just the eyes), **corner handles** to zoom (full face). White frame bar: **Face · Fill · Fit · − ＋ · Release**.

### Motion & Live FX (AI tab → Animate, or Motion)
- Camera motion: Off · Slow Zoom · Pan · Light Sweep · **2.5D Depth** (free — uses your extracted Person layer; auto-runs Extract Layers if needed)
- **Live FX** (free): Fireworks · Sparkles · Confetti · Rain · Snow · Fireflies · Light Leak — with Amount/Speed sliders, live on canvas
- **Exports**: GIF and MP4 render the motion **and** Live FX into the file; PNG/JPG composite a representative FX frame. Deterministic engine — export matches preview.

### AI Create (AI tab, first group)
- **Describe Image** → structured prompt (SUBJECT/BACKGROUND/STYLE/TEXT). Edit it, copy it, or send it straight to Generate. Free lane → your key as fallback.
- **Generate Image** → text→image. Free lane for backgrounds/textures; Pro lane (your key) for photoreal. Result lands as a movable layer.
- **AI Headlines & CTA** → 6 suggestions (3 headlines + 3 CTAs). Click one → it becomes an **editable text layer**. Works offline (local fallback bank).
- **Animate** → the three animation routes with prices up front: Live FX (free) · 2.5D (free) · **AI Video via Veo** (≈$0.15/s, ≈$1.20 per 8s clip, your key, render button shows cost first, MP4 download).

### Settings
- **Interface text size**: Comfort / Normal / Large — scales the entire UI (everything is rem-based)
- **Beginner tips**: on/off
- **AI keys**: paste your Google AI key (aistudio.google.com → Get API key, billing required). Stored on-device only; calls go browser → Google directly. Lane status shown live.
- **Interface theme**: Dark / Light / Auto · **AI mode**: Guided vs ⚡ Just do it · shortcuts · privacy (forget learning / clear all data)

---

## 5. AI lanes: setup & costs

### Free lane (no setup)
`functions/api/[[path]].js` is a Cloudflare Pages Function using the Workers AI
binding (declared in `wrangler.toml`). If Describe/Generate reports the lane is
down: dashboard → Pages project → Settings → Bindings → **Workers AI, name `AI`**
→ redeploy. Rate limit: ~60 requests/hour/IP.

### Pro lane (your key)
1. https://aistudio.google.com → **Get API key** → add a billing account.
2. Paste it in Inkception → Settings → AI keys.
3. Set a budget alert (~$25) in Google's billing console.

Typical personal usage: 20 images + 10 eight-second videos/month ≈ **$11–35**.
Model routes: images = Nano Banana class (watermarked by Google SynthID),
video = Veo 3.1 Fast → Standard fallback (billed per successful second).

### Privacy
On-device by default. Cloud steps require the one-time consent. The Google key
never leaves your browser except in requests you trigger to Google itself.

---

## 6. Deployment

### Cloudflare Pages (primary)
```bash
npm install && npm run build
npx wrangler pages deploy dist
```
`wrangler.toml` ships the AI binding with the deploy. Verify the version tag
(view-source `inkception-version`) after deploying.

### GitHub Pages (mirror)
Pushing to `main` triggers `.github/workflows/deploy.yml`
(https://successpartner10.github.io/inkception/). The app is base-relative, so
the subpath works. Note: GitHub Pages serves no server functions — the free AI
lane exists only on Cloudflare Pages; the app falls back gracefully (offline
copy suggestions, clear errors elsewhere).

### Password-protect the site (Cloudflare Access)
Follow `cloudflare-access/GUIDE.html`: Zero Trust (free) → Access → Self-hosted
app → `inkception.pages.dev` → login: One-time PIN → policy: allow only your
email. ~15 minutes, no code.

### Offline / standalone
- `npm run build -- --config vite.standalone.config.js` → single self-contained HTML
- `inkception-offline.zip` (workspace root) = standalone HTML + `mediapipe/` + README.
  AI segmentation features need `python -m http.server` in the folder (browser
  file:// limits); cloud lanes need internet.

---

## 7. Keyboard shortcuts

| Keys | Action |
|---|---|
| `/` or `⌘K` | Search everything |
| `V R E L T B` | Select · Rect · Ellipse · Line · Text · Brush |
| `⌘Z / ⌘⇧Z` | Undo / Redo |
| `⌘E` | Export |
| `⌘N` | New project |
| `⌘V` | Paste image onto canvas |
| `⌘0` | Fit screen |
| `⌘B` | Before/After compare |

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Extract Layers text is coarse | First run downloads the OCR engine (~5 MB) — needs internet once; offline uses the heuristic |
| "Free lane unavailable" | You're likely on GitHub Pages (no functions) or the Pages binding is missing — see §5 |
| Veo button says no key | Settings → AI keys; key needs billing enabled |
| Video render fails | Model IDs drift — the app tries Veo 3.1 Fast → 3.1 → 3.0; if all fail, report and it's a one-line fix in `src/lib/ailane.js` |
| Old version after deploy | Hard refresh (Ctrl+Shift+R); check the `inkception-version` meta tag |
| Offline HTML: AI cutout fails | Serve the folder over http (see §6 Offline) |

---

## 9. Version history

See **CHANGELOG.md**. Current: **0.19.0** (novice-first UX, Live FX, 2.5D, AI lanes).
