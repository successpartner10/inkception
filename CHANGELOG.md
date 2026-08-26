# Changelog

## 0.21.2 — AI assistant mode removed

- Removed the AI Assistant strip from the Effects panel (Guided/Just-do-it toggle, "describe the edit" command bar, suggestion chips, smart-suggestion banner, inline how-to results) — the panel now leads directly with AI Create cards + the effects gallery
- Removed the "AI assistant mode" block from Settings (AI keys, theme, text size and tips remain)

## 0.21.1 — Bugfix round (user reports)

- **Layer eye now works on the main photo** — the "Subject" row toggled state but never touched the canvas; it now hides/shows the real base image
- **Revert to original is now a TRUE full revert** — removes every layer added since the original (photo layers, AI layers, frames), restores the base photo, clears the visual version list — and Undo still works
- **Guides removed from search results entirely** — no more "How do I…?" zone creating a gap between tools; guides live only in the Help tab

## 0.21.0 — Compare v2 (the honest before/after)

The old Compare showed "current image minus filters" as the "original" — after any real edit both sides looked the same, so it seemed broken. Replaced:

- **A-side = the TRUE original file** (from history baseline), B-side = the live canvas — including layers, text and FX (flattened visual captures, up to 15 versions)
- **◀ ▶ steppers + dropdowns on both sides** — compare any two versions (v1 vs v3, etc.)
- **Side-by-side mode** alongside the drag slider
- **One-click "Revert to original"** (layers you added stay; still undoable via History)
- Visual versions are captured automatically: photo opens, edits, photo layers, Extract Layers, framed photos

## 0.20.2 — Effects tile readability

- Effect tile labels: solid dark-grey strip (rgb(32,32,32) @ 95%) + white extrabold text + brighter category tag — readable over any photo, replacing the soft gradient that washed out on bright images.

## 0.20.1 — Desktop anatomy: tool rail + options bar + status strip

- **Left tool rail** (desktop): 15 Photoshop-style icon tools with hover labels + shortcuts — Select/shapes/Text/Brush/Dropper/Crop | Erase/Blur/AI Remove/Clone/Heal/Bucket | Compare. Hidden on mobile (classic dock stays).
- **Contextual options bar** (under the tabs): shows ONLY the active tool's options — pixel tools + size slider while painting; Frame controls (Face/Fill/Fit/−/＋/Release) when a framed photo is selected; font family + size for text. The floating bars are gone.
- **Status strip** (desktop bottom): zoom −/%/+/Fit, canvas dimensions, "Auto-saved ✓", Add Photo — no tools. The 18-chip dock is retired on desktop.

## 0.20.0 — Consolidation: 4 workspace tabs + Effects gallery

**One command spine (desktop)**
- Top sections are now 4 beginner-word workspaces: **Photo · Compose · Effects · Export** (+ Help). "Fix & AI"/"Edit"/"Layers" duplicates removed.
- Right panel: 5 tabs with **Effects first** — the AI panel MERGED into it (AI Create row on top, gallery below).
- Bottom dock deduplicated: AI / Layers / Pixel Studio / Import chips removed (they were 2nd/3rd doors to the same places). Tools + zoom + Add Photo remain.
- Fast-path 1-2-3 ribbon deleted (superseded by the clear tabs).

**Effects gallery (in-panel)**
- Search INSIDE the panel ("gold", "clean", "luxury"...) + category chips
- LIVE thumbnails of YOUR photo streaming in (cached per image)
- **Numbered pagination: 12 per page with ‹ 1 2 3 … › nav** — no endless scrolling
- Effect strength slider under the grid

**Help**
- New Help tab: searchable guide center (29 plain-English guides); guides REMOVED from the search dropdown (tools only there)

**Fixes**
- Effects panel thumbnails: state updates were being discarded (ref cleared before React ran the updater) — batch is now captured before scheduling

## 0.19.4 - Pro-lane model fix

- Describe (image-to-prompt, your-key fallback) now uses gemini-3.5-flash-lite first - Google retired gemini-2.0-flash-lite (the API now returns 'no longer available'). Fallback chain: 3.5-flash-lite, flash-lite-latest, 2.5-flash-lite.

## 0.19.2 — Workflow fixes (user feedback round)

- **Template section no longer opens Collage** — it has its own "Templates & sizes" modal that resizes the current canvas (photos & layers are kept). Collage is its own section.
- **History panel** (header clock button): every change is a labeled snapshot — list, jump back to any step, Undo/Redo, and Save (explicit feedback + thumbnail sync).
- **Multi-image documents**: Open/Add Photo now accepts multiple files — the first becomes the base image, the rest become separate movable layers (also via multi-file drag & drop). New dock chip "Add Photo".
- **PSD export fixed & rewritten** — the previous ag-psd encoder hung forever in the browser (bug present since v0.17). Replaced with a self-contained layered PSD writer (real alpha channels, blend modes, layer names, flattened preview). Bundle is ~295 KB lighter.
- **Bottom-bar clutter**: the 1-2-3 guide strip auto-hides as soon as a photo is open.

## 0.19.0 — Novice-first UX · Live FX · AI lanes

**Beginner-first experience**
- First-visit Welcome dialog: 3 one-click doors (Fix a photo · Make a banner · Try the AI magic), reopenable via ⓘ
- Beginner tips system (plain-English "What is this?" in every AI dialog + Motion panel), on by default, Settings toggle
- Fast-path 1-2-3 strip in the editor (Open → Section → Export), dismissible
- AI tab reorganized: "AI Create" group leads; heavy tools stay grouped below

**Live FX (free, on-device)**
- New particle engine (`src/lib/livex.js`): Fireworks · Sparkles · Confetti · Rain · Snow · Fireflies · Light Leak
- Live overlay canvas with Amount/Speed sliders; deterministic (export matches preview)
- GIF/MP4 exports composite the FX; PNG/JPG composite a representative frame

**2.5D Depth motion (free)**
- Motion mode `depth`: person layer drifts over the background; auto-runs Extract Layers when needed; renders into GIF/MP4 via `renderMotionFrames`

**AI lanes**
- `functions/api/[[path]].js` — free-lane Pages Function on Workers AI (describe / copy / generate), rate-limited, with model fallbacks
- Pro lane in `src/lib/ailane.js`: direct browser→Google calls with the user's own key — Describe (Flash-Lite), images (Nano Banana class), video (Veo 3.1 Fast→Standard→3.0 fallback, polled, MP4 download)
- One-time consent gate before the first cloud call; reset in Settings
- Describe Image · Generate Image (result → movable layer) · AI Headlines & CTA (→ editable text layers, offline fallback bank) · Animate modal with upfront pricing
- Settings: AI keys section with live lane status; prices shown before any paid action

**Fixes**
- pxengine: `posterize`, `glowingEdges`, `sharpenMore` were imported but not exported — actions "Posterize", "Neon Glow" and "Product Sharpen" crashed at runtime; now implemented as real functions
- Docs: DOCUMENTATION.md (complete guide), this CHANGELOG.md, README AI-lanes section, wrangler.toml

## 0.18.0 — Big & obvious

- **Website-style section menus** replace the tucked-away "What do you want to do today?" dropdown (Gallery: Edit · Fix & AI · Collage · Templates · Export · Restore; Editor adds Pixel Studio + Layers). "Edit" always lands with Layers visible.
- **Typography overhaul**: type scale up ~2–4px at every step, bolder weights (base 500), bigger labels/buttons/tabs — all rem-based; Settings → Interface text size (Comfort/Normal/Large) scales the whole app.
- **Extract Layers v2 (real AI)**: MediaPipe person segmentation + BlazeFace face detection + OCR text boxes → Face layer, Person layer, one layer per text block (named with the recognized text), and a clean Background with holes diffusion-filled. All layers movable & scalable; PSD export keeps names.
- **Pixel Studio**: always-visible Photoshop-style toolset (Brush · Erase · Blur · AI Remove · Clone · Heal · Bucket + size slider) via section menu, header button, dock chip, and search ("photoshop").
- **Face frames**: templates get "Add Face / Photo" → adjustable frame with auto face-centering; drag to pan, handles to zoom; bar: Face · Fill · Fit · − ＋ · Release; clamped so the frame always stays filled.
- New self-hosted MediaPipe FaceDetection assets in `public/mediapipe/`; tesseract.js dependency (lazy).

## 0.17.32 — baseline

- 358 actions, recipes/self-learning, collage studio, vectorize, multi-size ZIP export, PSD/PDF/SVG/GIF/MP4, themes, PWA, MediaPipe selfie segmentation, goal menu, editor search.
