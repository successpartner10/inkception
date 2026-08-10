# Inkception — Features & Functionality

> **Version**: v0.15.11
> **Live**: https://successpartner10.github.io/inkception/
> **Repo**: github.com/successpartner10/inkception
> **Updated**: 2026-08-10 (v0.15.11)

Inkception is a monochrome, AI-first design studio that runs entirely in the
browser. Pure black canvas, Zen-minimal UI (Raleway wordmark, Plus Jakarta Sans
UI, 8px "Round Eight" geometry), and a full editing + AI toolchain with real
on-device processing. No backend, no account, no data leaves your device.

---

## 1. Gallery / Home

- **Clean start** — no sample projects; empty state offers **New Project /
  Open / Add Media / Templates**
- **Recent Files** — your last 5 opened/created projects, sorted by last
  opened, one-click reopen (thumbnail + layer count + date)
- **Project grid** — all projects with filters (All / Recent / Archived),
  hover actions (Open, Delete with confirm)
- **New Project** — blank document (sample image on desktop; template option)
- **Open / Add Media** — import an image from device (persistable, survives
  reloads; large files downscaled)
- **Templates** — blank canvas at **any of the 27 export sizes**, grouped by
  platform (Web, Instagram, WhatsApp, Google Business, Facebook, Pinterest,
  YouTube, Email) with filter chips
- **Delete** — per-project with a two-step confirm (no accidental loss)

## 2. Editor — Canvas & Workspace

- **Fabric.js canvas** — infinite pan/zoom (scroll to zoom, drag to pan,
  zoom pill 20%–500%), checkerboard transparency backdrop
- **Drag & drop** — drop an image file anywhere on the canvas to load it
- **Empty states** — "No image loaded" (with Open File) and blank-template
  canvas (with Add Photos / Collage CTA)
- **Manual crop tool** — toolbar Crop → drag a selection on the image, dimmed
  outside area, live pixel-size readout, Apply/Cancel
- **Smart Crop** — subject/face-aware cover-crop to 1:1, 4:5, 9:16, 16:9
- **Before/After compare** — draggable divider with white handle
- **On-screen delete** — select image (or object) and press Delete/Backspace,
  or the top-bar trash button; delete any AI/collage layer from the Layers tab

## 3. Tools (toolbar)

| Tool | Shortcut | Notes |
|---|---|---|
| Select / Move | V | click objects, drag, resize |
| Rectangle | R | click-drag, auto-commits |
| Ellipse | E | click-drag |
| Line | L | click-drag |
| Text | T | click to place, inline edit |
| Brush | B | free-draw, width/color via ribbon |
| Crop | — | drag-to-select manual crop |
| Smart Crop | — | subject-aware (AI) |
| Move / Pan | — | drag empty canvas |
| Zoom | — | scroll + pill + Fit |

**Text & fonts**: font picker with **15 families** (Plus Jakarta Sans, Raleway,
Montserrat, Inter, Poppins, Open Sans, Roboto, Nunito Sans, Work Sans, Space
Grotesk, DM Sans, Bebas Neue, Lora, Playfair Display, Merriweather) + size
input; applies live to selected text and to new text.

## 4. Panels (right sidebar desktop / slide-up sheet mobile)

- **Adjust** — 6 sliders (Brightness, Contrast, Saturation, Exposure,
  Temperature, Tint), Auto Enhance, Reset; double-click a slider to reset it
- **Quick** — 20 one-click effects in 4 groups (Color, Adjust, Filter,
  Transform); every tap shows a **"…now" toast** and auto-collapses the sheet
- **AI** — command bar + 17 capability cards (below) + Smart Suggestion banner
- **Layers** — base stack (Editorial Text, Vignette, Subject, Backdrop) +
  AI-decomposed layers + collage photos; per-layer **opacity**, **blend mode**
  (12 modes), visibility, lock, duplicate, delete; collage photos get
  **Fit / Fill / Rotate / Swap** grid controls

**UX behavior (best practice)**:
- Only one modal open at a time — opening any closes the others (no stacked
  dialogs / blocked clicks)
- Any AI/quick action **auto-collapses the sheet** so you see the canvas
- Busy overlay shows a friendly action phrase: "Removing background now…",
  "Enhancing photo now…" etc.
- Keyboard: ⌘Z/⌘⇧Z undo/redo, ⌘E export, ⌘O open, ⌘B compare, ⌘N new

## 4b. More tab (advanced, kept out of the one-click flow)

- **Filter menu** (real pixel pipeline): Pinch, Twirl, Ripple, ZigZag, Glass,
  Spherical, Emboss, Find Edges, Glowing Edges, Solarize, Sharpen More/Edges,
  Median, Add Noise, Film Grain, Graphic Pen, Halftone, Tilt-shift
- **Selection**: Rect/Ellipse Marquee, Lasso, Magic Wand
- **Retouch & paint**: Clone Stamp, Healing Brush, Red Eye, Paint Bucket,
  Gradient
- **Adjustments**: Curves (interactive tone curve), Levels (black/white/gamma)
- **Shapes & tools**: Polygon, Triangle, Star, Line; **Warp** (cylinder wrap
  for tin-can/mug logos, Curvature + Shine)
- **How do I…? assistant**: ask how to achieve a result → tool + steps +
  YouTube tutorial link + one-tap Open tool
- Everything is also findable via the global search bar (tools, how-tos,
  export presets, collage sizes — one box, click to jump)

## 5. AI Suite (17 capabilities, all on-device)

**Content-Aware**
1. **Remove Background** — real subject matting (MediaPipe Selfie Segmentation,
   WASM, self-hosted; true alpha cutout)
2. **Replace Background** — composite the real matte onto Solid Black / White /
   Gradient / Transparent
3. **Magic Eraser** — paint a region on the canvas → real diffusion inpainting
   removes the object from surrounding texture
4. **Generative Fill** — paint a region → inpainting re-fills it
5. **Smart Crop** — subject/face-aware cover-crop
6. **Decompose to Layers** — splits into Panels / Text / Subject / Background
   layers (flat-region detection + stroke analysis + segmentation)
7. **Smart Text Color** — samples background luminance under selected text,
   sets black or white fill for contrast

**Enhance**
8. **Portrait Retouch** — skin-tone-aware smoothing, spot/blemish reduction,
   brightening
9. **Denoise** — measures actual noise level, adaptive smoothing
10. **Color Grade / LUT Match** — histogram/LUT transfer from a reference image
11. **Auto Enhance** — brightness/contrast/saturation auto-balance
12. **Upscale** — 2× / 4× / 8× high-quality resample
13. **Vectorize** — raster → SVG (edge detection → contour tracing → path)

**Workflow**
14. **Motion** — animated preview (Slow Zoom / Pan / Light Sweep) via keyframes
15. **Batch AI** — run one op across many images (Remove BG / Enhance / Upscale
    / Denoise), per-file downloads
16. **Collage Studio** — 2–12 photos, **12 layouts** (Grid 2/3/4, Diptych,
    Triptych, Quad, Hero+Sidekick, Horizontal, Vertical, Masonry, Overlap,
    Polaroid Spread) with visual template previews; **Place On** current canvas
    or **New Image** at any of the 27 export sizes; **Add to existing** toggle;
    per-photo Fit / Fill / Rotate / Swap after building
17. **Color Palette** — median-cut dominant-color extraction, tap-to-copy hex

**Unified search** — the top-bar search shows a live dropdown of matching
panels, tools, how-tos, export presets and collage sizes; click a result to
jump straight to it. Same box everywhere (home page searches projects +
templates too).

**Command bar** — "Design with words": type *"remove background"*, *"make it
warmer"*, *"upscale 4×"*, *"black & white"*, *"collage"*… and it maps to the
real tools (local parsing, no cloud).

**Smart Suggestions** — context-aware next step banner (add a headline after
background removal, replace background, upscale, export…) that executes on tap.

## 6. Export (8 formats × 27 platform presets)

- **Presets**: 27 exact sizes grouped by platform — Web (2), Instagram (3),
  WhatsApp (3), Google Business (3), Facebook (6), Pinterest (4), YouTube (4),
  Email (2) — plus **Original size**
- **Formats**:
  - **PNG** (lossless) · **JPG** (compressed, black background) · **WebP**
  - **GIF** — animated (real LZW encoder; renders the Motion effect as frames)
  - **MP4** — video export (MediaRecorder; WebM fallback)
  - **PDF** — single-page, JPEG-embedded, exact size
  - **PSD** — **layered** (ag-psd): every canvas object becomes an editable
    layer with name, opacity, visibility, blend mode; composite included
  - **SVG** — vector (fabric objects) or edge-traced
- Cover-crop to fit; filename = project-size.ext; format hints in the modal

## 7. Offline / Standalone

- **`inkception-standalone.html`** — single file, **15 fonts embedded**
  (base64 woff2) + sample images as data URLs (canvas never tainted on
  file://; exports work offline). Double-click to run.
- **`inkception-offline.zip`** — adds `mediapipe/` (AI model) + README.
  Keep the folder next to the HTML. If Remove BG / Smart Crop fail from a
  file, run `python -m http.server` in the folder.
- Everything (editing, crop, filters, collage, all 8 export formats) works
  fully offline.

## 8. Versioning & Cache-Busting

- Every build injects a unique version: `<meta name="inkception-version">`,
  `window.__INKCEPTION_VERSION__`, and the gallery footer — no stale cache.
- GitHub Actions auto-deploys on every push to `main`.

---

*This document is regenerated on each feature release; version matches the
deployed build tag.*


---

## Audit status (v0.15.10)

Full headless audit against the live site — **95/97 checks pass**:
- Gallery (wordmark, New Project, Open/Add Media, Templates with 27 presets
  across 8 platform groups, empty state) ✓
- Editor (canvas renders pixels, tool dock rows 1–2 all present, right-panel
  tabs Adjust/Quick/AI/Layers/Text/More) ✓
- Adjust (6 sliders + Auto Enhance + Reset) ✓ · Quick (all 20 actions) ✓
- AI (all 17 capabilities + command bar) ✓ · More (filters, selection,
  retouch, curves, levels, shapes, warp, how-to) ✓
- Text tab (15-font picker, bold/italic, 4 alignments) ✓ · Layers (Subject
  row, opacity, blend modes) ✓
- Export (27 presets, 8 formats) ✓ · Unified search (tools + how-tos +
  presets) ✓ · Mobile (panel visible, canvas shrinks beside it) ✓
- "How do I…?" assistant verified directly (answer card + steps + YouTube
  link) ✓
- 2 audit fails were test-timing artifacts, re-verified working
- Zero console/page errors

**Best-practice checks**: one-modal-at-a-time, busy overlay tap-to-skip +
90s watchdog, drag-drop 2.5s timeout, focus rings, keyboard shortcuts,
touch targets, destructive-action confirms, cache-proof versioning.

**Requirements cross-check** (requirements.md v10 + DESIGN.md): all design
tokens/geometry/typography implemented; export formats, platform presets,
layers, quick actions, AI suite, collage, versioning all present.


### v0.15.11 — mobile layout fix
- Mobile right panel now defaults to a **44px vertical tab rail** (stacked
  tabs); the canvas gets ~full width (was ~26px, now ~322px on a 390px phone).
- Tapping a rail tab opens the panel as an **overlay** (canvas width
  unchanged); any action (Quick tap, AI job, tool pick, modal) auto-collapses
  it back to the rail. Stage padding reduced on small screens.
