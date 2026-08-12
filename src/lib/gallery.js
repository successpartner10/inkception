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
  // fx-aliased ids reuse their engines by name
  shoeluxe: (d, w, h) => PX.luxuryGrade(d, w, h),
  shoematte: (d, w, h) => PX.matteFinish(d, w, h),
  shoeclean: (d, w, h) => PX.spotCleaner(d, w, h),
  shoescuff: (d, w, h) => PX.scratchRemove(d, w, h),
  leatherrich: (d, w, h) => PX.fabricEnhance(d, w, h),
  shoead: (d, w, h) => PX.adGrade(d, w, h),
  ironoutfit: (d, w, h) => PX.clothSmooth(d, w, h),
  steampress: (d, w, h) => PX.clothSmooth(d, w, h),
  lintoff: (d, w, h) => PX.spotCleaner(d, w, h),
  stainoff: (d, w, h) => PX.spotCleaner(d, w, h),
  fashionlux: (d, w, h) => PX.luxuryGrade(d, w, h),
  silkier: (d, w, h) => PX.silkSheen(d, w, h),
  fabricmatte: (d, w, h) => PX.matteFinish(d, w, h),
  denimpro: (d, w, h) => PX.denimPop(d, w, h),
  premiumleather: (d, w, h) => PX.fabricEnhance(d, w, h),
  editorialfit: (d, w, h) => PX.adGrade(d, w, h),
  bagscuff: (d, w, h) => PX.scratchRemove(d, w, h),
  bagleather: (d, w, h) => PX.fabricEnhance(d, w, h),
  hardwareshine: (d, w, h) => PX.metalShine(d, w, h),
  bagdust: (d, w, h) => PX.spotCleaner(d, w, h),
  bagbrandnew: (d, w, h) => PX.productClean(d, w, h),
  goldluxe: (d, w, h) => PX.luxuryGrade(d, w, h),
  jewelshine: (d, w, h) => PX.metalShine(d, w, h),
  jewelscuff: (d, w, h) => PX.scratchRemove(d, w, h),
  fingerprintoff: (d, w, h) => PX.spotCleaner(d, w, h),
  platinumshine: (d, w, h) => PX.metalShine(d, w, h),
  jewelad: (d, w, h) => PX.adGrade(d, w, h),
  goldbarshine: (d, w, h) => PX.goldRich(d, w, h),
  goldbarclean: (d, w, h) => PX.productClean(d, w, h),
  watchshine: (d, w, h) => PX.metalShine(d, w, h),
  watchface: (d, w, h) => PX.sharpenMore(d, w, h),
  braceletpolish: (d, w, h) => PX.metalShine(d, w, h),
  watchcuff: (d, w, h) => PX.scratchRemove(d, w, h),
  productrestore: (d, w, h) => PX.productClean(d, w, h),
  fraglux: (d, w, h) => PX.luxuryGrade(d, w, h),
  bottleclean: (d, w, h) => PX.spotCleaner(d, w, h),
  bottlescuff: (d, w, h) => PX.scratchRemove(d, w, h),
  packsharp: (d, w, h) => PX.sharpenMore(d, w, h),
  labelclear: (d, w, h) => PX.sharpenMore(d, w, h),
  beautyad: (d, w, h) => PX.adGrade(d, w, h),
  sunlight: (d, w, h) => PX.windowLight(d, w, h),
  docscan: (d, w, h) => PX.planSharp(d, w, h),
  glassclean: (d, w, h) => PX.screenClean(d, w, h),
  lensshine: (d, w, h) => PX.glassGloss(d, w, h),
  framepolish: (d, w, h) => PX.metalShine(d, w, h),
  screenclean: (d, w, h) => PX.screenClean(d, w, h),
  deviceshine: (d, w, h) => PX.glassGloss(d, w, h),
  devicebrandnew: (d, w, h) => PX.productClean(d, w, h),
  techsharp: (d, w, h) => PX.sharpenMore(d, w, h),
  techad: (d, w, h) => PX.adGrade(d, w, h),
  foodpop: (d, w, h) => PX.foodAppetize(d, w, h),
  foodvibrant: (d, w, h) => PX.gemVibrance(d, w, h),
  plateclean: (d, w, h) => PX.spotCleaner(d, w, h),
  drinkrich: (d, w, h) => PX.liquidRich(d, w, h),
  beveragead: (d, w, h) => PX.adGrade(d, w, h),
  condensation: (d, w, h) => PX.sparkle(d, w, h),
  candleclean: (d, w, h) => PX.spotCleaner(d, w, h),
  soappro: (d, w, h) => PX.sharpenMore(d, w, h),
  bathlux: (d, w, h) => PX.luxuryGrade(d, w, h),
  homead: (d, w, h) => PX.adGrade(d, w, h),
  carpaint: (d, w, h) => PX.carShine(d, w, h),
  carinterior: (d, w, h) => PX.luxuryGrade(d, w, h),
  cardetail: (d, w, h) => PX.sharpenMore(d, w, h),
  carbrandnew: (d, w, h) => PX.productClean(d, w, h),
  carad: (d, w, h) => PX.adGrade(d, w, h),
  skypop: (d, w, h) => PX.skyPop(d, w, h),
  exteriorbright: (d, w, h) => PX.roomBrighten(d, w, h),
  realtorlux: (d, w, h) => PX.luxuryGrade(d, w, h),
  listingsharp: (d, w, h) => PX.planSharp(d, w, h),
  posterclean: (d, w, h) => PX.posterClean(d, w, h),
  makeupLook: (d, w, h) => PX.makeupPop(d, w, h),
  makeuplook: (d, w, h) => PX.makeupPop(d, w, h),
  patternpop: (d, w, h) => PX.patternPop(d, w, h),
  shirtcrisp: (d, w, h) => PX.clothSmooth(d, w, h),
  suitpressed: (d, w, h) => PX.clothSmooth(d, w, h),
  jacketrich: (d, w, h) => PX.fabricEnhance(d, w, h),
  tieshine: (d, w, h) => PX.silkSheen(d, w, h),
  scarfsoft: (d, w, h) => PX.fluffSoften(d, w, h),
  hatfresh: (d, w, h) => PX.spotCleaner(d, w, h),
  sportpro: (d, w, h) => PX.denimPop(d, w, h),
  swimvibrant: (d, w, h) => PX.gemVibrance(d, w, h),
  knitsoft: (d, w, h) => PX.fluffSoften(d, w, h),
  sockcrisp: (d, w, h) => PX.sharpenMore(d, w, h),
  outfiteditorial: (d, w, h) => PX.adGrade(d, w, h),
  lugscuff: (d, w, h) => PX.scratchRemove(d, w, h),
  lugclean: (d, w, h) => PX.spotCleaner(d, w, h),
  lugleather: (d, w, h) => PX.fabricEnhance(d, w, h),
  backpackpro: (d, w, h) => PX.sharpenMore(d, w, h),
  lugbrandnew: (d, w, h) => PX.productClean(d, w, h),
  beltleather: (d, w, h) => PX.fabricEnhance(d, w, h),
  beltbuckle: (d, w, h) => PX.metalShine(d, w, h),
  walletrich: (d, w, h) => PX.luxuryGrade(d, w, h),
  walletclean: (d, w, h) => PX.spotCleaner(d, w, h),
  skinclear: (d, w, h) => PX.glassGloss(d, w, h),
  serumgloss: (d, w, h) => PX.glassGloss(d, w, h),
  creamclean: (d, w, h) => PX.spotCleaner(d, w, h),
  beautypro: (d, w, h) => PX.sharpenMore(d, w, h),
  drawingclean: (d, w, h) => PX.posterClean(d, w, h),
  receiptclear: (d, w, h) => PX.planSharp(d, w, h),
  invoicebright: (d, w, h) => PX.posterClean(d, w, h),
  magcover: (d, w, h) => PX.adGrade(d, w, h),
  editorialgrade: (d, w, h) => PX.adGrade(d, w, h),
  motoshine: (d, w, h) => PX.carShine(d, w, h),
  artvibrant: (d, w, h) => PX.gemVibrance(d, w, h),
  canvasbright: (d, w, h) => PX.roomBrighten(d, w, h),
  frameshine: (d, w, h) => PX.glassGloss(d, w, h),
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
// Engine lookup by the SAME names the editor's runner uses (fx field on
// generated actions) — so auto-generated actions get live gallery previews.
const ENGINE_FNS = {
  'Spot Clean': PX.spotCleaner, 'Scratch Remover': PX.scratchRemove, 'Metal Shine': PX.metalShine,
  'Shoe Gloss': PX.shoeGloss, 'Matte Finish': PX.matteFinish, 'Fluff Soften': PX.fluffSoften,
  'Glamour': PX.glamour, 'Denim Pop': PX.denimPop, 'Silk Sheen': PX.silkSheen,
  'Smooth Fabric': PX.clothSmooth, 'Product Sharpen': PX.sharpenMore, 'Rich Gold': PX.goldRich,
  'Gold Bar': PX.goldBar, 'Brand New': PX.productClean, 'Bright Silver': PX.silverBright,
  'Luxury Grade': PX.luxuryGrade, 'Screen Clean': PX.screenClean, 'Glass Gloss': PX.glassGloss,
  'Diamond Bright': PX.crystalBright, 'Diamond Sparkle': PX.diamondSparkle, 'Room Brighten': PX.roomBrighten,
  'Floor Clean': PX.floorClean, 'Fabric Rich': PX.fabricEnhance, 'Gemstone Vibrance': PX.gemVibrance,
  'Poster Clean': PX.posterClean, 'Plan Sharp': PX.planSharp, 'Food Appetize': PX.foodAppetize,
  'Liquid Rich': PX.liquidRich, 'Crystal Bright': PX.crystalBright, 'De-Reflect': PX.deReflect,
  'Car Shine': PX.carShine, 'Sky Pop': PX.skyPop, 'Makeup Pop': PX.makeupPop, 'Pattern Pop': PX.patternPop,
  'Sole Brighten': PX.soleBrighten, 'Catalog Look': PX.adGrade, 'Luxury Interior': PX.interiorLux,
  'Window Light': PX.windowLight, 'Vignette': PX.vignette, 'Kaleidoscope': PX.kaleido,
  'Duotone': PX.duotone, 'Split Tone': PX.splitTone, 'Dehaze': PX.dehaze, 'Zoom Blur': PX.zoomBlur,
  'Glitch': PX.glitch, 'Eyes': PX.eyes, 'Lips': PX.lips, 'Charcoal': PX.charcoal, 'Posterize': PX.posterize || PX.addNoise,
  'Cyanotype': PX.cyanotype, 'Teal & Orange': PX.tealOrange, 'Cross Process': PX.crossProcess,
  'Infrared': PX.infrared, 'Red Pop': PX.colorPop, 'Ice Blue': PX.ice, 'Sunset Glow': PX.sunset,
  'Flat Matte': PX.matte, 'Noir': PX.noir, 'Bleach Bypass': PX.bleach, 'Lomo': PX.lomo, 'Pastel': PX.pastel,
  'Scanlines': PX.scanlines, 'Dither': PX.dither, 'Blueprint': PX.blueprint, 'Add Sparkle': PX.sparkle,
  'Liquid Rich': PX.liquidRich,
}

function applyThumb(ctx, img, w, h, id, fx) {
  const fn = PX_MAP[id] || (fx && ENGINE_FNS[fx])
  if (fn) {
    const data = ctx.getImageData(0, 0, w, h)
    const out = fn(data.data, w, h)
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
    try { applyThumb(ctx, img, w, h, a.id, a.fx) } catch { /* skip broken */ }
    out.push({ id: a.id, name: a.name, icon: a.icon, cat: a.cat, url: cv.toDataURL('image/jpeg', 0.82) })
    if (onProgress) onProgress(i + 1, list.length)
    await new Promise((r) => setTimeout(r, 0))
  }
  return out
}
