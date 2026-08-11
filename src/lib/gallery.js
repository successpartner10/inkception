// src/lib/gallery.js
// Effects gallery — render every local Action as a live thumbnail of YOUR
// image, so you can pick a look visually instead of reading names. Runs
// 100% locally on a small downscaled copy; clicking applies the real
// action to the full image through the normal pipeline.

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

/** Render a thumbnail (dataURL) for one action id. */
function applyThumb(ctx, img, w, h, id) {
  if (PX_MAP[id]) {
    const data = ctx.getImageData(0, 0, w, h)
    const out = PX_MAP[id](data.data, w, h)
    ctx.putImageData(new ImageData(out, w, h), 0, 0)
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

/**
 * Build one thumbnail per action, sequentially (yields between frames so the
 * UI stays responsive). Returns [{ id, name, icon, cat, url }].
 */
export async function buildGalleryThumbs(list, src, size = 150, onProgress) {
  const img = await loadImage(src)
  const scale = Math.min(1, size / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
  const w = Math.max(2, Math.round((img.naturalWidth || 1) * scale))
  const h = Math.max(2, Math.round((img.naturalHeight || 1) * scale))
  const out = []
  for (let i = 0; i < list.length; i++) {
    const a = list[i]
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    const ctx = cv.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    try { applyThumb(ctx, img, w, h, a.id) } catch { /* skip broken */ }
    out.push({ id: a.id, name: a.name, icon: a.icon, cat: a.cat, url: cv.toDataURL('image/jpeg', 0.82) })
    if (onProgress) onProgress(i + 1, list.length)
    await new Promise((r) => setTimeout(r, 0))
  }
  return out
}
