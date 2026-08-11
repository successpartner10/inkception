# 40 More Useful Tools — Recommendations (researched)

Honest feasibility for a free, browser-only editor: ✅ buildable local · ⚠️ needs
external AI (free-tier limits) · ➖ skip/not meaningful.

## Photo / Portrait (10)
1. **Teeth whitening** ✅ (built) · 2. **Wrinkle reduction** ✅ (built) ·
3. **Pimple removal** ✅ (built) · 4. **Glamour look** ✅ (built) ·
5. **Eye brighten** ✅ (local: dodge iris) · 6. **Lips color** ✅ (hue map) ·
7. **Skin tan / bronze** ✅ (color matrix) · 8. **Hair color swap** ✅ (hue map) ·
9. **Bokeh (background blur)** ✅ (mask + blur) · 10. **Vignette** ✅ (built)

## Repair / Recovery (8)
11. **Upscale faces** ⚠️ (needs super-res model, free tier) ·
12. **Old photo restore** ⚠️ (scratch detect + inpaint — free tier) ·
13. **Colorize B&W** ⚠️ (needs model; free tier) · 14. **Fix tilt** ✅ (rotate) ·
15. **Straighten horizon** ✅ (auto-line detect) · 16. **Perspective fix** ✅
(homography) · 17. **Dehaze / remove fog** ✅ (local contrast) ·
18. **Sharpen motion blur** ⚠️ (deconv — heavy, partial)

## Creative (8)
19. **Pop art / duotone** ✅ (colorize) · 20. **Double exposure** ✅ (blend) ·
21. **Sketch / pencil** ✅ (built-ish) · 22. **Watercolor** ⚠️ (approx) ·
23. **Glitch / scanlines** ✅ (built) · 24. **Mirror / kaleidoscope** ✅ (remap) ·
25. **Text overlay presets** ✅ · 26. **Photo collage auto-fill** ✅ (built)

## Selection / Mask (6)
27. **Feather selection** ✅ (built) · 28. **Contract/expand selection** ✅
(built) · 29. **Magic eraser refine** ✅ (built) · 30. **Select hair** ⚠️
(needs matting model, free tier) · 31. **Quick select (click)** ✅ ·
32. **Chroma key (green screen)** ✅ (color-range key)

## Web / Social (6)
33. **Batch watermark** ✅ (composite) · 34. **Round/circle crop** ✅ ·
35. **Blur face in group** ⚠️ (needs face detect — free tier) ·
36. **Smart resize (keep subject)** ⚠️ (seam carving / model) ·
37. **Background generator** ⚠️ (needs gen model, free tier) ·
38. **Animated sticker** ✅ (GIF built)

## Automation (4)
39. **Actions recorder** ✅ (record tool steps → replay) ·
40. **Batch rename/size** ✅ (built batch)

## Free daily AI limits — proposal
For the ⚠️ items that truly need an external model, add an optional
**"AI Cloud" mode** with a daily free quota (e.g. 5/day) gated by a simple
counter in localStorage, with a clear "0 left today — use local tools" state.
No API key required; results are best-effort from a free endpoint when one is
available, else the tool explains honestly why it can't run free.
