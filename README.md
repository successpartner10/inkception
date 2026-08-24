# Inkception — AI Design Studio

A monochrome, AI-first design studio. Pure black. Pure focus.

Built from the **Inkception** design system (`DESIGN.md`): Zen minimalism, strict
monochromatic palette, Raleway wordmark + Plus Jakarta Sans UI, "Round Eight"
(8px) geometry, tonal layering instead of shadows, ghost borders.

## License & status

- **The repo is PRIVATE** — source and full history are visible only to the
  owner and invited collaborators.
- **Hosted live (public)**: **https://inkception.pages.dev/** — deployed to
  Cloudflare Pages from this repo's `dist/` (token/account in workspace,
  `wrangler@3 pages deploy`). Re-deploy after every `npm run build`.
- **Locking down (planned)**: Cloudflare Access will gate the URL to the 4
  allowed Gmail accounts (see `cloudflare-access/allowlist.json` + the
  SETUP doc). **Access is not enabled on the account yet** — enable it in the
  Zero Trust dashboard, then the Access app + email-allowlist policy gets
  applied.
- **License:** see [`LICENSE`](LICENSE). Free for personal, non-commercial
  use. Commercial use requires a paid license. **Redistribution, resale, and
  cloning are prohibited.**

## Highlights

- **v0.18 — Big & obvious:** website-style section menu on top (Edit · Pixel Studio · Fix & AI · Collage · Template · Layers · Export); much bigger, bolder interface text (+ Settings → Interface text size: Comfort/Normal/Large); **Extract Layers** with real AI (person + face detection + OCR — one layer per text block, clean filled background, every layer movable & scalable); **Pixel Studio** — Photoshop-style toolset always visible (brush, erase, blur, AI remove, clone, heal, bucket + size slider); **face frames** — add a face/photo to any banner template as an adjustable frame (auto-centered, drag to show just the eyes, handles to zoom to the full face).

- **Free & private** — no account, no backend, no data leaves the device
- **358 one-click Actions** + real on-device AI (subject matting, inpainting,
  smart crop) — honest about what needs a paid model
- **“What do you want to do today?”** — a persistent dropdown in the header
  (auto-opens on first visit) that shows everything that's possible; pick a
  goal and it acts immediately, or expand any goal for the "here's how" steps
- **No mystery icons** — every menu and tool shows its name: labelled panel
  tabs (Adjust · Actions · Recipes · AI · Layers · Text), a labelled tool
  dock, and an editor search that starts as a compact magnifying glass
  (click, or `/` / ⌘K, to expand)
- **Accurate gallery previews** — each project card shows a live thumbnail of
  the current canvas, captured as you edit — no stale originals
- **Recipes** — save any repeated steps as a named one-click task; the app
  learns your "most used", predicts your next step, and nudges you to save
  repeated chains as recipes
- **Effects Gallery** — every effect as a live thumbnail of YOUR photo with
  fast streaming previews (tiles appear as they render, cached), category
  filters + search, and accurate per-effect previews; picking one collapses
  the panel instantly on mobile so you see the result land on the image
- **Tunable Enhance** — strength slider + Reduce chips + region-only, so
  it's never too strong
- **Visual Templates & Layouts** — every platform size as a real
  aspect-ratio card with ratio quick-filters (Square/Portrait/Landscape/
  Story/Wide), a live hover preview stage, and drawn collage layouts —
  no more endless text list
- **Multi-size export** — tick the platform sizes you need → one
  `project-<ts>.zip` with every size at once (27 presets × 8 formats)
- **Interface themes** — Dark (default) / Light / Auto, plus Settings hub
- **PWA** — installable like an app; works offline after first visit
- **Paste to edit** — Ctrl/Cmd+V drops a screenshot straight onto the canvas
- **Privacy** — Settings → Forget my learning / Clear all local data
- **8 sample photos** to start from, one click
- **Fast** — code-split: ~716 KB main bundle, AI model loads on demand
- Works offline: `inkception-standalone.html` (fonts + 8 samples embedded)

## Use it on your laptop — fully offline

No GitHub, no internet, no account needed. The two offline files are built on
every release and live **in the workspace root** (they are NOT published on
any public URL — they ship only to buyers / by private hand-off):

| File | What it is |
|---|---|
| `inkception-standalone.html` | The **whole app in one file** (~2.7 MB) — core fonts + 8 sample photos embedded |
| `inkception-offline.zip` | Same app + the `mediapipe/` AI model folder + `README.txt` (~5.4 MB) |

**Setup (one time):**
1. Take `inkception-offline.zip` and extract it into a folder (keep
   `inkception.html` and `mediapipe/` side by side).
2. Double-click `inkception.html` — the editor opens in your browser.
   Everything works offline: 358 Actions, recipes, collage, filters, all
   exports (PNG/JPG/WebP/GIF/PDF/PSD/SVG), themes.
3. **Only** the AI-segmentation features (Remove Background, Replace
   Background, Magic Eraser, Smart Crop, Decompose, Motion Blur BG) need a
   tiny local server because browsers block file-to-file reads:
   - in that folder run `python -m http.server`, then open
     `http://localhost:8000/` (Windows: install Python, same command; or use
     VS Code → Live Server).

> **Copyright note:** these files are licensed, not sold — see
> [`LICENSE`](LICENSE). Reselling, republishing, or cloning them is
> prohibited and enforceable.

## The repo is private — what that means

- ✅ **Laptop offline version keeps working** — it never touches GitHub.
- ✅ **Source + history are hidden** from everyone except invited collaborators.
- ✅ **The product is hosted on Cloudflare Pages** (`inkception.pages.dev`)
  instead of GitHub Pages — Pages serves it even from a private repo, and the
  URL is locked down with Cloudflare Access (email allowlist) once enabled.
- ✅ **Pushes still work** — commit + `bash deploy-inkception.sh "msg"` pushes
  fine to a private repo; the GitHub Pages deploy workflow automatically
  **skips** (no red ❌ runs).

## AI lanes (v0.19)

- **Free lane — no key, no account:** the `functions/api/` Pages Function
  (`/api/describe`, `/api/copy`, `/api/generate`) runs on **Workers AI**
  (free tier, rate-limited per IP). Needs the **AI binding** — it's declared
  in `wrangler.toml`, or add it in the dashboard: Pages project →
  Settings → Bindings → Workers AI binding named `AI`.
- **Pro lane — your own key:** paste a Google AI key
  ([aistudio.google.com](https://aistudio.google.com) → Get API key, billing
  required) in Settings → AI keys. Powers photoreal image generation
  (≈$0.05–0.15/image) and Veo video (≈$0.15/s, ~$1.20 per 8s clip). The key
  is stored on-device; calls go browser → Google directly.
- **On-device lane — always free & private:** Extract Layers (person/face/
  text/background), all 358 actions, Live FX, 2.5D depth animation.
- First cloud use shows a one-time consent (images leave the device only
  then). Reset it in Settings.

## Stack

- **React 19** + **Vite 6**
- **Tailwind CSS v4** (design tokens in `src/index.css` → `@theme`)
- **Fabric.js v6** — canvas rendering, filters, pan/zoom
- **Zero UI frameworks** — all components hand-built to the design system

## Run

```bash
npm install
npm run dev      # dev server (defaults to :5173)
npm run build    # production build → dist/
```

## Structure

```
public/
  samples/            sample photography used by seed projects
  brand/              official logo assets (SVG)
    logo.svg            primary lockup (monogram + wordmark, 1024)
    monogram.svg        app icon (512)
  favicon.svg         monogram favicon
src/
  components/
    Logo.jsx            brand monogram + lockup React components
    Icon.jsx            InkceptionIcon — 24×24 stroke icon set
    ui.jsx              Button, Chip, Segmented, Modal, Toast, Slider,
                        ActionCard, LayerRow
    BeforeAfter.jsx     before/after comparison divider
    VectorizePanel.jsx  vectorize UI (detail/smoothing sliders)
  screens/
    Gallery.jsx         home: hero + project grid (localStorage-backed)
    Editor.jsx          canvas workspace: adjust / AI / layers tabs,
                        export presets, tool ribbon, mobile sheet
  lib/
    filters.js          adjustment model → Fabric filter chain + CSS filters
    export.js           platform preset renders (1080×1080, 1080×1920, 1280×720)
    trace.js            real edge-tracing → SVG (vectorize engine)
    utils.js            shared helpers
```

## Deploy to GitHub Pages

The repo ships with a Pages workflow (`.github/workflows/deploy.yml`) — push to
`main` and it builds and publishes automatically.

```bash
git remote add origin https://github.com/<user>/Inkception.git
git branch -M main
git push -u origin main
```

Then in the GitHub repo settings:

1. **Settings → Pages → Source: "GitHub Actions"** (required for this workflow).
2. First deploy takes ~1–2 min — check **Actions → Deploy to GitHub Pages**.

Live URL: `https://<user>.github.io/Inkception/`

## Notes

- The AI suite (auto enhance, remove background, upscale 4×, vectorize) runs
  **real, in-browser pipelines** (Fabric filters, layer toggles, 4× canvas
  resample, Sobel-based SVG tracing) as a preview-grade stand-in — swap in your
  model endpoint for production.
- All UI state persists locally (projects in `localStorage`).
