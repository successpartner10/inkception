# Inkception → Photoshop Parity: Implementation Roadmap

> Version: 0.15.7 baseline · Legend: ✅ have · 🔶 feasible client-side (in-browser,
> no server) · 🧠 needs external model/API key · ➖ not applicable/skip

---

## 0. What Inkception already has (v0.15.7)

✅ Move/Select (V) with PS-style deselect · Manual Crop (C) · Smart Crop ·
Zoom (Z) with presets (25–800%, Fit/Fill, ⌘0/⌘1/⌘±) · Hand/Pan · Eyedropper (I) ·
Brush (B) + color swatch · Text (T) with font picker (15 fonts), bold/italic,
size, color, letter-spacing, line-height, 4 alignments · Rect/Ellipse/Line
shapes · Erase-to-transparent brush · Magic Eraser (AI inpaint) · Blur brush ·
Select Subject / Remove Background (MediaPipe) · Replace Background ·
Generative Fill (paint+inpaint) · Upscale 2×/4×/8× · Vectorize (raster→SVG) ·
Decompose to layers · Retouch (skin-aware) · Denoise · Color Grade / LUT ·
Color Palette · Auto Enhance · Motion · Batch AI · Collage Studio · Quick
Actions (20) · Adjustment sliders (6) · Layers (opacity, 12 blend modes,
duplicate, delete, lock) · Flip/Rotate · Free transform (move/scale via
handles) · Undo/Redo · Export 8 formats (PNG/JPG/WebP/GIF/MP4/PDF/layered
PSD/SVG) × 27 presets · Global search · Offline standalone.

---

## 1. Feasibility legend & honest limits

| Feasibility | Meaning |
|---|---|
| 🔶 **Buildable now** | Pure pixel/path math in the browser. Real work, no server. |
| 🧠 **Needs model/API** | Generative AI that genuinely requires weights/GPU/API key (Firefly, SD, neural filters). We can build the UI + endpoint hook today. |
| ➖ **Skip / N/A** | Not meaningful for a browser editor (3D, Camera Raw, Print CMYK, real-time collab without backend). |

**Performance reality:** anything "real-time" (liquify, smudge, live neural)
must run on a downscaled working buffer and re-render at full res on release —
the same trick pro editors use.

---

## 2. Tool-by-tool plan

### Selection tools → build a Selection Engine first
Everything below needs a shared **selection overlay** (marching-ants canvas,
feather, invert, contract/expand) and operations (fill, delete, copy, move,
apply-to-layer).

| Tool | Feas. | Plan |
|---|---|---|
| Marquee Rect / Ellipse | 🔶 | Drag-select on a selection canvas (we already have crop-overlay code to reuse) |
| Single Row/Column Marquee | 🔶 | 1px bands from the same engine |
| Lasso / Polygonal Lasso | 🔶 | Freehand pointer path → closed polygon |
| Magnetic Lasso | 🔶 | Edge-cost walk on luminance gradient (doable, ~150 lines) |
| Magic Wand | 🔶 | Flood fill on color distance from seed (tolerance slider) |
| Quick Selection | 🔶 | Region-grow with brush strokes |
| Object Selection | 🔶 | Use our segmentation mask (already have MediaPipe) as a click-based select |
| Select Subject | ✅ | Already have (Remove Background's mask) |
| Content-Aware Select | 🧠 | Needs model (or approximation via edge+segment) |

### Crop & slice
| Tool | Feas. | Plan |
|---|---|---|
| Crop | ✅ | Have (manual) |
| Perspective Crop | 🔶 | 4-corner handles → homography warp to rectangle |
| Slice / Slice Select | ➖ | Legacy web feature; skip |
| Frame | 🔶 | Bounding container that crops a nested image (easy with fabric clipPath) |

### Navigation & sampling
| Tool | Feas. | Plan |
|---|---|---|
| Hand (H) | ✅ | Drag-empty pans |
| Rotate View | 🔶 | Fabric `viewportTransform` rotation (medium) |
| Zoom | ✅ | Presets + shortcuts |
| Eyedropper | ✅ | Have |
| Color Sampler (multi-point) | 🔶 | Persistent pip points that re-read pixels |
| Ruler | 🔶 | Measure line with px distance readout |
| Note / Count | 🔶 | Fabric text/annotation objects |

### Retouching & repair
| Tool | Feas. | Plan |
|---|---|---|
| Spot Healing | 🔶 | Brush = sample surrounding patch + blend (extend our inpaint) |
| Remove (AI) | ✅ | Have (Magic Eraser via inpaint) |
| Healing Brush | 🔶 | Sample point + paint with alpha blend |
| Patch | 🔶 | Lasso source region → drag onto target (copy + blend) |
| Content-Aware Move | 🧠 | Needs real inpainting model for best results (UI + hook now) |
| Red Eye | 🔶 | Detect reddish pixels in a drawn region → desaturate |

### Painting
| Tool | Feas. | Plan |
|---|---|---|
| Brush / Pencil | ✅ | Have (+ size/opacity/hardness control) |
| Color Replacement | 🔶 | Brush that hue-shifts to target color within tolerance |
| Mixer Brush | 🧠/🔶 | Smear-blend simulation (medium) |
| Clone Stamp | 🔶 | Alt-click sample point → paint copied pixels (straightforward) |
| Pattern Stamp | 🔶 | Tile a loaded pattern |
| History Brush | 🔶 | Paint back from the snapshot stack |
| Adjustment Brush | 🔶 | Paint a mask that gates an adjustment (uses our filters) |

### Editing & drawing
| Tool | Feas. | Plan |
|---|---|---|
| Eraser / Background Eraser / Magic Eraser | ✅ | Have all three |
| Gradient Tool | 🔶 | Linear/radial gradient fills on shapes + gradient fill on selection |
| Paint Bucket | 🔶 | Flood fill with tolerance |
| Blur / Sharpen / Smudge brushes | 🔶 | Blur ✅ have · Sharpen brush = convolve under stroke · Smudge = push-pixels |

### Vector & shape
| Tool | Feas. | Plan |
|---|---|---|
| Pen / Freeform Pen / Curvature Pen | 🔶 | Fabric `Path`; click-to-add points, drag handles (medium-large) |
| Anchor editing (A) | 🔶 | Path point selection/move (medium) |
| Content-Aware Tracing | 🧠 | Our vectorize is the basis — good enough as "trace" |
| Type (T) + Type Mask | ✅/🔶 | Text ✅ · type-mask = text → selection |
| Shapes (Rect, Rounded, Ellipse, Polygon, Line, Triangle, Custom) | 🔶 | Add Polygon/Star/Custom via fabric |

---

## 3. Filters — how to implement (a Filter Engine)

We already apply filters through Fabric's filter chain. The plan:

1. **Standardize a pixel-pipeline**: `applyFilter(dataUrl, fn)` — draw to
   offscreen canvas, run per-pixel/convolve/remap, return new dataURL. One
   function powers every filter below.
2. **Add these filter groups under a new "Filter" menu:**

| Group | Feas. | Examples & method |
|---|---|---|
| Distort | 🔶 | Pinch, Twirl, Ripple, ZigZag, Glass = **pixel remap** (nearest/bilinear sample from displaced coords) |
| Render | 🔶 | Clouds (value-noise), Difference Clouds, Fibers, Lens Flare (radial gradient compositing) |
| Stylize | 🔶 | Emboss (convolve), Find Edges (Sobel → threshold), Solarize (curve), Glowing Edges (invert find-edges), Diffuse |
| Pixelate | 🔶 | Mosaic ✅, Crystallize (Voronoi), Pointillize, Halftone (dot grids) |
| Noise | 🔶 | Add Noise ✅, Median ✅, Dust & Scratches (median+threshold) |
| Sharpen | 🔶 | Sharpen ✅, Sharpen Edges, Smart Sharpen (unsharp mask) |
| Sketch | 🔶 | Graphic Pen, Chalk & Charcoal, Halftone — edge+dither compositing |
| Artistic | 🔶 | Posterize ✅, Film Grain (noise+contrast), Cutout (quantize) |
| Blur gallery | 🔶 | Tilt-shift (radial/linear gradient blur mask), Motion Blur ✅, Radial Blur, Zoom Blur |
| Liquify | 🧠/🔶 | Real-time mesh warp on a downscaled buffer; heavy but buildable |
| Camera Raw / Adaptive Wide Angle | ➖ | Skip |

**Recommendation:** implement Distort + Render + Stylize + Sketch first — the
pixel-remap engine gives ~15 filters for ~400 lines.

---

## 4. Generative AI (Firefly-style) — honest plan

| Feature | Feas. | Plan |
|---|---|---|
| Generative Fill | ✅/🧠 | We have paint+diffusion inpaint now; **to be truly generative** (objects you can't see) needs a model API. Build the UI already done; add endpoint setting. |
| Generative Expand | 🔶/🧠 | Extend canvas + inpaint the new band (we can do the extension + diffusion today) |
| Generate Image / Background | 🧠 | Needs API key (Stable Diffusion / Firefly / Gemini). Build prompt UI + pluggable provider. |
| Remove Tool (distractions) | 🧠 | Needs model for "find people/objects" |
| Neural Filters (color transfer, landscape mixer, sky replacement) | 🧠/🔶 | Color transfer ✅ (LUT) · Sky replacement 🔶 (segment sky + composite) · others need models |
| Style Transfer | 🧠 | Needs model; presets (vintage/B&W/etc.) ✅ |
| Super Zoom | ✅ | Upscale 2/4/8× |

---

## 5. Adjustment layers & layer styles

| Feature | Feas. | Plan |
|---|---|---|
| Adjustment layers (non-destructive) | 🔶 | Big but doable: render each adjustment as an overlay object that gates the image below. Start with one "Adjustment" object type (brightness/contrast/saturation/curves-ish). |
| Levels / Curves | 🔶 | Histogram UI + point-curve → LUT (we have histogram math in palette/grade). High value. |
| Vibrance / Hue-Sat / Color Balance / Selective Color | 🔶 | All are channel math filters — easy once the engine exists |
| Gradient Map / Threshold / Posterize | 🔶 | Channel math |
| Layer Styles (shadow, glow, bevel, stroke) | 🔶 | Fabric has `shadow`; add stroke/glow/bevel via composite ops |

---

## 6. Menus & organization (the "hidden tools" question)

Photoshop hides tools in **flyouts** on the toolbar (click-and-hold). Plan:

1. **Tool dock flyouts** — long-press/right-click on Select → Marquee/Lasso/
   Wand; on Crop → Perspective Crop/Frame; on Eraser → Background/Magic
   Eraser; on Brush → Pencil/Clone/Healing/etc.
2. **Add a real menu bar** (File / Edit / Image / Layer / Filter / View /
   Help) in the top bar — Photoshop-style, with the Filter menu hosting the
   new filter groups and generative actions. Right panel stays for
   Adjust/Quick/AI/Layers/Text.
3. Keep the global search filtering all of the above (it already does).

---

## 7. Prioritized roadmap (recommended order)

**Phase 1 — Selection Engine (unlocks most tools):**
Marquee (rect/ellipse), Lasso, Magic Wand, selection overlay + feather/
invert/contract, Fill/Delete/Copy within selection.

**Phase 2 — Painting/retouch:**
Clone Stamp, Healing Brush, Paint Bucket, Gradient tool, Red Eye, Smudge,
sharpen brush, brush size/opacity/hardness.

**Phase 3 — Filter Engine:**
Distort (Pinch/Twirl/Ripple/ZigZag/Glass), Render (Clouds/Fibers/Lens Flare),
Stylize (Emboss/Find Edges/Solarize), Sketch (Graphic Pen/Halftone),
Sharpen More/Smart, Median, Film Grain, Tilt-shift blur.

**Phase 4 — Shapes & paths:**
Polygon/Star/Triangle/Custom shapes, Pen tool + anchor editing, gradient fills,
layer styles (shadow/stroke/glow).

**Phase 5 — Adjustments & AI:**
Curves/Levels UI, adjustment layers, Generative Expand, provider hook for
Generate Image / true Generative Fill (API key settings).

**Deferred / skip:** 3D, Camera Raw, Vanishing Point, real-time collab,
print CMYK, Slice.

---

## 8. What I'd recommend building first (highest value / effort)

1. **Selection engine + Marquee/Lasso/Magic Wand** — makes ~8 other tools
   possible and feels the most "Photoshop."
2. **Menu bar + Filter menu** with the pixel-pipeline engine (Distort/Render/
   Stylize) — biggest visible feature jump.
3. **Clone Stamp + Healing + Paint Bucket + Gradient** — the retouch set.
4. **Flyout tool groups** so everything is discoverable without clutter.

*Every item marked 🔶 is fully client-side and can be shipped incrementally;
nothing here requires you to buy anything.*
