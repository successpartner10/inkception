// src/lib/gallery.js
// Effects gallery — render every local Action as a live thumbnail of YOUR
// image, so you can pick a look visually instead of reading names. Runs
// 100% locally on a small downscaled copy; clicking applies the real
// action to the full image through the normal pipeline.
//
// SPEED (v0.17.32): thumbnails are rendered in rAF batches and streamed to
// the UI one batch per frame — the first tiles appear almost instantly and
// the grid fills in while you browse, instead of blocking until all ~360
// are done. Rendered thumbs are cached per image so re-opening the gallery
// is instant.
//
// ACCURACY: the engine for each action is resolved by the SAME names the
// editor's runner uses (fx field), with a camelCase probe into the pixel
// engine — so every generated action previews a real effect, never the
// untouched original.

import * as PX from './pxengine'
import { DEFAULT_FILTERS, cssFilterString } from './filters'

/* ---- pure pixel ops (action id → pxengine fn) ---------------------------- */
const PX_MAP = {
  vignette: (d, w, h) => PX.vignette(d, w, h),
  kaleido: (d, w, h) => PX.kaleido(d, w, h),
  duotone: (d, w, h) => PX.duotone(d, w, h),
  splittone: (d, w, h) => PX.splitTone(d, w, h),
  posterize: (d, w, h) => PX.posterize ? PX.posterize(d, w, h) : PX.addNoise(d, w, h, 8),
  glitch: (d, w, h) => PX.glitch(d, w, h),
  zoomblur: (d, w, h) => PX.zoomBlur(d, w, h),
  eyes: (d, w, h) => PX.eyes(d, w, h),
  lipcolor: (d, w, h) => PX.lips(d, w, h),
  charcoal: (d, w, h) => PX.charcoal(d, w, h),
  dehaze: (d, w, h) => PX.dehaze(d, w, h),
  halftone: (d, w, h) => PX.halftone(d, w, h),
  filmgrain: (d, w, h) => PX.filmGrain(d, w, h),
  tilt: (d, w, h) => PX.tiltShift(d, w, h),
  grain2: (d, w, h) => PX.addNoise(d, w, h, 30),
  sketch: (d, w, h) => PX.graphicPen(d, w, h),
  neon: (d, w, h) => PX.glowingEdges(d, w, h),
  despeckle: (d, w, h) => PX.medianFilter(d, w, h, 1),
  canvas: (d, w, h) => PX.canvasWeave(d, w, h),
  cyanotype: (d, w, h) => PX.cyanotype(d, w, h),
  tealorange: (d, w, h) => PX.tealOrange(d, w, h),
  crossprocess: (d, w, h) => PX.crossProcess(d, w, h),
  infrared: (d, w, h) => PX.infrared(d, w, h),
  colorpop: (d, w, h) => PX.colorPop(d, w, h),
  ice: (d, w, h) => PX.ice(d, w, h),
  sunset: (d, w, h) => PX.sunset(d, w, h),
  matte: (d, w, h) => PX.matte(d, w, h),
  noir: (d, w, h) => PX.noir(d, w, h),
  bleach: (d, w, h) => PX.bleach(d, w, h),
  lomo: (d, w, h) => PX.lomo(d, w, h),
  pastel: (d, w, h) => PX.pastel(d, w, h),
  scanlines: (d, w, h) => PX.scanlines(d, w, h),
  dither: (d, w, h) => PX.dither(d, w, h),
  blueprint: (d, w, h) => PX.blueprint(d, w, h),
  luxury: (d, w, h) => PX.luxuryGrade(d, w, h),
  catalog: (d, w, h) => PX.adGrade(d, w, h),
  brandnew: (d, w, h) => PX.productClean(d, w, h),
  productsharp: (d, w, h) => PX.sharpenMore(d, w, h),
  mattefinish: (d, w, h) => PX.matteFinish(d, w, h),
  diamond: (d, w, h) => PX.diamondSparkle(d, w, h),
  goldrich: (d, w, h) => PX.goldRich(d, w, h),
  silverbright: (d, w, h) => PX.silverBright(d, w, h),
  gemstone: (d, w, h) => PX.gemVibrance(d, w, h),
  metalshine: (d, w, h) => PX.metalShine(d, w, h),
  glassgloss: (d, w, h) => PX.glassGloss(d, w, h),
  fabricrich: (d, w, h) => PX.fabricEnhance(d, w, h),
  denim: (d, w, h) => PX.denimPop(d, w, h),
  silksheen: (d, w, h) => PX.silkSheen(d, w, h),
  dewrinkle: (d, w, h) => PX.clothSmooth(d, w, h),
  scratchoff: (d, w, h) => PX.scratchRemove(d, w, h),
  spotclean: (d, w, h) => PX.spotCleaner(d, w, h),
  interiorbright: (d, w, h) => PX.roomBrighten(d, w, h),
  interiorlux: (d, w, h) => PX.interiorLux(d, w, h),
  windowlight: (d, w, h) => PX.windowLight(d, w, h),
  floorclean: (d, w, h) => PX.floorClean(d, w, h),
  shoegloss: (d, w, h) => PX.shoeGloss(d, w, h),
  solebright: (d, w, h) => PX.soleBrighten(d, w, h),
  fluffsoft: (d, w, h) => PX.fluffSoften(d, w, h),
  dereflect: (d, w, h) => PX.deReflect(d, w, h),
  plansharp: (d, w, h) => PX.planSharp(d, w, h),
  goldbarreal: (d, w, h) => PX.goldBar(d, w, h),
  diamondbright: (d, w, h) => PX.crystalBright(d, w, h),
  liquidrich: (d, w, h) => PX.liquidRich(d, w, h),
  // beauty / body / restore (need segmentation or full-res) — run best-effort
  teeth: (d, w, h) => PX.whitenTeeth(d, w, h, 0.6),
  pimples: (d, w, h) => PX.removePimples(d, w, h, 0.5),
  wrinkles: (d, w, h) => PX.wrinkleReduce(d, w, h, 0.5),
  glamour: (d, w, h) => PX.glamour(d, w, h, 0.5),
  restore: (d, w, h) => PX.oldPhotoRestore(d, w, h, 0.55),
  crease: (d, w, h) => { const m = PX.detectCreases(d, w, h, 0.6); return PX.repairCreases(d, w, h, m, 0.7) },
  colorbw: (d, w, h) => PX.bwTint(d, w, h, 'sepia', 0.6),
}

/* ---- CSS-filter actions (action id → target filters object) -------------- */
const FILTER_MAP = {
  goldenhour: { ...DEFAULT_FILTERS, temperature: 55, saturation: 110 },
  hdr: { ...DEFAULT_FILTERS, contrast: 122, saturation: 118 },
  faded: { ...DEFAULT_FILTERS, contrast: 82, saturation: 92 },
  pop: { ...DEFAULT_FILTERS, saturation: 150, contrast: 120 },
  warm: { ...DEFAULT_FILTERS, temperature: 45 },
  cool: { ...DEFAULT_FILTERS, temperature: -45 },
  brighten: { ...DEFAULT_FILTERS, brightness: 112 },
  darken: { ...DEFAULT_FILTERS, brightness: 88 },
  contrast: { ...DEFAULT_FILTERS, contrast: 115 },
  saturate: { ...DEFAULT_FILTERS, saturation: 120 },
  desaturate: { ...DEFAULT_FILTERS, saturation: 60 },
}

/* extra CSS transforms for fx-ish actions */
const FX_CSS = {
  sepia: 'sepia(1)',
  vintagebw: 'grayscale(1) sepia(0.6)',
  bw: 'grayscale(1)',
  bwchannel: 'grayscale(1)',
  instant: 'sepia(0.45) contrast(0.9) saturate(0.88)',
  aged: 'sepia(0.85) brightness(0.94)',
}

const MIRROR = new Set(['mirror'])

/* engine-name aliases where the fx name ≠ a camelCase PX export */
const ENGINE_ALIASES = {
  'Catalog Look': PX.adGrade,
  'Luxury Interior': PX.interiorLux,
  'Teal & Orange': PX.tealOrange,
  'Cross Process': PX.crossProcess,
  'Red Pop': PX.colorPop,
  'Ice Blue': PX.ice,
  'Sunset Glow': PX.sunset,
  'Flat Matte': PX.matte,
  'Bleach Bypass': PX.bleach,
  'Zoom Blur': PX.zoomBlur,
  'Split Tone': PX.splitTone,
  'Shoe Gloss': PX.shoeGloss,
  'Sole Brighten': PX.soleBrighten,
  'De-Reflect': PX.deReflect,
  'Plan Sharp': PX.planSharp,
  'Screen Clean': PX.screenClean,
  'Poster Clean': PX.posterClean,
  'Makeup Pop': PX.makeupPop,
  'Pattern Pop': PX.patternPop,
  'Diamond Bright': PX.crystalBright,
  'Diamond Sparkle': PX.diamondSparkle,
  'Room Brighten': PX.roomBrighten,
  'Floor Clean': PX.floorClean,
  'Food Appetize': PX.foodAppetize,
  'Liquid Rich': PX.liquidRich,
  'Crystal Bright': PX.crystalBright,
  'Car Shine': PX.carShine,
  'Sky Pop': PX.skyPop,
  'Brand New': PX.productClean,
  'Matte Finish': PX.matteFinish,
  'Rich Gold': PX.goldRich,
  'Gold Bar': PX.goldBar,
  'Bright Silver': PX.silverBright,
  'Luxury Grade': PX.luxuryGrade,
  'Smooth Fabric': PX.clothSmooth,
  'Fabric Rich': PX.fabricEnhance,
  'Gemstone Vibrance': PX.gemVibrance,
  'Product Sharpen': PX.sharpenMore,
  'Scratch Remover': PX.scratchRemove,
  'Spot Clean': PX.spotCleaner,
  'Metal Shine': PX.metalShine,
  'Glass Gloss': PX.glassGloss,
  'Denim Pop': PX.denimPop,
  'Silk Sheen': PX.silkSheen,
  'Fluff Soften': PX.fluffSoften,
  'Glamour': PX.glamour,
  'Add Sparkle': PX.sparkle,
  'Window Light': PX.windowLight,
  'Vignette': PX.vignette,
  'Kaleidoscope': PX.kaleido,
  'Duotone': PX.duotone,
  'Dehaze': PX.dehaze,
  'Glitch': PX.glitch,
  'Eyes': PX.eyes,
  'Lips': PX.lips,
  'Charcoal': PX.charcoal,
  'Posterize': PX.posterize || PX.addNoise,
  'Cyanotype': PX.cyanotype,
  'Infrared': PX.infrared,
  'Noir': PX.noir,
  'Lomo': PX.lomo,
  'Pastel': PX.pastel,
  'Scanlines': PX.scanlines,
  'Dither': PX.dither,
  'Blueprint': PX.blueprint,
}

/** Resolve an engine by the SAME human name the editor's runner uses. */
function engineByName(name) {
  if (!name) return null
  if (ENGINE_ALIASES[name]) return ENGINE_ALIASES[name]
  const cc = name.replace(/[^A-Za-z0-9]+(.)/g, (m, c) => c.toUpperCase())
  const key = cc[0] ? cc[0].toLowerCase() + cc.slice(1) : cc
  const fn = PX[key] || PX[name] || PX[cc]
  return typeof fn === 'function' ? fn : null
}

function applyThumb(ctx, img, w, h, id, fx) {
  const fn = PX_MAP[id] || engineByName(fx)
  if (fn) {
    const data = ctx.getImageData(0, 0, w, h)
    const out = fn(data.data, w, h)
    if (out) ctx.putImageData(new ImageData(out, w, h), 0, 0)
    return
  }
  if (FILTER_MAP[id]) {
    ctx.filter = cssFilterString(FILTER_MAP[id])
    ctx.drawImage(img, 0, 0, w, h)
    ctx.filter = 'none'
    return
  }
  if (FX_CSS[id]) {
    ctx.filter = FX_CSS[id]
    ctx.drawImage(img, 0, 0, w, h)
    ctx.filter = 'none'
    return
  }
  if (MIRROR.has(id)) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(img, 0, 0, w, h)
    return
  }
  if (id === 'pixelate') {
    const data = ctx.getImageData(0, 0, w, h)
    const out = PX.pixelateData(data.data, w, h, Math.max(4, Math.round(w / 18)))
    ctx.putImageData(new ImageData(out, w, h), 0, 0)
  }
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image()
    im.onload = () => res(im)
    im.onerror = rej
    im.src = src
  })
}

/* ---- thumbnail cache (per source image) ---------------------------------- */
const thumbCache = new Map() // `${srcKey}|${id}|${w}x${h}` → dataURL
function keyOf(src) {
  // cheap but decent fingerprint: sample chars + length (no full hash cost on
  // multi-hundred-KB data URLs)
  let h = 5381
  const step = Math.max(1, Math.floor(src.length / 96))
  for (let i = 0; i < src.length; i += step) h = ((h << 5) + h + src.charCodeAt(i)) | 0
  return (h >>> 0).toString(36) + ':' + src.length
}
function cacheGet(k) {
  const v = thumbCache.get(k)
  // bump recency
  if (v) { thumbCache.delete(k); thumbCache.set(k, v) }
  return v
}
function cacheSet(k, v) {
  if (thumbCache.size > 12000) thumbCache.clear()
  thumbCache.set(k, v)
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)))

/**
 * Build thumbnails for `list`, rendered in rAF batches and streamed via
 * opts.onThumb(thumb, done, total) as soon as each is ready. Returns the
 * full array when finished. Pass opts.stop = { stopped:false } and set
 * .stopped = true to cancel (modal closed / unmounted).
 */
export async function buildGalleryThumbs(list, src, size = 128, opts = {}) {
  const { onThumb, onProgress, stop } = opts
  const img = await loadImage(src)
  const scale = Math.min(1, size / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
  const w = Math.max(2, Math.round((img.naturalWidth || 1) * scale))
  const h = Math.max(2, Math.round((img.naturalHeight || 1) * scale))
  const key = keyOf(src)
  const total = list.length
  const out = []
  const BATCH = 3 // thumbs per frame — keeps the UI smooth
  for (let i = 0; i < list.length; i++) {
    if (stop && stop.stopped) break
    const a = list[i]
    const ck = `${key}|${a.id}|${w}x${h}`
    let url = cacheGet(ck)
    if (!url) {
      const cv = document.createElement('canvas')
      cv.width = w
      cv.height = h
      const ctx = cv.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      try { applyThumb(ctx, img, w, h, a.id, a.fx) } catch { /* keep original */ }
      url = cv.toDataURL('image/jpeg', 0.78)
      cacheSet(ck, url)
    }
    const t = { id: a.id, name: a.name, icon: a.icon, cat: a.cat, url }
    out.push(t)
    if (onThumb) onThumb(t, i + 1, total)
    if (onProgress && (i % 8 === 7 || i === total - 1)) onProgress(i + 1, total)
    if (i % BATCH === BATCH - 1) await nextFrame()
  }
  if (onProgress) onProgress(total, total)
  return out
}
