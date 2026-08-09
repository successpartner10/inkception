# Inkception — AI Design Studio

A monochrome, AI-first design studio. Pure black. Pure focus.

Built from the **Inkception** design system (`DESIGN.md`): Zen minimalism, strict
monochromatic palette, Plus Jakarta Sans, "Round Eight" (8px) geometry, tonal
layering instead of shadows, ghost borders.

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
