import { filters as F } from 'fabric'

// Adjustment state model + CSS/Fabric filter translation.
// All values are human-readable "photo" units:
//   brightness / contrast / saturation: 0–200, default 100
//   exposure / temperature / tint: -100…100, default 0

export const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 0,
  temperature: 0,
  tint: 0,
}

export const AUTO_ENHANCE_FILTERS = {
  brightness: 108,
  contrast: 114,
  saturation: 112,
  exposure: 4,
  temperature: 8,
  tint: 0,
}

export const isDefaultFilters = (f) =>
  Object.keys(DEFAULT_FILTERS).every((k) => Math.abs(f[k] - DEFAULT_FILTERS[k]) < 0.001)

/** CSS filter string — used by the Before/After comparison overlay + export. */
export function cssFilterString(f) {
  const parts = []
  parts.push(`brightness(${(f.brightness / 100 + (f.exposure / 100) * 0.4).toFixed(3)})`)
  parts.push(`contrast(${(f.contrast / 100).toFixed(3)})`)
  parts.push(`saturate(${(f.saturation / 100).toFixed(3)})`)
  if (f.temperature > 0) {
    parts.push(`sepia(${((f.temperature / 100) * 0.4).toFixed(3)})`)
    parts.push(`hue-rotate(${(-f.temperature * 0.08).toFixed(2)}deg)`)
  } else if (f.temperature < 0) {
    parts.push(`saturate(${(1 + (f.temperature / 100) * 0.25).toFixed(3)})`)
    parts.push(`hue-rotate(${(-f.temperature * 0.12).toFixed(2)}deg)`)
  }
  if (f.tint !== 0) {
    parts.push(`hue-rotate(${(f.tint * 0.1).toFixed(2)}deg)`)
  }
  return parts.join(' ')
}

/** Fabric.js filter chain — applied live to the canvas image object. */
export function buildFabricFilters(f) {
  const list = []
  list.push(new F.Brightness({ brightness: f.brightness / 100 - 1 + (f.exposure / 100) * 0.4 }))
  list.push(new F.Contrast({ contrast: f.contrast / 100 - 1 }))
  list.push(new F.Saturation({ saturation: f.saturation / 100 - 1 }))
  if (f.temperature > 0) {
    const a = (f.temperature / 100) * 0.22
    list.push(new F.ColorMatrix({ matrix: [
      1, 0, 0, 0, a * 120,
      0, 1, 0, 0, a * 45,
      0, 0, 1, 0, a * -10,
      0, 0, 0, 1, 0,
    ] }))
  } else if (f.temperature < 0) {
    const a = (-f.temperature / 100) * 0.22
    list.push(new F.ColorMatrix({ matrix: [
      1, 0, 0, 0, a * -30,
      0, 1, 0, 0, a * -10,
      0, 0, 1, 0, a * 70,
      0, 0, 0, 1, 0,
    ] }))
  }
  if (f.tint !== 0) {
    list.push(new F.HueRotation({ rotation: f.tint * 0.12 }))
  }
  return list
}

/* ------------------------- Quick actions (§7) ------------------------- */
// 20 one-click effects across COLOR / ADJUST / FILTER / TRANSFORM.

export const QUICK_DEFAULTS = {
  invert: false,
  bw: false,
  sepia: false,
  vintage: false,
  blur: 0, // 0 = off, 0.2 mild, 0.8 heavy
  sharpen: false,
  noise: 0,
  pixelate: 0,
  flipX: false,
  flipY: false,
  angle: 0,
}

/** Quick-effect fabric filters, appended after the base adjustments. */
export function buildQuickFilters(fx) {
  const list = []
  if (fx.invert) list.push(new F.Invert())
  if (fx.bw) list.push(new F.Grayscale())
  if (fx.sepia) list.push(new F.Sepia())
  if (fx.vintage) {
    list.push(new F.Sepia())
    list.push(new F.Brightness({ brightness: -0.06 }))
    list.push(new F.Contrast({ contrast: -0.08 }))
  }
  if (fx.blur > 0) list.push(new F.Blur({ blur: fx.blur }))
  if (fx.sharpen) list.push(new F.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] }))
  if (fx.noise > 0) list.push(new F.Noise({ noise: fx.noise }))
  if (fx.pixelate > 0) list.push(new F.Pixelate({ blocksize: fx.pixelate }))
  return list
}

/** Quick TRANSFORM values to apply to the image object itself. */
export function applyQuickTransforms(img, fx) {
  if (!img) return
  img.set('flipX', !!fx.flipX)
  img.set('flipY', !!fx.flipY)
  img.set('angle', fx.angle || 0)
  img.setCoords()
}

