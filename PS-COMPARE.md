# Inkception vs Photoshop / Photopea / Pixlr — Comparison & Recommendations

> Baseline: Inkception v0.15.8 · Legend: ✅ have · 🔶 buildable client-side ·
> 🧠 needs model/API · ➖ skip
> Sources: `photoshop_tools_filters_features.md`, `photopea_pixlr_tools_filters_2026.md`

---

## Headline comparison

| Capability area | Photoshop | Photopea | Pixlr | Inkception now | Verdict |
|---|---|---|---|---|---|
| Layers + blend modes + opacity | ✅ full | ✅ full | ✅ (E) | ✅ (12 modes, opacity, dup/del/lock) | **Parity on basics** |
| Layered PSD export | ✅ | ✅ | PXD/PSD | ✅ layered via ag-psd | **Parity** |
| Selection tools (marquee/lasso/wand) | ✅ | ✅ | ✅ | 🔶 engine started, not shipped | **Add now** |
| Crop / smart crop / perspective crop | ✅ | ✅ | ✅ | ✅ manual + smart | ✅ |
| Retouch (heal/clone/patch/red-eye) | ✅ | ✅ | ✅ | 🔶 inpaint/eraser/blur only | **Add clone+heal+red-eye** |
| Filters (distort/stylize/render) | ✅ | ✅ | ✅ | 🔶 pixel engine written | **Add menu + wire** |
| Curves / Levels | ✅ | ✅ | ✅ | 🔶 | **Add** |
| Generative AI | ✅ Firefly | limited | ✅ strong | ✅ paint-inpaint / remove bg | **Needs API for true gen** |
| 3D / Camera Raw / Vanishing Point | ✅ | RAW | – | ➖ | Skip |
| Offline standalone | – | caveated | – | ✅ single file | **Advantage** |

---

## What to add — recommendations (prioritized)

### Tier 1 — Ship now (high value, fully client-side, engine already written)
| # | Feature | Source | Effort | Notes |
|---|---|---|---|---|
| 1 | **Menu bar** (File/Edit/Image/Layer/Filter/View) | both | M | Hosts Filter menu + actions; matches PS/Photopea |
| 2 | **Filter menu** — Distort (Pinch/Twirl/Ripple/ZigZag/Glass/Spherical), Render (Clouds/Diff Clouds/Fibers), Stylize (Emboss/Find Edges/Glowing/Solarize), Sketch (Graphic Pen/Halftone), Sharpen More/Edges, Median, Add Noise, Film Grain, Tilt-shift | both | M | pxengine.js already implements all of these |
| 3 | **Selection tools** — Marquee rect/ellipse, Lasso, Magic Wand, feather/invert/contract/expand, fill/delete/copy-in-selection, marching-ants overlay | both | L | Unlocks ~8 other tools |
| 4 | **Curves + Levels** — histogram + point curve → LUT, non-destructive via sliders | both | M | Reuse palette/grade math |
| 5 | **Clone Stamp** (alt-click sample → paint), **Healing brush** (sample+blend), **Red Eye**, **Paint Bucket** (flood fill), **Gradient fill** | Photopea/Pixlr | M | Straightforward on pxengine |

### Tier 2 — Next (still client-side)
| # | Feature | Source | Effort | Notes |
|---|---|---|---|---|
| 6 | **Shapes** — Polygon, Star, Triangle, Custom; gradient/stroke fills | both | S–M | Fabric objects |
| 7 | **Layer styles** — Drop Shadow, Stroke, Glow (fabric shadow + composite) | PS | M | High "pro" feel |
| 8 | **Pen tool + anchor editing** | Photopea | L | Fabric Path; click-to-add points |
| 9 | **Dodge/Burn, Smudge, Sharpen brush** | PS/Photopea | M | Brush ops on working buffer |
| 10 | **Flyout tool groups** (long-press select → lasso/wand; eraser → magic/background; brush → clone/heal) | PS | S | Discoverability |
| 11 | **Warp / perspective transform** | PS/Pixlr | M | 4-corner + mesh remap (pxengine has remap) |

### Tier 3 — AI (needs model/API; UI + endpoint hook today)
| Feature | Source | Notes |
|---|---|---|
| True Generative Fill / Expand (objects you can't see) | Pixlr/Firefly | We have paint-inpaint now; wire a provider |
| Generate Image / Backdrop / Face Swap / Avatar | Pixlr | Prompt UI + API key |
| Super Scale / Super Sharp / Remove Noise (AI) | Pixlr | Upscale/denoise ✅ exist as filters |

### Skip (not meaningful in a browser editor)
3D, Camera Raw, Vanishing Point, real-time collab, CMYK print, Slice, Actions
recorder (partial: we have history/undo).

---

## What Inkception already does that the others DON'T (keep as differentiators)
- **Truly offline single-file** (fonts + AI model bundled)
- **Global search filters every menu/tool/preset** (type "darken"/"whatsapp")
- **27 platform export presets** (Instagram/Facebook/WhatsApp/YouTube…)
- **Self-hosted on-device AI** (MediaPipe matting, no account)
- **8 export formats incl. layered PSD, animated GIF/MP4, PDF, SVG**

---

## Recommended build order (this session, if you say go)
1. Menu bar + Filter menu (wire the already-written pxengine)
2. Selection engine (marquee/lasso/wand + ops)
3. Clone stamp / healing / red-eye / paint bucket / gradient
4. Curves + Levels
5. Shapes (polygon/star/triangle) + flyout tool groups
6. Layer styles (shadow/stroke/glow)

All Tier 1–2 is free, client-side, and can ship incrementally. AI Tier 3 needs
an API key when you want true generation.
