# Inkception — Complete Design, Functionality & Technical Spec (Clone Blueprint)

> **Target build**: v0.15.9 · **Purpose**: rebuild this website exactly, from
> scratch, with any stack. This document is the single source of truth:
> design system, screens, features, algorithms, data, and architecture.
>
> Live reference: https://successpartner10.github.io/inkception/

---

## 1. Product Identity

**Inkception** — a monochrome, AI-first design studio that runs entirely in the
browser. No backend, no account, no telemetry. Photographers/marketers/creators
open an image, use one-click tools and on-device AI, and export to exact social
platform sizes.

- **Tagline**: "Pure black. Pure focus."
- **Brand**: text-only wordmark **INKCEPTION** in Raleway (800, uppercase,
  tracking −0.05em). No logo square/monogram in the UI.
- **UI font**: Plus Jakarta Sans (400/500/600/700/800).
- **Aesthetic**: Zen minimalism — extreme contrast, monochrome, whitespace,
  thin structural lines, "less is more". Depth via tonal layering, never
  shadows. Signature geometry: **8px radius** ("Round Eight").
- **Iconography**: 24×24 SVG set, `stroke=currentColor`, `strokeWidth≈1.8`,
  round caps/joins. ~70 icons.

---

## 2. Design System

### 2.1 Color tokens (Tailwind v4 `@theme`)

| Token | Value | Use |
|---|---|---|
| `ink` | `#000000` | primary canvas / page background |
| `surface` | `#131313` | panels, modals, footer |
| `surface-2` | `#1c1b1b` | container-low, chips, inputs |
| `surface-3` | `#201f1f` | container |
| `surface-4` | `#2a2a2a` | container-high, hover fills |
| `fg` | `#e5e2e1` | primary text |
| `dim` | `#c4c7c8` | secondary text |
| `mute` | `#8e9192` | tertiary text, outline |
| `line` | `#262626` | ghost borders |
| `line-2` | `#3a3a3a` | stronger dividers |
| `danger` | `#ffb4ab` | errors (rare) |
| White `#ffffff` | — | primary actions, active states, accents only |

Rules: pure white is **reserved** for primary actions/active states; dividers
are barely-visible; never use colored accents or shadows for elevation.

### 2.2 Typography
- `--font-sans: "Plus Jakarta Sans", system-ui…` — all UI text.
- `--font-display: "Raleway", …` — wordmark only.
- Scale (informal): 48/32/24 display; 18/16 body; 14 label; 12/10/9 micro
  labels (uppercase, tracking 0.1–0.16em).
- Headlines tight leading (1.06–1.2); body 1.6.
- Micro-label utility classes: `.label-xxs` 9px / `.label-xs` 10px /
  `.label-sm` 11px — all uppercase, semibold/bold, letter-spaced.

### 2.3 Geometry & spacing
- Radius: `8px` standard (`rounded-ink`), `16px` large containers
  (`rounded-ink-lg`), 4–6px inner elements.
- Spacing on an **8px grid** (4/8/12/24/48/80). Margins 32px, gutters 24px.
- Touch targets ≥ 32–44px; icon buttons 36px.

### 2.4 Components
- **Button** — variants: primary (white bg, black text), secondary (1px white
  border, white text), ghost (white text, no border), danger. Sizes sm/md/lg/
  icon/iconSm. Uppercase label, tracking 0.12em, radius 8px.
- **IconBtn** — 36px square, dim → hover white; active = white bg + black.
- **Chip** — small 8px-radius badge, surface-2 bg, uppercase 9px.
- **Segmented** — tab strip with bottom 2px white underline on active.
- **Modal** — centered, surface bg, 1px line border, 16px radius, backdrop
  `black/70`, Escape closes, backdrop-click closes. **One modal at a time**.
- **Slider** — 1px track (line-2), white fill on active segment, 13px white
  circle thumb, double-click resets, keyboard arrows work, live value label.
- **Toast** — bottom-center, white pill, auto-dismiss 2.6s.
- **ActionCard / AI card** — 1px border, hover → white border, icon box +
  title + desc; busy shows spinner + progress bar.
- **LayerRow** — thumb 40px, name + type, eye + lock + (trash) icon buttons.
- **Highlight** — search-match wrapper `<mark>` white/25 bg.
- **Checkerboard** — 20px conic-gradient transparency pattern behind canvas.

---

## 3. Layout Architecture

### 3.1 Screens
Two screens, no router — state switch in `App` (`gallery` | `editor`).

### 3.2 Gallery (home)

```
┌──────────────────────────────────────────────────────────┐
│ [INKCEPTION]  🔍 search        [profile]                │  header 48px
├──────────────────────────────────────────────────────────┤
│  [AI-First Design Studio]                                 │
│  Start creating.                                          │  hero card
│  One monochrome canvas for photography, vector & AI…      │
│  [ + New Project ] [ Open / Add Media ] [ Templates ] ⌘N │
│                                                          │
│  RECENT FILES (≤5)                                        │
│  [thumb] name · N Layers · date …                        │
│  PROJECTS (grid, filters All/Recent/Archived)            │
├──────────────────────────────────────────────────────────┤
│ Monochrome Studio      v0.15.9 · © 2026 Inkception       │  footer
└──────────────────────────────────────────────────────────┘
```

- Header: wordmark left, search box (filters projects + templates), profile.
- Hero: chip, headline, subcopy, 3 CTAs.
- Search filters project grid + recent + template modal by name.
- Templates modal: 27 export presets grouped by platform with filter chips,
  click → opens blank canvas at that exact size.
- Project card: 4:3 thumb, name, "N Layers · date", hover overlay (Open,
  Delete w/ confirm). Empty state = dashed card with 3 CTAs.

### 3.3 Editor

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ‹ [INKCEPTION] name [4 Layers]  🔍 search…  ↺ ↻ 🗑  [Open][Export]     │ top 48px
├────────────────────────────────────────────────────────────┬─────────────┤
│                                                             │ tabs:       │
│                    THE CANVAS                               │ Adjust Quick│
│  (checkerboard bg; image fits; overlays: compare,           │ AI Layers   │
│   crop box, paint/erase layers, busy overlay, drop hint)    │ Text More   │
│                                                             │ [panel body,│
│  zoom pill bottom-left · compare toggle bottom-right        │  scrolls]   │
│                                                             │ footer info │
├─────────────────────────────────────────────────────────────┴─────────────┤
│ TOOL DOCK row1: Select Rect Ellipse Line Text Brush · swatch · Crop       │
│   SmartCrop · BlurBrush EraseBrush Compare                                 │
│ TOOL DOCK row2: Zoom− %menu Zoom+ Fit · Import AI Layers                   │
│ (font row appears when Text active)                                        │
└───────────────────────────────────────────────────────────────────────────┘
```

Key rules:
- Right panel is **always visible** on every screen size; canvas shrinks beside
  it (never covered). Collapsible to a 44px icon rail (`chevronRight`/`Left`).
- Only the **selected tab's** content shows.
- Tool dock = 2 centered rows at the bottom, always visible.
- Top bar: back, brand, project name, search, undo/redo/delete, Open, Export.

---

## 4. Feature Inventory (what must work)

### 4.1 Gallery
New Project · Open/Add Media (persistable data-URL import, downscale >1600px) ·
Templates (27 preset sizes, grouped) · Recent Files (last-opened stamped) ·
project delete w/ confirm · search.

### 4.2 Canvas
Fabric.js canvas · pan (drag empty) · zoom (scroll, pill, presets, ⌘0/⌘1/⌘±) ·
checkerboard · drag-drop import · empty states (no-image / blank template) ·
manual crop (drag box, dim outside, live px readout, Apply/Cancel) · smart
crop (subject-aware, 1:1/4:5/9:16/16:9) · before/after divider (⌘B) ·
select/deselect (click empty deselects) · delete (select + ⌫, or trash) ·
eyedropper (click image → sample color → brush/text color) · blur brush ·
erase-to-transparent brush · magic eraser / generative fill (paint → inpaint).

### 4.3 Tools (tool dock)
Select(V) Rect(R) Ellipse(E) Line(L) Text(T) Brush(B) · Crop · SmartCrop ·
Blur brush · Erase brush · Compare · Zoom −/+/Fit · Import · AI · Layers ·
color swatch (dropper). Text tool reveals font row: 15-font picker + size.

### 4.4 Panels (right side)
- **Adjust**: 6 sliders (Brightness, Contrast, Saturation, Exposure,
  Temperature, Tint) + Auto Enhance + Reset.
- **Quick**: 20 one-click effects in 4 groups (Color: Invert/B&W/Sepia/Vintage;
  Adjust: Brighten/Darken/Contrast±/Saturate/Desaturate; Filter:
  Blur/BlurMore/Sharpen/Noise/Pixelate; Transform: FlipH/FlipV/Rotate90/
  ResetAll). Each tap → "…now" toast.
- **AI**: command bar (natural-language → tool) + 17 capability cards grouped
  (Content-Aware, Enhance, Workflow) + Smart Suggestion banner.
- **Layers**: base stack (Vignette, Subject, Backdrop) + AI layers + collage
  photos; per-layer opacity, 12 blend modes, visibility, lock, duplicate,
  delete; collage photo rows get Fit/Fill/Rotate/Swap controls.
- **Text**: Character (font/size/color/bold/italic/tracking/leading) +
  Paragraph (left/center/right/justify).
- **More**: advanced tools (Filters, Selection, Retouch & Paint, Adjustments,
  Shapes) + "Ask How do I…?" button. Everything here is searchable.

### 4.5 AI suite (17, on-device)
1 Remove Background (MediaPipe matting) · 2 Replace Background (black/white/
gradient/transparent) · 3 Magic Eraser (inpaint) · 4 Generative Fill (inpaint)
· 5 Smart Crop · 6 Decompose to Layers (Panels/Text/Subject/Background) ·
7 Smart Text Color (luminance under text) · 8 Portrait Retouch (skin mask:
smooth/blemish/brighten) · 9 Denoise (noise-level adaptive) · 10 Color Grade
(histogram/LUT from reference) · 11 Auto Enhance · 12 Upscale 2×/4×/8× ·
13 Vectorize (edge→SVG) · 14 Motion (zoom/pan/sweep preview) · 15 Batch AI
(removebg/enhance/upscale/denoise × many) · 16 Collage Studio (12 layouts,
place-on-current/new, append, Fit/Fill/Rotate/Swap) · 17 Color Palette
(median-cut dominant colors, copy hex).

### 4.6 More tab (advanced)
- **Filters** (pixel pipeline): Pinch, Twirl, Ripple, ZigZag, Glass,
  Spherical, Emboss, Find Edges, Glowing Edges, Solarize, Sharpen More,
  Sharpen Edges, Median, Add Noise, Film Grain, Graphic Pen, Halftone,
  Tilt-shift.
- **Selection**: Rect/Ellipse Marquee, Lasso, Magic Wand.
- **Retouch & Paint**: Clone Stamp, Healing Brush, Red Eye, Paint Bucket,
  Gradient.
- **Adjustments**: Curves (interactive point curve), Levels (black/white/
  gamma).
- **Shapes**: Polygon, Triangle, Star, Line · **Warp** (cylinder wrap:
  Curvature + Shine).
- **How do I…?** assistant.

### 4.7 "How do I…?" assistant (22 guides)
Ask a question → match by keywords → card with: question, numbered steps
(referencing Inkception tools), **Open tool** button, **Watch on YouTube**
link (`youtube.com/results?search_query=…`). Suggestions chips. No match →
YouTube search fallback. Brand-free content only.

### 4.8 Search (unified, everywhere)
One search box (top bar). As you type: filters the active panel **and** shows a
live dropdown of matching panels, tools, how-tos, export presets, collage
sizes — click to jump. Gallery search filters projects + templates. Search
matches are highlighted. Empty state "No X match".

### 4.9 Export
- 27 platform presets + "Original size": Web(2) Instagram(3) WhatsApp(3)
  Google Business(3) Facebook(6) Pinterest(4) YouTube(4) Email(2).
- 8 formats: PNG, JPG (black bg), WebP, **GIF (animated, LZW)**, **MP4
  (MediaRecorder, WebM fallback)**, **PDF (JPEG-embedded)**, **PSD (layered via
  ag-psd)**, **SVG (fabric or trace)**.
- Filename: `platform-WxH-name-YYYYMMDDHHmmss.ext` e.g.
  `facebook-1080x1080-mypost-20260810-031245.png`.
- Platform filter chips; format hints; cover-crop to preset size; blank-canvas
  exports via fabric toDataURL multiplier.

### 4.10 Collage studio
2–12 photos · 12 layouts (Grid 2/3/4, Diptych, Triptych, Quad, Hero+Sidekick,
Horizontal, Vertical, Masonry, Overlap, Polaroid Spread) · visual slot previews
· layout buttons always clickable (toast if needs more photos; builds with
first N if too many) · Place On: Current Canvas (add/append) or New Image (any
of 27 sizes) · thumbnails w/ remove · per-photo Fit/Fill/Rotate/Swap in Layers
· slot-memory so photos refit into their grid cell.

---

## 5. Data Model

### Project (localStorage `inkception.projects.v1`)
```json
{
  "id": "p-<ts>",
  "name": "Untitled 01",
  "layers": 4,
  "date": "ISO",
  "opened": "ISO",
  "img": "dataUrl | relative path | blob (sanitized)",
  "template": { "w": 1080, "h": 1080 }   // optional blank-canvas project
}
```
On load: filter out seeded sample IDs; replace dead `blob:` img with sample.

### Filter state (adjust)
```json
{ "brightness": 100, "contrast": 100, "saturation": 100,
  "exposure": 0, "temperature": 0, "tint": 0 }
```
Defaults 100/100/100/0/0/0. History stack of these for undo/redo.

### Quick FX state
```json
{ "invert": false, "bw": false, "sepia": false, "vintage": false,
  "blur": 0, "sharpen": false, "noise": 0, "pixelate": 0,
  "flipX": false, "flipY": false, "angle": 0 }
```

### Layers (UI model)
Base: Vignette (Effect), Subject (Photo), Backdrop (Fill). Extra: AI layers
(decompose), collage photos — each `{ id, name, type, visible, dataUrl }`
plus a live fabric object ref for toggling.

### Export presets
```js
{ id, platform, name, w, h, ratio, use }
```

---

## 6. Technical Architecture

### 6.1 Stack
- React 19 + Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite`)
- Fabric.js v6 — canvas engine
- ag-psd — layered PSD writer
- @mediapipe/selfie_segmentation — subject matting (self-hosted WASM)
- Zero backend, zero accounts, localStorage persistence

### 6.2 File map
```
src/
  main.jsx            — mount + window.__INKCEPTION_VERSION__
  App.jsx             — screen switch, project CRUD, localStorage
  index.css           — design tokens + base + utilities (checkerboard, labels)
  components/
    Icon.jsx          — ~70 inline SVG icons
    Logo.jsx          — wordmark (text, Raleway)
    ui.jsx            — Button, IconBtn, Chip, Segmented, Modal, Toast,
                        Slider, ActionCard, LayerRow, Highlight
    BeforeAfter.jsx   — compare divider
    VectorizePanel.jsx— trace UI + SVG export
  screens/
    Gallery.jsx       — home
    Editor.jsx        — the whole editor (single large file)
  lib/
    utils.js          — helpers, fileToDataUrl, download, media query
    filters.js        — adjustment model → fabric filters + CSS filters;
                        quick-fx state + fabric filters + transforms
    export.js         — 27 presets, groups, icons, renderExport
    encode.js         — GIF (median-cut + LZW), PDF, PSD flat, palette
    psd.js            — layered PSD via ag-psd
    motioncapture.js  — motion frames + MediaRecorder
    trace.js          — edge-tracing → SVG
    segment.js        — MediaPipe wrapper: cutout, mask, bbox
    vision.js         — denoise, retouch, colorGrade, inpaint, smartCrop,
                        decompose
    pxengine.js       — filter pipeline, remap filters, convolve, sobel,
                        noise, clouds, sketch, tilt-shift, cylinderWrap,
                        selection ops (flood fill, feather, morph)
    collage.js        — 12 layouts + computeSlots
    fonts.js          — 15-font catalog + Google Fonts URL
    howto.js          — 22 how-to guides + matcher + YouTube search
    prompts.js        — command-bar parser
```

### 6.3 Key algorithms (clone these)
- **Adjustments → fabric filters**: Brightness/Contrast/Saturation (+Exposure
  folded into brightness) + optional Tint (warm/cool) + HueRotation.
- **CSS filter string** for compare overlay + exports: brightness/contrast/
  saturate + sepia/hue-rotate for temperature.
- **MediaPipe matting**: `SelfieSegmentation`, `modelSelection:1`, locateFile →
  `mediapipe/`; mask applied to alpha → true cutout; coverage check <0.5% → "no
  subject". Self-hosted wasm/tflite in `public/mediapipe/`.
- **Inpaint**: multi-pass diffusion from region border (90 passes), used by
  magic eraser / fill; blur brush blends a box-blurred copy under mask; erase
  brush zeroes alpha under mask.
- **Vectorize**: luminance → Sobel → threshold (detail) → run-length lines
  (smoothing) → SVG `<line>`s.
- **Decompose**: flat-region (low variance) → panels; high-contrast low-sat →
  text; segmentation → subject; remainder → background. 4 PNG layers.
- **Collage slots**: fraction rects per layout; photos cover-fit into slots;
  slotRect stored on the fabric object; Fit/Fill rescales around slot center.
- **GIF**: median-cut palette (256) → LZW sub-block encoding per frame.
- **PSD layered**: isolate-render each fabric object (hide others, reset
  viewport, toDataURL × multiplier) → ag-psd `writePsdBuffer` with
  name/opacity/hidden/blendMode/canvas + flattened composite.
- **PDF**: minimal PDF writer embedding a JPEG (DCTDecode), xref offsets.
- **Cylinder wrap**: inverse `asin` remap across width + bow, bilinear sample,
  optional highlight band + edge darkening.
- **Curves**: point list → monotone LUT → apply. **Levels**: black/white range
  + gamma power.
- **Flood fill (wand)**: 4-neighbor BFS with color-distance tolerance.

### 6.4 Export rendering
- Image present → offscreen canvas at preset WxH, cover-crop, ctx.filter =
  cssFilterString → PNG dataURL → format-specific encode.
- Blank canvas → fabric `toDataURL({ multiplier })`.

### 6.5 Motion / video
- Render N frames (zoom/pan/sweep) at target size → GIF (LZW) or
  MediaRecorder on `canvas.captureStream(fps)` (MP4 if supported else WebM).

### 6.6 Persistence
- Projects in localStorage; image files converted to downscaled data URLs
  (blob: URLs die on reload).
- Panel-collapse pref, dock pref in localStorage.

---

## 7. Keyboard Shortcuts

| Keys | Action |
|---|---|
| ⌘Z / ⌘⇧Z | undo / redo |
| ⌘E | export modal |
| ⌘B | before/after |
| ⌘O | open file |
| ⌘N | new project (gallery) |
| ⌘0 / ⌘1 | fit / 100% |
| ⌘+ / ⌘− | zoom in/out |
| V R E L T B | select/rect/ellipse/line/text/brush |
| Delete / Backspace | delete selection |
| Escape | deselect + close menus |
| Arrow keys on slider | adjust value |

---

## 8. Versioning & Deploy

- **Version tag**: `v<ver>-<ts36>` injected by a Vite plugin into
  `<meta name="inkception-version">` + `window.__INKCEPTION_VERSION__`; shown
  in gallery footer. Guarantees cache-proof updates.
- **GitHub Pages**: Actions workflow builds (`npm run build`, `dist`) →
  `upload-pages-artifact` → `deploy-pages`. Auto on push to `main`.
- **base: './'** for subpath-safe assets.

---

## 9. Offline / Standalone build

Two artifacts:
1. `inkception-standalone.html` — single file: JS+CSS inlined, **15 fonts**
   embedded as base64 `@font-face`, sample images embedded as data URLs (so the
   canvas is never tainted on `file://`). Double-click to run; all editing +
   export work offline. (MediaPipe AI needs the folder + a local server; error
   message tells the user.)
2. `inkception-offline.zip` — the standalone + `mediapipe/` folder + README.
   Keep `mediapipe/` **beside** the HTML.

Build script (inline.mjs): read `dist/index.html` + hashed JS/CSS, replace
`./samples/x.jpg` literals AND helper-call forms with data URLs, prepend
embedded-font CSS, write single HTML.

---

## 10. Accessibility / UX best practices used

- Focus ring = 1px white outline; `:focus-within` on inputs (border → white).
- Touch targets ≥ 32px; tap-friendly mobile (panel always visible, no sheets).
- Modals: one at a time, Escape + backdrop close, scrollable content.
- Busy overlay: tap-anywhere skip + 90s watchdog (never blocks the image).
- Drag-drop hint has 2.5s timeout (never sticks).
- Sliders: keyboard arrows, double-click reset, live value, aria attributes.
- All destructive actions confirmed (delete project = two-step).

---

## 11. Third-party / legal notes

- No external editor brand names appear anywhere in the app or docs.
- Google Fonts loaded via CSS2 API at runtime (online) AND embedded offline.
- MediaPipe model files self-hosted (no CDN dependency at runtime).
- YouTube links open in new tab (`target=_blank`, `rel=noreferrer`).

---

*This spec matches the deployed v0.15.9 build. To ship an exact clone: implement
§2 design tokens, §3 layout, §4 features, §6 architecture (or equivalent),
§8 deploy, §9 offline artifacts.*

---

## 12. Full Source Tree (clone from code, not just spec)

The exact tracked file set (49 files) with sizes. To clone **from source**:
clone the repo, `npm install`, `npm run dev`. Everything below is code, not
generated assets.

### Root
```
package.json            520 B   deps: react 19, fabric 6, ag-psd, mediapipe
vite.config.js         1.3 KB   plugins (react, tailwind, version-inject), base './'
index.html             1.3 KB   fonts link, favicon, root div
.gitignore               36 B   node_modules, dist
```

### Build / deploy
```
.github/workflows/deploy.yml   957 B   Pages build+deploy on push to main
```

### Docs
```
CLONE-SPEC.md          21.7 KB   this file
FEATURES.md             9.2 KB   shipped features (v0.15.9)
ADVANCED-REFERENCE.md   2.4 KB   generic advanced-tools catalog
README.md               3.0 KB
cloudflare-access/allowlist.json  472 B   4 emails
cloudflare-access/SETUP.md       3.6 KB   OTP path
cloudflare-access/GUIDE.html     8.1 KB   printable step-by-step
```

### Public assets (served as-is)
```
public/favicon.svg          265 B
public/brand/logo.svg       307 B
public/samples/*.jpg        3 images (bw, mountain, vase)
public/mediapipe/*          12 MB  self-hosted MediaPipe model
  (selfie_segmentation.tflite, _landscape.tflite, .binarypb,
   _solution_simd_wasm_bin.js/.wasm, _solution_wasm_bin.js/.wasm)
```

### App source
```
src/main.jsx                 276 B   mount + version global
src/App.jsx                 3.4 KB   screen switch, project CRUD, localStorage
src/index.css               4.2 KB   design tokens (@theme), base, utilities

src/screens/Editor.jsx     188 KB   THE editor (all panels, tools, AI, export)
src/screens/Gallery.jsx     18 KB   home: hero, recents, projects, templates

src/components/Icon.jsx     8.9 KB   ~70 inline SVG icons
src/components/ui.jsx       13 KB    Button, IconBtn, Chip, Segmented, Modal,
                                     Toast, Slider, ActionCard, LayerRow, Highlight
src/components/Logo.jsx      642 B   wordmark
src/components/BeforeAfter.jsx 2.3 KB  compare divider
src/components/VectorizePanel.jsx 3.9 KB  trace UI

src/lib/utils.js            2.9 KB   helpers, fileToDataUrl, downloads
src/lib/filters.js          3.6 KB   adjustment→fabric/CSS filters, quick-fx
src/lib/export.js           4.9 KB   27 presets, groups, icons, renderExport
src/lib/encode.js           16 KB     GIF(LZW), PDF, PSD-flat, palette
src/lib/psd.js              1.8 KB   layered PSD via ag-psd
src/lib/motioncapture.js    3.7 KB   motion frames + MediaRecorder
src/lib/trace.js            3.3 KB   edge-trace → SVG
src/lib/segment.js          5.6 KB   MediaPipe wrapper (cutout, mask, bbox)
src/lib/vision.js           16 KB    denoise, retouch, colorGrade, inpaint,
                                     smartCrop, decompose
src/lib/pxengine.js         16 KB    filters, remap, convolve, sobel, noise,
                                     clouds, sketch, tilt-shift, cylinderWrap,
                                     selection ops
src/lib/collage.js          3.0 KB   12 layouts + slots
src/lib/fonts.js            2.5 KB   15 fonts + Google Fonts URL
src/lib/howto.js            11 KB    22 guides + matcher + YouTube search
src/lib/prompts.js          3.5 KB   command-bar parser
```

### To build an exact clone from source
```bash
git clone https://github.com/successpartner10/inkception.git
cd inkception
npm install
npm run dev        # dev server
npm run build      # → dist/ (GitHub-Pages-ready)
node /home/user/inline.mjs   # (optional) offline single-file artifact
```

### Source-accuracy notes
- `Editor.jsx` is intentionally monolithic (single file holds the whole
  editor) — ~5,500 lines. Cloning: you may split it; the behavior is what
  matters.
- The `pxengine`, `vision`, `encode`, `segment`, `howto`, `collage`, `export`
  libs are self-contained and portable — copy them verbatim.
- MediaPipe files must be re-fetched from `@mediapipe/selfie_segmentation`
  (`node_modules/.../wasm` + tflite) and placed under `public/mediapipe/`.
