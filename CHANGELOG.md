# Changelog

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
