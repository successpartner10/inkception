# Inkception — Features & Functionality

> **Version**: v0.17.15
> **Live**: https://successpartner10.github.io/inkception/
> **Repo**: github.com/successpartner10/inkception
> **Updated**: 2026-08-12 (v0.17.15)

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
- **Self-learning**: "Most used" row (per-key counts + recency), **next-step
  prediction** ("Usually next: Sharpen · 8× after this"), and a **pattern
  nudge** when a 2–4-step chain repeats 3× ("Save as recipe?"). All stats in
  localStorage, nothing leaves the device
- **Command bar**: "run my recipe" / "run <name> recipe" / "run my edit"
- Honest limits: steps that need input (brushes, region clicks, model-only
  AI) are marked "needs input" and excluded from recipes

## 4e. Effects Gallery & tunable Enhance

- **Effects Gallery** (Actions tab → Gallery): ~40 local effects rendered as
  live thumbnails of your photo; hover/drag wipes original ↔ effect; click
  applies to the full image with an Undo bar
- **Auto Enhance settings** (Enhance modal): strength 0–100 (default 60),
  Reduce chips (−Saturation / −Warmth / −Brightness), and "Region only"
  when a region is selected

## 4d. Settings & interface themes

- **Settings** (sliders icon in the top bar): no account, no server — every
  preference is stored in your browser
- **Interface theme**: **Dark** (default, monochrome studio look) · **Light**
  (light chrome over the black canvas — the stage stays dark so white text
  stays visible) · **Auto** (follows the OS live). Applied before first
  paint, remembered per device
- **AI assistant mode**: Guided (propose → confirm → run) vs ⚡ Just do it
  (runs immediately, still undoable) — also toggleable inline in the AI tab
- **Keyboard shortcuts cheat-sheet** — undo/redo/export/open/paste/zoom,
  tool keys, Delete, Esc
- **Rename project** — click the name in the editor header
- **Privacy**: **Forget my learning** (recipes + usage stats) and
  **Clear all local data** (everything, with confirm)
- Automatic & always-on: autosave (every 15 s + on close), snapshot undo
  history, recipe + usage stats — all in localStorage
- **Paste image** (Ctrl/Cmd+V) anywhere — screenshots land straight in the
  editor or as a new project

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
16. **Collage Studio** — 2–12 photos, **13 layouts** (Grid 2/3/4, Diptych,
    Triptych, Quad, Hero+Sidekick, **Circle Inset** (white bg + circular
    frame), Horizontal, Vertical, Masonry, Overlap,
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
  fully offline — verified by automated test via `file://` with no server.
- **Private-repo safe**: the offline copy never touches GitHub, so you can
  make the repo private anytime. The deploy workflow auto-skips the Pages
  step on a private repo (no failing runs) and resumes automatically if the
  repo goes public again.
- **PWA**: `manifest.webmanifest` + icons + network-first service worker —
  the hosted site installs like an app and works offline after the first
  visit. (Not used by the standalone file, which is offline by design.)
- **8 sample photos** embedded (Portrait, City Dusk, Food Flatlay, Misty
  Pines, Sneaker, Mountain, Vase, Mono B&W) — "start with a sample" strip
  on the home screen; offline-safe data URLs in the standalone build

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

### v0.17.0 — Tunable Enhance · Effects Gallery · PWA · smarter learning
- **Auto Enhance is now tunable** (Enhance modal, opened from the AI tab or
  Adjust tab): **strength slider 0–100** (default 60 — gentle by default),
  **Reduce chips** (−Saturation / −Warmth / −Brightness keep those at their
  original values), and **"Region only"** applies the enhance inside your
  selected region at the same strength. Apply gives the ✓ Undo bar.
- **Effects Gallery** (Actions tab → **Gallery**): every local effect is
  rendered as a live thumbnail of YOUR photo (~150px, ~40 previews) —
  hover/drag to wipe between original and effect, click to apply to the
  full image (undoable). All on-device.
- **PWA — installable + offline**: `manifest.webmanifest`, app icons
  (192/512/maskable/apple-touch from the brand mark), and a network-first
  service worker → after the first visit the hosted site works offline and
  can be installed like a native app (phone/laptop). Skipped on `file://`
  (the standalone file needs no SW).
- **Smarter self-learning** (Recipes tab): **next-step prediction**
  ("Usually next: Sharpen · 8× after this — Run") from observed
  transitions, and a **pattern nudge** banner when you repeat the same
  2–4-step chain 3× ("You've repeated Sepia → Vignette 3× — save as a
  recipe?"). Stats stay in localStorage.
- **Collage templates polished**: white slots (clear at a glance), live
  photo thumbnails inside the preview slots once you pick photos, a
  "needs N more" badge and per-layout "N–M photos" hints.
- **Cleanup/QA**: fixed the mobile horizontal overflow (tool dock rows now
  wrap — 390px viewport clean), wired the **Canvas texture** Action,
  removed dead code; 22-step audit passes (incl. theme, recipes,
  multi-export, PWA, mobile) with no console errors.

### v0.17.1 — Polish round (all 10)
1. **Paste image** — Ctrl/Cmd+V imports a screenshot/copied image straight
   into the canvas (editor) or as a new project (gallery)
2. **Keyboard shortcuts cheat-sheet** — full list in Settings (⌘Z/⌘E/⌘O/⌘B/
   ⌘+/⌘0/⌘1, tool keys V/R/E/L/T/B, Delete, Esc)
3. **Rename project** — click the project name in the editor header, type,
   Enter — renames in the gallery too
4. **Privacy controls in Settings** — **Forget my learning** (clears recipes +
   usage stats + enhance prefs) and **Clear all local data** (wipes every
   Inkception key in the browser, back to a clean gallery) with confirm step
5. **Enhance settings remembered** — strength slider + Reduce chips persist
   per device, so you tune it once
6. **Dead tabs removed** — the legacy Quick/More tab surfaces are gone;
   their 25+ filters & tools (Magic Wand, Clone Stamp, Curves, Emboss,
   Twirl, Warp…) are folded into the global search, one click to run
7. **First-run hint** — one-time dismissible banner on the home screen:
   "Everything here is free & local"
8. **8 sample photos** — new Portrait, City Dusk, Food Flatlay, Misty Pines,
   Sneaker + originals, shown as a "start with a sample" strip on the home
   screen; embedded into the offline build
9. **Faster loading (code-split)** — main bundle cut from ~1.3 MB to ~716 KB;
   React/Fabric/PSD split into cached vendor chunks and the MediaPipe AI
   model now loads only when you first use segmentation. Offline standalone
   rebuilt as a single self-contained module
10. **Accessibility** — labelled search inputs, live-region toasts,
    `prefers-reduced-motion` respected, light-theme checkerboard + focus
    contrast fixes
- 26-step automated audit passes (all 10 items + full regression + offline
  standalone + on-demand AI loading, no console errors)

### v0.17.2 — 15 new Actions + smarter single-file export
- **15 new one-click Actions** (57 total, all free/local): cinematic + print
  grades — **Cyanotype**, **Teal & Orange**, **Cross Process**, **Infrared**,
  **Red Pop** (B&W except reds), **Ice Blue**, **Sunset Glow**, **Flat
  Matte**, **Noir**, **Bleach Bypass**, **Lomo**, **Pastel**, plus **Scanlines**
  (CRT), **Dither** (ordered Bayer newsprint) and **Blueprint** (white edges
  on deep blue). All wired into: Actions grid, Recipes (safe keys + one-touch
  runner), the **Effects Gallery**, and plain-English commands
  ("make it noir", "teal and orange", "cyanotype", "scanlines"…)
- **Smarter export (zip only if asked)**: checking **one** size downloads the
  file directly; checking **2+** downloads each size as its **own file**
  (e.g. "Export 2 PNG files") — a **Bundle as .zip** checkbox appears only
  for 2+ sizes and combines them into one `project-<ts>.zip` when ticked.
  Button label always matches what you get; selection persists for quick
  re-exports
- 26-step audit passes (new actions run, prompt phrases, 1-file direct
  download, 2-file individual downloads, opt-in zip, zero console errors)

### v0.17.3 — Icon set clarified
- **Export** now has its own glyph (box with up-arrow "share") — no longer
  identical to **Download** (arrow into a tray), which is used for actual
  file downloads
- **AI tab** gets a chip/processor icon (Actions keeps the sparkle) ·
  **Settings** gets a gear · **Recipes** gets a bookmark
- Distinct icons verified in the DOM (share ≠ tray ≠ up-arrow), no errors

### v0.17.4 — Collage photos auto-fill their grid slots
- Collage photos now **scale up to fill their whole grid cell** (cover) —
  no more small/letterboxed images in the grid. Overflow is cropped
  automatically, so a wide or tall photo fills a square slot edge to edge
- The per-photo **Fit** toggle in Layers still offers "contain" (photo fit
  inside the slot) when you want the smaller look
- Verified with extreme aspect ratios (16:4 wide + 4:16 tall photos both
  fill their slots, no gaps)

### v0.17.5 — Circle Inset collage (white background + circular frame)
- New **Circle Inset** collage layout: the canvas turns **white**, the main
  photo sits on it (contained, with margins — like a print on white), and a
  second photo appears in a **circular frame with a crisp white ring**
  (lower-right). One photo only? It's reused in the circle automatically.
- The circle uses a real circular clipPath + a dedicated white ring object
  (not stroke-on-clip), so it renders crisply and exports cleanly in every
  format (incl. PSD/SVG layers)
- Template preview shows the white backdrop + round slot; verified on-canvas:
  white 64% / main photo 31% / circle 4%, zero errors; standard grid collages
  still clip + gutter correctly

### v0.17.6 — Collage templates = default size + name; photos auto-fit & stay movable
- **Each template now sets its default export size + name**: picking a
  template (e.g. Circle Inset → **1080×1080**, Hero → **Facebook Cover**,
  Horizontal → **YouTube Thumbnail**) auto-selects that size in the New
  Image picker, and creating a canvas from a template renames the project
  to the template name (e.g. "Circle Inset Collage") — so the export
  filename matches the template out of the box
- **Pick first, import after**: a template can be selected before photos are
  added (it highlights with "add N more"), and imported photos auto-fit
  into its slots when you build
- **Manual manipulation**: every collage photo stays draggable/resizable on
  the canvas; the Circle Inset frame (photo + white ring) moves as one —
  drag the circle photo anywhere and the ring follows exactly (verified:
  ring position === photo center)
- 12-step audit passes (template→size auto-select, project rename, auto-fit,
  circle clip, ring-follow-drag, single-file export, standard grid, no
  console errors)

### v0.17.7 — Blank templates: no more forced collage jump
- A blank template now shows **two clear actions**: **Add Photo** (fills the
  canvas with your image, edge-to-edge — you can then move/resize it) and
  **Collage grid…** (only if you actually want a multi-photo layout). Adding
  a photo no longer throws you into the collage flow
- **Single-photo collage**: in the collage modal, one photo now works — the
  button becomes **Place Photo** and fills the canvas, instead of demanding
  "add N more to form a grid". Add 2+ and it's the normal grid builder again
- **Imported photos fill the template** (cover-fit, crop overflow) instead
  of sitting in a letterboxed box; still selectable/movable afterwards
- 16-step audit passes (template → Add Photo fills canvas with no collage
  jump, 1-photo Place Photo, 2-photo grid still clips, single-file export,
  zero console errors)

### v0.17.8 — 21 commercial/interior Actions + smart photo-type filter
- **21 new one-click Actions** (78 free / 86 total) from the commercial
  action library: **Commercial** — Luxury Grade, Catalog Look, Brand New,
  Product Sharpen, Matte Finish, Diamond Sparkle, Rich Gold, Bright Silver,
  Gemstone Vibrance, Metal Shine, Glass Gloss, Fabric Rich, Denim Pop,
  Silk Sheen, Smooth Fabric; **Restore** — Scratch Remover, Spot Clean;
  **Interior** — Room Brighten, Luxury Interior, Window Light, Floor Clean.
  All wired into the Actions grid, Recipes, Effects Gallery and
  plain-English commands ("make it look luxurious", "remove scratches",
  "clean the floor"…)
- **Smart photo-type filter (on-device)**: the Actions tab now detects what
  is in your photo (Portrait / Product / Scene / Document / General) and
  shows only the actions that apply — e.g. no bottle-rotating or floor
  actions on a face. Detection is honest & conservative: it filters only
  when confident, otherwise shows everything; a manual Auto/Portrait/
  Product/Scene/Document/All chip row lets you override
- 18-step audit passes (78 free actions render, type chips, portrait-only
  actions hidden for products, prompt phrases, gallery previews, collage,
  single-file export, zero console errors)

### v0.17.9 — 55 more Actions (141 total) + effect-strength slider
- **55 new one-click Actions** (133 free / 141 total) mapped from the
  commercial library — **Fashion** (Shoe Gloss, Shoe Luxe, Shoe Matte, Shoe
  Cleaner, Sole Brighten, Fluff Soften, Iron Outfit, Steam Press, Lint &
  Dust Off, Stain Remover, Silkier, Fabric Matte, Denim Pro, Premium
  Leather, Editorial Fashion, Bag Scratch Repair, Hardware Shine, Brand New
  Bag…), **Luxury** (Diamond Bright, Gold Luxe, Jewelry Shine, Fingerprint
  Off, Platinum Shine, De-Reflect, Watch Shine, Bracelet Polish, Fragrance
  Luxe, Bottle Clean, Liquid Rich, Packaging Sharp, Label Clarity, Beauty Ad,
  Gold Bar Real…), and **Interior/Document** (Natural Sunlight, Plan Sharp,
  Document Scan Clean). All free/local; catalog entries map to a pixel
  engine (`fx`) or an existing action (`alias`) so they run anywhere —
  grid, Recipes, Effects Gallery, prompts
- **Effect-strength slider** (Actions tab, "Effect strength" 0–100, default
  60): one-click actions now apply at your chosen strength and remember it
- ~30 new command phrases: "make the gold bar shine", "clean the soles",
  "iron my shirt", "remove fingerprints", "sharpen the floor plan"…
- 19-step audit passes (133 render, slider 0–100, fx + alias runners, new
  prompts, gallery previews, recipes, collage, single-file export, zero
  console errors)

### v0.17.10 — 31 more Actions (172 total, 164 free) — eyewear, electronics, food, auto, real estate, art
- **Eyewear** — Glasses Clean, Lens Shine, Frame Polish
- **Electronics** — Screen Clean, Device Shine, Device Brand New, Tech Sharp, Tech Ad Look
- **Food & Beverage** — Food Appetize, Food Vibrant, Plate Clean, Drink Rich, Beverage Ad, Condensation Pop
- **Home** (candles/soap/bath) — Candle Clean, Soap Pro, Bath Luxe, Home Ad Look
- **Auto** — Car Paint Shine, Interior Luxe, Detail Sharp, Showroom New, Car Ad Look
- **Real Estate** — Sky Pop, Exterior Bright, Listing Luxe, Listing Sharp
- **Artwork** — Poster Clean, Art Vibrant, Canvas Bright, Frame Shine
- New local engines: Car Shine, Food Appetize, Sky Pop, Screen Clean, Poster Clean
- ~18 new command phrases ("make the sky richer", "clean my glasses",
  "make the car paint shine", "appetizing food"…)
- 14-step audit passes (164 render, new engines run, prompts, gallery
  previews, zero console errors)

### v0.17.11 — 33 more Actions (205 total, 197 free) — apparel, travel, accessories, beauty, docs
- **Apparel** — Crisp Shirt, Pressed Suit, Jacket Rich, Tie Shine, Scarf
  Soft, Hat Fresh, Sportswear Pro, Swimwear Vibrant, Knit Soft, Sock Crisp,
  Pattern Pop, Outfit Editorial
- **Travel** — Luggage Scratch Repair, Luggage Clean, Luggage Leather,
  Backpack Pro, Luggage Brand New
- **Accessories** — Belt Leather, Buckle Shine, Wallet Rich, Wallet Clean
- **Beauty** — Makeup Look, Lip Color Pop, Skincare Bottle Clear, Serum
  Gloss, Cream Jar Clean, Beauty Product Pro
- **Docs & Editorial** — Drawing Clean, Receipt Clear, Invoice Bright,
  Magazine Cover, Editorial Grade; **Auto** — Motorcycle Shine
- New local engines: Makeup Pop (soft glam + color), Pattern Pop (vivid
  printed fabric)
- ~20 new command phrases ("make the shirt crisp", "clean my luggage",
  "makeup look", "magazine cover", "motorcycle shine"…)
- 15-step audit passes (197 render, new engines run, prompts, gallery
  previews, zero console errors)

### v0.17.12 — Relevance, ranking & taxonomy-powered smart search
- **B — relevance made structural**: actions are now tagged so portrait-only
  (face/body) actions can *never* leak onto a building/product/document —
  no "show everything" fallback. Fixed mis-tags (Motion Blur BG is a car/
  action shot, not portrait-only)
- **D — rank, don't hide**: the Actions tab now shows **"Best for this
  photo"** (applicable actions) with a live count ("Showing N actions for
  Product · M hidden") and a one-tap **Show all** toggle. Nothing is
  silently hidden anymore — the app says exactly why
- **Smart search (as-you-type)**: a new search box inside the Actions tab
  — "thinner" → Slim Body, "make the gold look richer" → Rich Gold, "clean
  the floor" → Floor Clean. Results are **ranked by match score** and show
  a match badge
- **Taxonomy vocabulary** (from the shopping-image taxonomy doc): a
  material / surface / condition / action dictionary so you can search by
  what the thing is made of or its state — "steel" → Metal Shine,
  "marble" → Luxury Grade, "rust" → Scratch Remover, "wrinkled" → Iron
  Outfit, "recolor" → More Color, plus compound queries like "make the
  leather seats darker and more luxurious". One-touch extras (Remove
  Background, Sharpen, B&W…) are searchable too
- 28-step audit passes (relevance, Show-all, synonym + taxonomy searches,
  phrase ranking, compound queries, zero console errors)

### v0.17.13 — 100 curated auto-generated actions (297 total)
- **Generated from the taxonomy vocabulary**: a curated matrix (material ×
  action-family) reuses the existing local engines with product-specific
  names & descriptions — e.g. **Silver Tarnish Lift** (brighten oxidized
  silver), **Wood Polish** (deepen grain), **Suede Refresh** (lift the
  nap), **Ceramic Glaze**, **Denim Wear Repair**, **Marble Luxe**,
  **Chrome Gleam**, **Leather Seat Luxe**, **Paper Clean**, **Coffee Rich**,
  **Polarized Glare Cut** and ~90 more across metals, stone, glass, wood,
  fabric, objects, food and documents
- **Zero new pixel code** — every generated action maps to an existing
  engine (fx) so it runs in the grid, Recipes, Effects Gallery (previews
  resolved by engine name), prompts and search
- **`auto` badge + toggle**: generated actions are tagged and shown with a
  small "auto" label; a **Auto (100)** chip hides/shows them so the curated
  set stays clean. Smart filter + relevance still apply to them
- 11-step audit passes (generated run via fx, search finds them, gallery
  previews, hide-auto hides generated but keeps curated, zero console
  errors)

### v0.17.14 — 61 more generated actions (358 total) + engine wiring fix
- **61 more curated auto-generated actions** from the remaining taxonomy
  categories: Cameras & Photography, Audio & Hi-Fi (Speaker Fabric Fresh,
  Vinyl Record Clean, Headphone Pad Restore, Amp Metal Shine), Gaming
  (Console Clean, Keycap Crisp, Bezel Clean), Fitness (Dumbbell Steel,
  Barbell Chrome, Kettlebell Clean, Club Steel), Outdoor & Camping (Tent
  Fabric Fresh, Sleeping Bag Fluff, Hiking Boot Clean), Pets (Collar
  Leather, Pet Bowl Clean, Pet Bed Fluff), Tools & Hardware (Drill Clean,
  Wrench Steel, Saw Blade Shine), Lighting (Chandelier Crystal, Lamp Metal
  Shine, Warm Glow), Garden & Plants (Leaf Dew Pop, Flower Vivid, Garden
  Green Pop), Seasonal & Gifts (Ornament Shine, Ribbon Silk, Foil Shine),
  Instruments (Guitar Polish, Piano Lacquer, Cymbal Shine), Marine (Hull
  Clean, Teak Polish), Cycling, Golf & Ski, and Packaging (Box Clean, Tube
  Clean, Bottle Cap Metal)
- **Engine wiring fix**: generated actions using `Diamond Bright` and
  `Glamour` engines now run correctly (were missing from the runner map) —
  Crystal Sparkle and Velvet Luxe verified
- All 161 auto actions carry the `auto` badge + hide/show toggle, smart
  filter applies, and search finds them ("guitar polish", "kettlebell",
  "chandelier", "vinyl"…)
- 11-step audit passes (358 render, 161 auto, batch-2 search + run, gallery
  previews, engine fixes, zero console errors)

### v0.17.15 — Prominent action search
- The Actions-tab search is now the **hero of the panel**: a tall, bordered
  box with a bold white search icon, a bright focus glow, a clear
  placeholder ("Find an action — thinner, make it shine, steel…") and
  one-click **example chips** (thinner · make it shine · steel · clean the
  floor · silver tarnish) that fill the query for you
- **`/` keyboard shortcut** focuses the search from anywhere; **Esc** clears
  and blurs it
- 8-step audit passes (prominent styling, chips fill + search, / shortcut
  focus, typed search works, zero console errors)
