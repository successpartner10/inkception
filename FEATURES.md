# Inkception — Features & Functionality

> **Version**: v0.16.2
> **Live**: https://successpartner10.github.io/inkception/
> **Repo**: github.com/successpartner10/inkception
> **Updated**: 2026-08-11 (v0.16.2)

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

## 4c. Recipes — save your steps as one-click tasks

- **Recipes tab** (pin icon in the dock): your saved tasks, each with a name,
  emoji, step list and run count
- **Capture**: every action you run — from the Actions grid, guided prompts,
  or command chains — is recorded in "From your last steps"; tick a few and
  save as a recipe (auto-named + auto-emoji)
- **Builder**: searchable library of 40+ free/local operations (gallery
  actions + one-touch: Auto Enhance, Crop to Square/Portrait, Remove
  Background, Sharpen, Auto Text Color, B&W, Warm/Cool, Brighten/Darken,
  Contrast, Saturate/Desaturate) — reorder, remove, rename
- **Run**: one click replays the whole sequence; the ✓ bar's Undo reverts the
  entire recipe in one step
- **Self-learning**: "Most used" row (per-key counts + recency) stored in
  localStorage — the foundation for pattern nudges & next-step prediction
- **Command bar**: "run my recipe" / "run <name> recipe" / "run my edit"
- Honest limits: steps that need input (brushes, region clicks, model-only
  AI) are marked "needs input" and excluded from recipes

## 4d. Settings & interface themes

- **Settings** (sliders icon in the top bar): no account, no server — every
  preference is stored in your browser
- **Interface theme**: **Dark** (default, monochrome studio look) · **Light**
  (light chrome over the black canvas — the stage stays dark so white text
  stays visible) · **Auto** (follows the OS live). Applied before first
  paint, remembered per device
- **AI assistant mode**: Guided (propose → confirm → run) vs ⚡ Just do it
  (runs immediately, still undoable) — also toggleable inline in the AI tab
- Automatic & always-on: autosave (every 15 s + on close), snapshot undo
  history, recipe + usage stats — all in localStorage

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
- **Multi-size batch → one .zip**: checkboxes on every preset (Select all /
  per-platform Check all / Original size); **Export N sizes (.zip)** renders
  PNG/JPG/WebP at each checked size into a single zip folder with
  platform-named files — the "pick 1–2–3 sizes, all at once, one folder"
  flow; selection persists for re-exports
- Cover-crop to fit; filename = platform-size-name-timestamp.ext

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


### v0.15.12–14 — fixes
- AI/Layers tab buttons now expand the collapsed panel (fixed blank page)
- ProjectCard gallerySearch scope bug fixed (blank page with saved projects)
- **Magic Eraser / Generative Fill fixed** — inpaint had a `const` being
  reassigned in the buffer swap ("Assignment to constant variable") that
  broke every inpaint; now uses `let` + correct mask dims + faster 640px
  pipeline → object removal works
- **Undo/redo rebuilt**: snapshot-based history (image + filters + quick fx)
  covering image replacements, crops, filters, quick actions; ⌘Z/⌘⇧Z work
- Command bar: unknown phrases now open the "How do I…?" assistant instead
  of a dead end


### v0.15.15 — live command chains
- Type a chain in the AI command bar: "auto enhance, now crop to square,
  then black & white" — each step runs in sequence with a ✓ summary toast
- "Undo last command" / "undo last" reverts only the last step (each
  command stores a before-snapshot); the command counter shows how many
  steps are stacked, with an "Undo last" button
- New phrases: crop to square (1:1), crop to portrait (4:5)
- Fixed fabric Temperature filter (Tint class not exported → ColorMatrix)


### v0.15.16 — guided commands + history mini-map
- "open quick menu" / "open ai menu" / "open layers" / "open text" /
  "open more" / "open export" — navigate to that panel (and expand it)
- "how do I improve colors" (and similar) → opens the right menu,
  **highlights** the matching card, shows a **confirm dialog** ("Run
  Auto Enhance?" → Run/Cancel)
- After running: **✓ applied — [OK] [Undo]** bar; Undo reverts just that
  step
- **History mini-map** under the command bar: numbered chips of every
  executed step — tap any chip to **undo up to that step** (reverts and
  truncates after)


### v0.15.17 — AI command bar drives EVERYTHING
- Questions ("how do I blur the background") show the inline guide instead
  of executing (question-intent detection)
- Command vocabulary expanded to the full app:
  - Tools: open crop/rect/ellipse/line/text/brush/dropper/lasso/wand/marquee
  - Crop: "crop slightly smaller" (trim %), "less crop", "crop to square"
  - Zoom: "zoom in/out/fit screen"
  - More tab: pinch, twirl, emboss, find edges, solarize, median, halftone,
    tilt-shift, clone stamp, healing, red eye, bucket, gradient, curves,
    levels, polygon, triangle, star, warp
  - Export: "export png/jpg/psd…"
- Verified chain: "open crop tool, crop slightly smaller, zoom in, undo,
  less crop, crop to square" runs end-to-end; full audit 16/18 (2 filter
  checks were timing-only, verified working)


### v0.15.18 — collapsible advanced (More) groups
- More tab groups (Filters 18, Selection 4, Retouch & Paint 5, Adjustments
  2, Shapes & Tools 5) are now **collapsible cards** — collapsed by default
  so the panel stays short; tap a header to expand/collapse
- When an AI command targets a More tool/filter (pinch, clone, curves,
  warp…), it auto-opens the More tab, **auto-expands the right group**, and
  runs the tool
- Global search still reveals items across collapsed groups


### v0.15.19 — AI Assistant mode toggle (Guided / Just do it)
- **Guided** (default): commands navigate to the menu, highlight the
  target, ask "Run …?" — so you learn where each tool lives
- **⚡ Just do it**: commands execute immediately — no navigation, no
  dialogs (still pushes history + shows ✓ OK/Undo bar). Persisted.
- Vague goals work in both: "improve colors", "let me adjust the light",
  "fix red eye", "make it sharper", "smooth my skin" → right tool


### v0.15.20 — non-destructive safety + body warps + autosave
- **Safety copy**: "make a safety copy" duplicates the current image as a
  tracked layer (toggle in Layers) so the original is always recoverable
- **Layer reorder**: "move behind text" / "move to front" / "send
  backward" — reorders the image among canvas objects
- **Body warps (free, local)**: "slim the body slightly" (feathered
  horizontal squeeze) and "reduce double chin" (localized chin lift) —
  real pixel warps, undoable
- **Honest generative handling**: "take sunglasses off" / "show blue
  eyes" explain that true generative editing needs a paid model (no fake
  results), with free-workaround steps
- **Autosave**: session (image + filters + fx) saved to localStorage every
  15s + on unload; restored when reopening the project


### v0.15.21 — beauty, diagonal crop, edge refine, 40-tools plan
- **Beauty (free, local)**: whiten teeth, reduce wrinkles, remove pimples,
  glamour look (soft skin + warm + vignette), motion-blur background (car
  moving; subject kept sharp via segmentation), add sparkle (glints)
- **Diagonal crop**: cut a corner corner-to-corner (TL/TR/BL/BR, soft
  band) — via command "crop diagonal top right" or the Smart Crop modal
- **Refine Edge**: cleans untidy cutout edges after Remove Background
  (despeckle + shrink halo + feather)
- **Honest**: "add more hair" / "remove sunglasses" / "blue eyes" explain
  generative-only limits with free workarounds
- **TOOLS-40-MORE.md**: 40 researched recommendations (✅ local vs ⚠️
  needs AI/free-tier) + free daily AI-quota proposal


### v0.16.0 — Actions library, old-photo restore, intelligent region select
- **Actions tab** replaces Quick/More-filters: 42 free one-click actions from
  the techniques docs (Artistic, Portrait, Color, Vintage, Texture, Restore,
  Digital, Motion) with a Free/All toggle (AI/composite actions hidden by
  default and discardable), category chips, search
- **Old photo restore** (real, local): crease/scratch detection + inpaint +
  despeckle + faded-tone fix · "restore this old photo", "repair creases"
- **B&W → color**: honest tint presets (warm/cool/teal/violet) — labeled as
  tint, not true colorization (that needs a model, shown in All)
- **Intelligent region select**: click a region (no circles) — magic-wand +
  subject-mask union; then "enhance this region" applies enhance only inside
  the selection
- Beauty/edge/diagonal-crop from v0.15.21 included

### v0.16.1 — Recipes: save your steps as one-click custom tasks
- **Recipes tab** in the dock (pin icon): named, emoji-labeled custom tasks
  that replay a whole step sequence with one click
- **Capture from what you just did**: every action run (Actions grid, guided
  prompts, command chains) is remembered locally — tick a few in "From your
  last steps" and save them as a recipe (auto-named + auto-emoji)
- **Manual builder**: searchable step library (40+ free/local operations —
  gallery actions + one-touch steps like Auto Enhance, Crop to Square,
  Remove Background, Sharpen, B&W, Warm/Cool/Brighten) with reorder/remove
- **1-click run, 1-click undo**: Run replays steps in order; the ✓ bar's Undo
  reverts the entire recipe (snapshot before start)
- **Self-learning (local stats)**: "Most used" row surfaces your frequent
  actions with run counts; usage stats persist per device (localStorage —
  nothing leaves the browser)
- **Command bar**: "run my recipe", "run <name> recipe", "run my edit" —
  runs the latest or named recipe
- **Search dropdown**: each recipe appears as "Run recipe: <name>"
- Repaired creases action now wired from the Actions grid

### v0.16.2 — Multi-size export (one zip) · interface themes · Settings
- **Checkbox multi-size export**: every preset row now has a checkbox —
  tick the 1–2–3 sizes you need, hit **Export N sizes (.zip)**, and all of
  them render at once into one `project-<ts>.zip` (platform-named files:
  `instagram-1080x1080-name-20260811-163000.png`). Select all / Clear,
  per-platform **Check all**, and **Original size** are checkable too.
- **ZIP writer**: hand-rolled, dependency-free (STORE + CRC32) — works fully
  offline; PNG/JPG/WebP batch; GIF/MP4/PDF/PSD/SVG keep the single export
  path. The selection persists across modal opens for one-click re-exports.
- **Interface theme presets** (Settings → Interface theme): **Dark**
  (default, the monochrome studio look), **Light** (light chrome over the
  black canvas — the stage stays dark so white text objects stay visible),
  **Auto** (follows the OS, live). Stored per device in localStorage,
  applied before first paint (no flash).
- **Settings modal** (sliders icon in the top bar): theme + AI assistant
  mode (Guided vs ⚡ Just do it) in one place; everything is local.
- Light-mode polish: hover/active accents flip to dark ink, badges and
  check icons stay readable on light surfaces.
- 18-step automated audit passes (home → editor → theme → recipes →
  multi-export → mobile, no console errors).
