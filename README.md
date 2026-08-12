# Inkception — AI Design Studio

A monochrome, AI-first design studio. Pure black. Pure focus.

Built from the **Inkception** design system (`DESIGN.md`): Zen minimalism, strict
monochromatic palette, Raleway wordmark + Plus Jakarta Sans UI, "Round Eight"
(8px) geometry, tonal layering instead of shadows, ghost borders.

## Live

🌐 **https://successpartner10.github.io/inkception/**

The site deploys automatically whenever `main` is updated (GitHub Actions →
`.github/workflows/deploy.yml`), so the URL always reflects the latest push.

## Highlights

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
- **Effects Gallery** — see every effect as a live thumbnail of YOUR photo,
  wipe-compare, click to apply
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

No GitHub, no internet, no account needed. Two files are shipped with each
release (in the workspace root):

| File | What it is |
|---|---|
| `inkception-standalone.html` | The **whole app in one file** (~8 MB) — 15 fonts + 8 sample photos embedded |
| `inkception-offline.zip` | Same app + the `mediapipe/` AI model folder + `README.txt` (~9 MB) |

**Setup (one time):**
1. Copy `inkception-offline.zip` to your laptop and extract it into a folder
   (keep `inkception.html` and `mediapipe/` side by side).
2. Double-click `inkception.html` — the editor opens in your browser.
   Everything works offline: 358 Actions, recipes, collage, filters, all
   exports (PNG/JPG/WebP/GIF/PDF/PSD/SVG), themes.
3. **Only** the AI-segmentation features (Remove Background, Replace
   Background, Magic Eraser, Smart Crop, Decompose, Motion Blur BG) need a
   tiny local server because browsers block file-to-file reads:
   - in that folder run `python -m http.server`, then open
     `http://localhost:8000/` (Windows: install Python, same command; or use
     VS Code → Live Server).

## Going private on GitHub — what changes, what doesn't

You can make the repo **private** anytime (Settings → Danger Zone). Effects:

- ✅ **Laptop offline version keeps working** — it never touches GitHub.
- ✅ **Your code is hidden** from everyone except invited collaborators.
- ⚠️ **The public site `successpartner10.github.io/inkception/` goes offline**
  — GitHub Pages on the free plan only serves public repos. That is expected;
  your offline copy replaces it.
- ✅ **Pushes still work** — commit + `bash deploy-inkception.sh "msg"` pushes
  fine to a private repo; the deploy workflow automatically **skips** the
  Pages step (no red ❌ runs). Flip the repo back to public and the site
  resumes deploying on its own.
- Note: the *published site* can never be password-gated on the free plan —
  if you need login-restricted access for a small circle, that requires the
  Cloudflare Access route (see `CLOUDFLARE_ACCESS_SETUP.md`).

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
