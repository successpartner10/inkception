// src/lib/pxengine.js
// Pixel pipeline + real filters + selection operations.
// One engine powers the Filter menu, selection ops and paint tools.
// All pure client-side canvas math.

import { loadImageElement } from './utils'

/* ------------------------------ pixel loading ----------------------------- */

export async function loadPixels(dataUrl, maxW = 1400) {
  const img = await loadImageElement(dataUrl)
  const s = Math.min(1, maxW / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(2, Math.round(img.naturalWidth * s))
  const h = Math.max(2, Math.round(img.naturalHeight * s))
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  return { cv, ctx, w, h, data, toDataUrl: () => cv.toDataURL('image/png') }
}

const bilinear = (d, w, h, x, y) => {
  x = Math.max(0, Math.min(w - 1.001, x))
  y = Math.max(0, Math.min(h - 1.001, y))
  const x0 = x | 0, y0 = y | 0
  const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1)
  const fx = x - x0, fy = y - y0
  const i00 = (y0 * w + x0) * 4, i10 = (y0 * w + x1) * 4
  const i01 = (y1 * w + x0) * 4, i11 = (y1 * w + x1) * 4
  return [
    d[i00] * (1 - fx) * (1 - fy) + d[i10] * fx * (1 - fy) + d[i01] * (1 - fx) * fy + d[i11] * fx * fy,
    d[i00 + 1] * (1 - fx) * (1 - fy) + d[i10 + 1] * fx * (1 - fy) + d[i01 + 1] * (1 - fx) * fy + d[i11 + 1] * fx * fy,
    d[i00 + 2] * (1 - fx) * (1 - fy) + d[i10 + 2] * fx * (1 - fy) + d[i01 + 2] * (1 - fx) * fy + d[i11 + 2] * fx * fy,
  ]
}

/* ------------------------- pixel-remap filters ---------------------------- */
// Each filter samples from displaced coords → handles Pinch/Twirl/Ripple etc.

function remap(src, w, h, mapFn) {
  const out = new Uint8ClampedArray(src.length)
  const cx = (w - 1) / 2, cy = (h - 1) / 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [nx, ny] = mapFn(x, y, cx, cy, w, h)
      const [r, g, b] = bilinear(src, w, h, nx, ny)
      const i = (y * w + x) * 4
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255
    }
  }
  return out
}

export const PX_FILTERS = {
  pinch: (d, w, h, s = 0.5) => {
    const cx = (w - 1) / 2, cy = (h - 1) / 2, R = Math.min(w, h) / 2
    return remap(d, w, h, (x, y) => {
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy)
      const k = r >= R ? 1 : Math.pow(r / R, 0.5 + s)
      return [cx + dx * k, cy + dy * k]
    })
  },
  twirl: (d, w, h, s = 0.6) => {
    const cx = (w - 1) / 2, cy = (h - 1) / 2, R = Math.min(w, h) / 2
    return remap(d, w, h, (x, y) => {
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy)
      const a = Math.atan2(dy, dx) + (1 - Math.min(1, r / R)) * s * 6
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
    })
  },
  ripple: (d, w, h, s = 0.4) => {
    return remap(d, w, h, (x, y) => [x + Math.sin(y * 0.09) * s * 22, y + Math.cos(x * 0.07) * s * 14])
  },
  zigzag: (d, w, h, s = 0.5) => {
    return remap(d, w, h, (x, y) => [x + Math.sin(y * 0.15) * s * 26, y + Math.sin(x * 0.12) * s * 26])
  },
  glass: (d, w, h, s = 0.5) => {
    return remap(d, w, h, (x, y) => [x + Math.sin(y * 0.3 + x * 0.2) * s * 10, y + Math.cos(x * 0.3 + y * 0.2) * s * 10])
  },
  spherical: (d, w, h, s = 0.5) => {
    const cx = (w - 1) / 2, cy = (h - 1) / 2, R = Math.min(w, h) / 2
    return remap(d, w, h, (x, y) => {
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy)
      const z = Math.sqrt(Math.max(0, R * R - r * r)) * (0.4 + s * 0.8)
      const k = R / (R - z)
      return [cx + dx * k, cy + dy * k]
    })
  },
}

/* ------------------------------ convolve filters --------------------------- */

function convolve(d, w, h, kernel, div = 1, bias = 0) {
  const k = kernel.length, kc = (k / 2) | 0
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, o = 0
      for (let ky = -kc; ky <= kc; ky++) {
        for (let kx = -kc; kx <= kc; kx++) {
          const v = kernel[o++]
          const xx = Math.min(w - 1, Math.max(0, x + kx))
          const yy = Math.min(h - 1, Math.max(0, y + ky))
          const i = (yy * w + xx) * 4
          r += v * d[i]; g += v * d[i + 1]; b += v * d[i + 2]
        }
      }
      const i = (y * w + x) * 4
      out[i] = r / div + bias; out[i + 1] = g / div + bias; out[i + 2] = b / div + bias; out[i + 3] = 255
    }
  }
  return out
}

export const CONV_FILTERS = {
  emboss: (d, w, h) => convolve(d, w, h, [-2, -1, 0, -1, 1, 1, 0, 1, 2], 1, 128),
  sharpenMore: (d, w, h) => convolve(d, w, h, [0, -1, 0, -1, 5, -1, 0, -1, 0], 1, 0),
  sharpenEdges: (d, w, h) => convolve(d, w, h, [-1, -1, -1, -1, 9, -1, -1, -1, -1], 1, 0),
  blur3: (d, w, h) => convolve(d, w, h, [1, 2, 1, 2, 4, 2, 1, 2, 1], 16, 0),
}

export function sobel(d, w, h) {
  const lum = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
  const out = new Uint8ClampedArray(d.length)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx = -lum[i - w - 1] - 2 * lum[i - 1] - lum[i + w - 1] + lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1]
      const gy = -lum[i - w - 1] - 2 * lum[i - w] - lum[i - w + 1] + lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1]
      const g = Math.min(255, Math.hypot(gx, gy))
      const j = i * 4
      out[j] = g; out[j + 1] = g; out[j + 2] = g; out[j + 3] = 255
    }
  }
  return out
}

export const EDGE_FILTERS = {
  findEdges: (d, w, h) => sobel(d, w, h),
  glowingEdges: (d, w, h) => {
    const e = sobel(d, w, h)
    const out = new Uint8ClampedArray(d.length)
    for (let i = 0; i < e.length; i += 4) {
      out[i] = 0; out[i + 1] = 0; out[i + 2] = Math.min(255, e[i] * 1.4); out[i + 3] = 255
    }
    return out
  },
  solarize: (d, w, h) => {
    const out = new Uint8ClampedArray(d.length)
    for (let i = 0; i < d.length; i += 4) {
      out[i] = d[i] < 128 ? 255 - d[i] : d[i]
      out[i + 1] = d[i + 1] < 128 ? 255 - d[i + 1] : d[i + 1]
      out[i + 2] = d[i + 2] < 128 ? 255 - d[i + 2] : d[i + 2]
      out[i + 3] = 255
    }
    return out
  },
}

/* ------------------------------ noise / misc ------------------------------ */

export function addNoise(d, w, h, amt = 30) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amt * 2
    out[i] = Math.min(255, Math.max(0, d[i] + n))
    out[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n))
    out[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n))
    out[i + 3] = 255
  }
  return out
}

export function medianFilter(d, w, h, rad = 1) {
  const out = new Uint8ClampedArray(d.length)
  const n = (rad * 2 + 1) ** 2
  const win = new Array(n)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let o = 0
      for (let ky = -rad; ky <= rad; ky++) {
        for (let kx = -rad; kx <= rad; kx++) {
          const xx = Math.min(w - 1, Math.max(0, x + kx))
          const yy = Math.min(h - 1, Math.max(0, y + ky))
          win[o++] = d[(yy * w + xx) * 4]
        }
      }
      win.sort((a, b) => a - b)
      const med = win[n >> 1]
      const i = (y * w + x) * 4
      out[i] = med; out[i + 1] = med; out[i + 2] = med; out[i + 3] = 255
    }
  }
  return out
}

export function filmGrain(d, w, h, amt = 24) {
  const out = addNoise(d, w, h, amt)
  for (let i = 0; i < d.length; i += 4) {
    out[i] = Math.min(255, d[i] * 0.94 + out[i] * 0.06)
    out[i + 1] = Math.min(255, d[i + 1] * 0.94 + out[i + 1] * 0.06)
    out[i + 2] = Math.min(255, d[i + 2] * 0.94 + out[i + 2] * 0.06)
  }
  return out
}

/* ------------------------------ procedural render -------------------------- */

function valueNoise(w, h, scale = 0.03) {
  // cheap value noise → clouds
  const grid = new Float32Array((w + 2) * (h + 2))
  for (let i = 0; i < grid.length; i++) grid[i] = Math.random()
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = x * scale, gy = y * scale
      const x0 = gx | 0, y0 = gy | 0
      const fx = gx - x0, fy = gy - y0
      const i00 = grid[y0 * (w + 2) + x0]
      const i10 = grid[y0 * (w + 2) + x0 + 1]
      const i01 = grid[(y0 + 1) * (w + 2) + x0]
      const i11 = grid[(y0 + 1) * (w + 2) + x0 + 1]
      const sx = fx * fx * (3 - 2 * fx)
      const sy = fy * fy * (3 - 2 * fy)
      out[y * w + x] = i00 * (1 - sx) * (1 - sy) + i10 * sx * (1 - sy) + i01 * (1 - sx) * sy + i11 * sx * sy
    }
  }
  return out
}

export function clouds(w, h, diff = false) {
  const n = valueNoise(w, h, 0.025)
  const out = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    let v = n[i] * 255
    if (diff) v = 128 + (v - 128) * 1.6
    out[i * 4] = v; out[i * 4 + 1] = v; out[i * 4 + 2] = v; out[i * 4 + 3] = 255
  }
  return out
}

export function fibers(w, h, variance = 0.5) {
  const out = new Uint8ClampedArray(w * h * 4)
  for (let x = 0; x < w; x++) {
    const base = Math.random() * 255
    for (let y = 0; y < h; y++) {
      const v = Math.min(255, Math.max(0, base + (Math.random() - 0.5) * variance * 200))
      const i = (y * w + x) * 4
      out[i] = v; out[i + 1] = v; out[i + 2] = v; out[i + 3] = 255
    }
  }
  return out
}

/* ------------------------------ sketch filters ----------------------------- */

export function graphicPen(d, w, h, s = 0.5) {
  const e = sobel(d, w, h)
  const out = new Uint8ClampedArray(d.length)
  const thresh = 60 + s * 80
  for (let i = 0; i < e.length; i += 4) {
    const v = e[i] > thresh ? 0 : 255
    out[i] = v; out[i + 1] = v; out[i + 2] = v; out[i + 3] = 255
  }
  return out
}

export function halftone(d, w, h, cell = 8) {
  const lum = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) lum[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255
  const out = new Uint8ClampedArray(d.length)
  const maxR = cell / 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = Math.floor(x / cell) * cell + cell / 2
      const cy = Math.floor(y / cell) * cell + cell / 2
      const l = lum[Math.min(h - 1, cy) * w + Math.min(w - 1, cx)]
      const r = maxR * (1 - l)
      const dist = Math.hypot(x - cx, y - cy)
      const v = dist < r ? 0 : 255
      const i = (y * w + x) * 4
      out[i] = v; out[i + 1] = v; out[i + 2] = v; out[i + 3] = 255
    }
  }
  return out
}

/* ------------------------------ tilt-shift blur ---------------------------- */

export function tiltShift(d, w, h, strength = 6, focusY = 0.5, range = 0.3) {
  const bl = CONV_FILTERS.blur3(d, w, h)
  // second pass for stronger blur
  const bl2 = CONV_FILTERS.blur3(bl, w, h)
  const out = new Uint8ClampedArray(d.length)
  const fy = h * focusY
  const rg = h * range
  for (let y = 0; y < h; y++) {
    const dist = Math.abs(y - fy) / rg
    const a = Math.min(1, dist)
    const k = a * a * (3 - 2 * a) * (0.4 + strength * 0.1)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      out[i] = d[i] * (1 - k) + bl2[i] * k
      out[i + 1] = d[i + 1] * (1 - k) + bl2[i + 1] * k
      out[i + 2] = d[i + 2] * (1 - k) + bl2[i + 2] * k
      out[i + 3] = 255
    }
  }
  return out
}

/* ------------------------------ cylinder wrap (tin can) ---------------------- */
// Wrap a flat image (logo / label) onto a cylinder surface so it looks
// printed on a tin can. Curvature 0..1 (0 = flat, 1 = strong wrap).
// Optional vertical bow + a highlight "shine" to sell the 3D realism.
export function cylinderWrap(d, w, h, curvature = 0.5, shine = true) {
  const cx = (w - 1) / 2
  const cy = (h - 1) / 2
  const th = Math.max(0.001, curvature * (Math.PI / 2)) // max half-angle
  const tv = Math.max(0.001, curvature * (Math.PI / 2) * 0.35) // vertical bow (subtler)
  const out = new Uint8ClampedArray(d.length)
  const sinTh = Math.sin(th)
  const sinTv = Math.sin(tv)
  for (let y = 0; y < h; y++) {
    const v = (y - cy) / cy // -1..1
    const sv = Math.asin(v * sinTv) / tv // bowed source y
    const sy = cy + sv * cy
    for (let x = 0; x < w; x++) {
      const u = (x - cx) / cx // -1..1
      const su = Math.asin(u * sinTh) / th // inverse cylindrical x
      const sx = cx + su * cx
      const [r, g, b] = bilinear(d, w, h, sx, sy)
      let sh = 1
      if (shine) {
        // highlight band off-center (light source) + slight edge darkening
        const hl = Math.exp(-Math.pow((x - cx * 0.72) / (w * 0.16), 2))
        const edge = 1 - 0.2 * Math.pow(Math.abs(u), 2.2)
        sh = edge * (1 + hl * 0.22)
      }
      const i = (y * w + x) * 4
      out[i] = r * sh
      out[i + 1] = g * sh
      out[i + 2] = b * sh
      out[i + 3] = 255
    }
  }
  return out
}

/* ------------------------------ selection ops ------------------------------ */

// Flood fill (magic wand) — mask of pixels within tolerance of seed.
export function floodFillMask(d, w, h, sx, sy, tol = 32, maxPixels = 600000) {
  const mask = new Uint8Array(w * h)
  const sr = d[(sy * w + sx) * 4], sg = d[(sy * w + sx) * 4 + 1], sb = d[(sy * w + sx) * 4 + 2]
  const t2 = tol * tol * 3
  const stack = [sy * w + sx]
  mask[sy * w + sx] = 1
  let count = 0
  while (stack.length && count < maxPixels) {
    const i = stack.pop()
    count++
    const x = i % w, y = (i / w) | 0
    const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
    for (const [nx, ny] of nb) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const j = ny * w + nx
      if (mask[j]) continue
      const k = j * 4
      const dr = d[k] - sr, dg = d[k + 1] - sg, db = d[k + 2] - sb
      if (dr * dr + dg * dg + db * db <= t2) {
        mask[j] = 1
        stack.push(j)
      }
    }
  }
  return mask
}

// Feather: blur the mask (multiple box passes) → returns Float32 mask.
export function featherMask(mask, w, h, radius = 8) {
  let cur = Float32Array.from(mask)
  const passes = Math.max(1, Math.round(radius / 2))
  for (let p = 0; p < passes; p++) {
    const next = new Float32Array(w * h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let acc = 0, c = 0
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx, ny = y + dy
            if (nx >= 0 && ny >= 0 && nx < w && ny < h) { acc += cur[ny * w + nx]; c++ }
          }
        }
        next[y * w + x] = acc / c
      }
    }
    cur = next
  }
  return cur
}

// Contract/expand: erode/dilate the binary mask.
export function morphMask(mask, w, h, radius, expand) {
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let any = expand ? 0 : 1
      for (let dy = -radius; dy <= radius && (expand ? !any : any); dy++) {
        for (let dx = -radius; dx <= radius && (expand ? !any : any); dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          if (mask[ny * w + nx]) any = expand ? 1 : 0
          else if (!expand) any = 0
        }
      }
      out[y * w + x] = any
    }
  }
  return out
}

// Apply an operation to the image within a mask.
export function applyMaskOp(d, mask, w, h, op, color) {
  const out = new Uint8ClampedArray(d)
  if (op === 'fill' && color) {
    for (let i = 0; i < w * h; i++) {
      if (mask[i] > 0.5) {
        out[i * 4] = color[0]; out[i * 4 + 1] = color[1]; out[i * 4 + 2] = color[2]
      }
    }
  } else if (op === 'delete') {
    for (let i = 0; i < w * h; i++) {
      if (mask[i] > 0.5) out[i * 4 + 3] = 0
    }
  } else if (op === 'copy') {
    // no-op here — caller reads the masked pixels separately
  }
  return out
}

/* ------------------------------ body/chin warps ---------------------------- */
// Slim body: feather a horizontal squeeze over the mid band (keeps head/feet).
export function slimBody(d, w, h, amt = 0.5) {
  const cx = (w - 1) / 2
  const y0 = h * 0.12, y1 = h * 0.88
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++) {
    const fy = Math.min(1, Math.max(0, (y - y0) / (y1 - y0)))
    const feather = Math.min(1, Math.min(fy, 1 - fy) * 5) // 0 at edges, 1 mid
    const s = 1 - 0.16 * amt * feather // squeeze factor
    for (let x = 0; x < w; x++) {
      const sx = cx + (x - cx) / s
      const [r, g, b] = bilinear(d, w, h, sx, y)
      const i = (y * w + x) * 4
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255
    }
  }
  return out
}

// Chin lift: localized upward+inward pinch in the lower-center band.
export function chinLift(d, w, h, amt = 0.5) {
  const cx = (w - 1) / 2
  const cy = h * 0.8
  const rx = w * 0.22, ry = h * 0.14
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry
      const dist = Math.hypot(nx, ny)
      if (dist >= 1) {
        const i = (y * w + x) * 4
        out[i] = d[i]; out[i + 1] = d[i + 1]; out[i + 2] = d[i + 2]; out[i + 3] = 255
        continue
      }
      const t = (1 - dist) // 1 at center → 0 at edge
      const up = amt * 0.05 * h * t
      const inw = (x - cx) * 0.06 * amt * t
      const [r, g, b] = bilinear(d, w, h, x + inw, y + up)
      const i = (y * w + x) * 4
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255
    }
  }
  return out
}

/* ----------------------------- beauty / portrait --------------------------- */
// Teeth whitening: brighten + desaturate pixels in the teeth hue/luma band.
export function whitenTeeth(d, w, h, amt = 0.5) {
  const out = new Uint8ClampedArray(d)
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
    const sat = mx - mn
    // teeth: warm-tinted light pixels, low-mid saturation
    const isTooth = l > 150 && l < 235 && sat < 60 && r > b && g > b
    if (!isTooth) continue
    const k = amt
    out[i] = Math.min(255, r + (255 - r) * 0.5 * k)      // brighten R
    out[i + 1] = Math.min(255, g + (255 - g) * 0.45 * k) // brighten G
    out[i + 2] = Math.min(255, b * (1 - 0.25 * k))        // reduce blue → whiter
  }
  return out
}

// Wrinkle reduction: gentle skin-mask blur (like retouch but subtler + local).
export function wrinkleReduce(d, w, h, amt = 0.5) {
  const blur = CONV_FILTERS.blur3(d, w, h)
  const blur2 = CONV_FILTERS.blur3(blur, w, h)
  const out = new Uint8ClampedArray(d)
  // simple skin detection: warm hue, mid lightness
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
    const sat = mx - mn
    const isSkin = l > 40 && l < 235 && sat < 120 && r > b && r >= g
    if (!isSkin) continue
    const k = Math.min(0.7, amt) * (0.5 + 0.5 * Math.min(1, sat / 80))
    out[i] = r + (blur2[i] - r) * k
    out[i + 1] = g + (blur2[i + 1] - g) * k
    out[i + 2] = b + (blur2[i + 2] - b) * k
  }
  return out
}

// Pimple removal: find high-contrast reddish spots on skin, median-blend them.
export function removePimples(d, w, h, amt = 0.5) {
  const out = new Uint8ClampedArray(d)
  const rad = 1
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      const r = d[i], g = d[i + 1], b = d[i + 2]
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
      // reddish + bright vs neighbors = likely pimple
      const redd = r - Math.max(g, b)
      const localMax = Math.max(
        d[((y - 1) * w + x) * 4], d[((y + 1) * w + x) * 4],
        d[(y * w + x - 1) * 4], d[(y * w + x + 1) * 4],
      )
      if (redd < 18 || r < localMax - 10) continue
      // median of 3x3 reds
      const win = []
      for (let dy = -rad; dy <= rad; dy++)
        for (let dx = -rad; dx <= rad; dx++) win.push(d[((y + dy) * w + (x + dx)) * 4])
      win.sort((a, b) => a - b)
      const med = win[4]
      const k = Math.min(0.85, amt)
      out[i] = r + (med - r) * k
      out[i + 1] = g + (med - g) * k * 0.8
      out[i + 2] = b + (med - b) * k * 0.8
    }
  }
  return out
}

// Glamour: soft skin + subtle glow + warm tint + vignette.
export function glamour(d, w, h, amt = 0.5) {
  const blur = CONV_FILTERS.blur3(d, w, h)
  const blur2 = CONV_FILTERS.blur3(blur, w, h)
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const r = d[i], g = d[i + 1], b = d[i + 2]
      // soft skin: blend toward blurred copy (stronger in midtones)
      const l = (r + g + b) / 3
      const soft = Math.min(0.5, amt) * (1 - Math.abs(l - 128) / 160)
      const sr = r + (blur2[i] - r) * soft
      const sg = g + (blur2[i + 1] - g) * soft
      const sb = b + (blur2[i + 2] - b) * soft
      // warm tint
      const warm = amt * 6
      // vignette
      const nx = (x / w - 0.5) * 2, ny = (y / h - 0.5) * 2
      const vg = 1 - Math.max(0, Math.hypot(nx, ny) - 0.55) * 0.5 * amt
      out[i] = Math.min(255, (sr + warm) * vg)
      out[i + 1] = Math.min(255, (sg + warm * 0.6) * vg)
      out[i + 2] = Math.min(255, Math.max(0, (sb - warm * 0.4)) * vg)
      out[i + 3] = 255
    }
  }
  return out
}

// Motion-blur background (car moving): subject sharp (via mask), bg streaked.
export function motionBlurBg(d, w, h, mask, amt = 0.6) {
  const out = new Uint8ClampedArray(d.length)
  const len = Math.round(6 + amt * 14) // streak length
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (mask && mask[y * w + x]) { // subject → keep sharp
        out[i] = d[i]; out[i + 1] = d[i + 1]; out[i + 2] = d[i + 2]; out[i + 3] = 255
        continue
      }
      let r = 0, g = 0, b = 0, c = 0
      for (let s = -len; s <= len; s++) {
        const sx = Math.min(w - 1, Math.max(0, x + s))
        const j = (y * w + sx) * 4
        r += d[j]; g += d[j + 1]; b += d[j + 2]; c++
      }
      out[i] = r / c; out[i + 1] = g / c; out[i + 2] = b / c; out[i + 3] = 255
    }
  }
  return out
}

// Sparkle: additive glints on bright specular pixels (glass/jewelry).
export function sparkle(d, w, h, amt = 0.5) {
  const out = new Uint8ClampedArray(d)
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3
    if (l < 200) continue
    const k = amt * (l - 200) / 55
    out[i] = Math.min(255, d[i] + 40 * k)
    out[i + 1] = Math.min(255, d[i + 1] + 40 * k)
    out[i + 2] = Math.min(255, d[i + 2] + 40 * k)
  }
  return out
}

/* ------------------------------ diagonal crop ------------------------------ */
// Cut a corner with a straight diagonal line, keeping the other side.
// corner: 'tl' (keep top-left), 'tr', 'bl', 'br' · width: band width 0..1
export function diagonalCrop(d, w, h, corner = 'tl', width = 0) {
  const out = new Uint8ClampedArray(d)
  const band = Math.max(0, Math.min(0.5, width)) * w
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // normalized position on the diagonal line
      const diag = (x / w) + (y / h) // 0..2 (BR→TL-ish)
      let cut = false
      if (corner === 'tr') cut = x / w + y / h < 1 // top-right side
      else if (corner === 'bl') cut = x / w + y / h > 1
      else if (corner === 'tl') cut = x / w > y / h // top-left
      else cut = x / w < y / h // br
      if (!cut) continue
      // soft band: blend alpha across the band
      const dNorm = Math.abs((x / w) - (y / h))
      const a = dNorm < band / w ? dNorm / (band / w) : 1
      const i = (y * w + x) * 4
      out[i + 3] = Math.round(out[i + 3] * a)
    }
  }
  return out
}

/* --------------------------- edge refinement ------------------------------- */
// Clean the cutout edge: feather harsh 1px jaggies, shrink+despeckle the mask.
export function refineEdge(d, w, h, mask, feather = 2, despeckle = true) {
  const out = new Uint8ClampedArray(d)
  // 1) despeckle: isolated mask pixels (single) → remove
  if (despeckle) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        if (!mask[i]) continue
        let n = 0
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (mask[(y + dy) * w + (x + dx)]) n++
        if (n <= 1) mask[i] = 0 // isolated speckle
      }
    }
  }
  // 2) shrink mask by 1px to remove halos (sample inward)
  const shrunk = new Uint8Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (!mask[y * w + x]) continue
      let ok = true
      for (let dy = -1; dy <= 1 && ok; dy++)
        for (let dx = -1; dx <= 1 && ok; dx++)
          if (!mask[(y + dy) * w + (x + dx)]) ok = false
      shrunk[y * w + x] = ok ? 1 : 0
    }
  }
  // 3) apply shrunk mask + feather alpha near boundary
  for (let i = 0; i < w * h; i++) {
    if (!shrunk[i]) out[i * 4 + 3] = 0
    else {
      // feather: check if near the (shrunk) boundary
      let near = 0
      for (let dy = -feather; dy <= feather; dy++) {
        for (let dx = -feather; dx <= feather; dx++) {
          const nx = (i % w) + dx, ny = ((i / w) | 0) + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) { near = 1; break }
          if (!shrunk[ny * w + nx]) { near = 1; break }
        }
        if (near) break
      }
      if (near) out[i * 4 + 3] = Math.round(out[i * 4 + 3] * 0.5)
    }
  }
  return out
}

/* ------------------------- old-photo restore ------------------------------- */
// Detect crease/scratch lines: long thin runs where luminance deviates sharply
// from a blurred local average. Returns a mask (creased=1).
export function detectCreases(d, w, h, strength = 0.5) {
  const blur = CONV_FILTERS.blur3(d, w, h)
  const blur2 = CONV_FILTERS.blur3(blur, w, h) // heavy blur = local average
  const mask = new Uint8Array(w * h)
  const thresh = 26 + (1 - strength) * 30
  for (let i = 0; i < w * h; i++) {
    const l = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3
    const avg = (blur2[i * 4] + blur2[i * 4 + 1] + blur2[i * 4 + 2]) / 3
    const dev = Math.abs(l - avg)
    // creases = strong deviation from surroundings, not a global tone shift
    if (dev > thresh && l < 235) mask[i] = 1
  }
  return mask
}

// Repair creases: inpaint masked pixels from surrounding average + despeckle.
export function repairCreases(d, w, h, mask, strength = 0.5) {
  const out = new Uint8ClampedArray(d)
  // multiple inward-diffusion passes over the crease mask
  const passes = 40
  let cur = new Uint8ClampedArray(d)
  let next = new Uint8ClampedArray(d.length)
  for (let p = 0; p < passes; p++) {
    next.set(cur)
    let changed = 0
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        if (!mask[i]) continue
        let r = 0, g = 0, b = 0, c = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const j = ((y + dy) * w + (x + dx)) * 4
            if (!mask[(y + dy) * w + (x + dx)]) { r += cur[j]; g += cur[j + 1]; b += cur[j + 2]; c++ }
          }
        }
        if (c > 0) { next[i * 4] = r / c; next[i * 4 + 1] = g / c; next[i * 4 + 2] = b / c; changed++ }
      }
    }
    ;[cur, next] = [next, cur]
    if (changed === 0) break
  }
  const k = strength
  for (let i = 0; i < w * h; i++) {
    if (!mask[i]) continue
    out[i * 4] = d[i * 4] + (cur[i * 4] - d[i * 4]) * k
    out[i * 4 + 1] = d[i * 4 + 1] + (cur[i * 4 + 1] - d[i * 4 + 1]) * k
    out[i * 4 + 2] = d[i * 4 + 2] + (cur[i * 4 + 2] - d[i * 4 + 2]) * k
  }
  return out
}

// Full old-photo restore: crease repair + despeckle + faded-tone correction.
export function oldPhotoRestore(d, w, h, strength = 0.5) {
  let out = new Uint8ClampedArray(d)
  const creaseMask = detectCreases(d, w, h, strength)
  out = repairCreases(out, w, h, creaseMask, strength)
  // despeckle (dust)
  out = medianFilter(out, w, h, 1)
  // faded tone: stretch contrast a bit + reduce yellow cast
  const lut = new Array(256)
  const lo = 8, hi = 248
  for (let v = 0; v < 256; v++) lut[v] = Math.round(Math.min(255, Math.max(0, (v - lo) * (255 / (hi - lo)))))
  for (let i = 0; i < out.length; i += 4) {
    out[i] = lut[out[i]]
    out[i + 1] = lut[out[i + 1]]
    const b = lut[out[i + 2]]
    // reduce yellow cast (pull blue up a touch)
    out[i + 2] = Math.min(255, Math.round(b + 4 * strength))
  }
  return out
}

// B&W → color: honest tint presets (not true colorization — labeled).
export function bwTint(d, w, h, mode = 'sepia', amt = 0.5) {
  const out = new Uint8ClampedArray(d)
  const presets = {
    sepia: [1.1, 1.0, 0.8],
    warm: [1.15, 0.98, 0.82],
    cool: [0.85, 0.97, 1.12],
    teal: [0.82, 1.0, 1.05],
    violet: [0.95, 0.85, 1.1],
  }
  const [rr, gg, bb] = presets[mode] || presets.sepia
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    const k = amt
    out[i] = Math.min(255, l * (1 + (rr - 1) * k))
    out[i + 1] = Math.min(255, l * (1 + (gg - 1) * k))
    out[i + 2] = Math.min(255, l * (1 + (bb - 1) * k))
    out[i + 3] = 255
  }
  return out
}

// Enhance only inside a mask (intelligent selection): blend adjusted+original.
export function enhanceRegion(d, w, h, mask, amount = 0.6) {
  const out = new Uint8ClampedArray(d)
  for (let i = 0; i < w * h; i++) {
    const a = mask ? mask[i] : 1
    if (!a) { const j = i * 4; out[j] = d[j]; out[j + 1] = d[j + 1]; out[j + 2] = d[j + 2]; out[j + 3] = 255; continue }
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    // gentle contrast + saturation + brightness inside the mask
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    const c = 1 + amount * 0.18
    const nr = Math.min(255, Math.max(0, (r - 128) * c + 128 + amount * 10))
    const ng = Math.min(255, Math.max(0, (g - 128) * c + 128 + amount * 10))
    const nb = Math.min(255, Math.max(0, (b - 128) * c + 128 + amount * 10))
    // saturate
    const avg = (nr + ng + nb) / 3
    const sat = 1 + amount * 0.35
    out[j] = Math.min(255, Math.max(0, avg + (nr - avg) * sat))
    out[j + 1] = Math.min(255, Math.max(0, avg + (ng - avg) * sat))
    out[j + 2] = Math.min(255, Math.max(0, avg + (nb - avg) * sat))
    out[j + 3] = 255
  }
  return out
}

/* --- extra action engines --- */
export function kaleido(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  const seg = w / 8
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sx = x % seg
      let sy = y
      // fold into one wedge, mirror vertically in each strip
      sx = seg - 1 - sx
      const i = (y * w + x) * 4
      const j = (sy * w + sx) * 4
      out[i] = d[j]; out[i + 1] = d[j + 1]; out[i + 2] = d[j + 2]; out[i + 3] = 255
    }
  }
  return out
}
export function duotone(d, w, h, hi = [235, 225, 210], lo = [25, 30, 55]) {
  const out = new Uint8ClampedArray(d)
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
    out[i] = lo[0] + (hi[0] - lo[0]) * l
    out[i + 1] = lo[1] + (hi[1] - lo[1]) * l
    out[i + 2] = lo[2] + (hi[2] - lo[2]) * l
  }
  return out
}
export function splitTone(d, w, h) {
  const out = new Uint8ClampedArray(d)
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
    out[i] = Math.min(255, d[i] + (l > 0.5 ? 14 : -10))
    out[i + 1] = Math.min(255, Math.max(0, d[i + 1] + (l > 0.5 ? 4 : -6)))
    out[i + 2] = Math.min(255, Math.max(0, d[i + 2] + (l > 0.5 ? -8 : 16)))
  }
  return out
}
export function vignette(d, w, h, amt = 0.4) {
  const out = new Uint8ClampedArray(d)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x / w - 0.5) * 2, ny = (y / h - 0.5) * 2
      const k = 1 - Math.max(0, Math.hypot(nx, ny) - 0.5) * 0.7 * amt
      const i = (y * w + x) * 4
      out[i] = d[i] * k; out[i + 1] = d[i + 1] * k; out[i + 2] = d[i + 2] * k; out[i + 3] = 255
    }
  }
  return out
}
export function dehaze(d, w, h, amt = 0.5) {
  const blur = CONV_FILTERS.blur3(d, w, h)
  const out = new Uint8ClampedArray(d)
  for (let i = 0; i < d.length; i += 4) {
    const k = amt
    out[i] = Math.min(255, Math.max(0, d[i] + (d[i] - blur[i]) * k))
    out[i + 1] = Math.min(255, Math.max(0, d[i + 1] + (d[i + 1] - blur[i + 1]) * k))
    out[i + 2] = Math.min(255, Math.max(0, d[i + 2] + (d[i + 2] - blur[i + 2]) * k))
    out[i + 3] = 255
  }
  return out
}
export function zoomBlur(d, w, h, amt = 0.4) {
  const cx = (w - 1) / 2, cy = (h - 1) / 2
  const out = new Uint8ClampedArray(d)
  const steps = 6
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0
      for (let s = 0; s < steps; s++) {
        const t = s / steps * amt
        const sx = cx + (x - cx) * (1 - t)
        const sy = cy + (y - cy) * (1 - t)
        const [rr, gg, bb] = bilinear(d, w, h, sx, sy)
        r += rr; g += gg; b += bb
      }
      const i = (y * w + x) * 4
      out[i] = r / steps; out[i + 1] = g / steps; out[i + 2] = b / steps; out[i + 3] = 255
    }
  }
  return out
}
export function glitch(d, w, h, amt = 0.4) {
  const out = new Uint8ClampedArray(d)
  const bands = 6
  for (let b = 0; b < bands; b++) {
    const y0 = Math.floor(Math.random() * h)
    const bh = Math.floor(h / bands) + Math.floor(Math.random() * 8)
    const off = Math.floor((Math.random() - 0.5) * w * 0.3 * amt)
    for (let y = y0; y < Math.min(h, y0 + bh); y++) {
      for (let x = 0; x < w; x++) {
        const sx = (x + off + w) % w
        const i = (y * w + x) * 4
        const j = (y * w + sx) * 4
        // RGB split
        out[i] = d[j]; out[i + 1] = d[j + 1]; out[i + 2] = d[j + 2]; out[i + 3] = 255
      }
    }
  }
  return out
}
export function eyes(d, w, h) { return glamour(d, w, h, 0.3) }
export function lips(d, w, h) { return bwTint(d, w, h, 'warm', 0.4) }
export function charcoal(d, w, h) { return graphicPen(d, w, h, 0.7) }

/* Canvas-weave texture — lifts the weave pattern of stretched canvas. */
export function canvasWeave(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      // woven thread pattern (two interleaved sine grids)
      const t = (Math.sin(x * 0.22) + Math.sin(y * 0.22)) * 0.5
      const weave = 1 + t * 0.045
      out[i] = Math.min(255, d[i] * weave)
      out[i + 1] = Math.min(255, d[i + 1] * weave)
      out[i + 2] = Math.min(255, d[i + 2] * weave)
      out[i + 3] = 255
    }
  }
  return out
}

/* Blocky mosaic on raw pixel data (used by the effects gallery thumbnails). */
export function pixelateData(d, w, h, size = 8) {
  const out = new Uint8ClampedArray(d.length)
  const s = Math.max(2, Math.round(size))
  for (let y = 0; y < h; y += s) {
    for (let x = 0; x < w; x += s) {
      let r = 0, g = 0, b = 0, n = 0
      for (let yy = y; yy < Math.min(h, y + s); yy++) {
        for (let xx = x; xx < Math.min(w, x + s); xx++) {
          const j = (yy * w + xx) * 4
          r += d[j]; g += d[j + 1]; b += d[j + 2]; n++
        }
      }
      r = r / n; g = g / n; b = b / n
      for (let yy = y; yy < Math.min(h, y + s); yy++) {
        for (let xx = x; xx < Math.min(w, x + s); xx++) {
          const j = (yy * w + xx) * 4
          out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = 255
        }
      }
    }
  }
  return out
}

/* -------------------- cinematic + print grades (v0.17.2) ------------------- */

/* Cyanotype — the classic blue alternative-process print. */
export function cyanotype(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const l = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]
    out[j] = Math.min(255, l * 0.18)
    out[j + 1] = Math.min(255, l * 0.42 + 18)
    out[j + 2] = Math.min(255, l * 0.85 + 40)
    out[j + 3] = 255
  }
  return out
}

/* Teal & Orange — blockbuster cinematic split: teal shadows, warm highlights. */
export function tealOrange(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    const s = 1 - l / 255 // shadow weight
    const hg = l / 255 // highlight weight
    out[j] = Math.min(255, Math.max(0, r + hg * 26 - s * 18))
    out[j + 1] = Math.min(255, Math.max(0, g + hg * 8 - s * 4))
    out[j + 2] = Math.min(255, Math.max(0, b + s * 34 - hg * 26))
    out[j + 3] = 255
  }
  return out
}

/* Cross Process — E-6 chemistry remix: cool shadows, warm highlights. */
export function crossProcess(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    out[j] = Math.min(255, Math.max(0, r * 1.06 + g * 0.12 - b * 0.06))
    out[j + 1] = Math.min(255, Math.max(0, g * 0.92 + b * 0.1))
    out[j + 2] = Math.min(255, Math.max(0, b * 1.18 - r * 0.08))
    out[j + 3] = 255
  }
  return out
}

/* Infrared — channel-swap dream: blues become warm, foliage glows. */
export function infrared(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    out[j] = Math.min(255, b * 1.15 + g * 0.1)
    out[j + 1] = Math.min(255, g * 0.85 + b * 0.2)
    out[j + 2] = Math.min(255, Math.max(0, r * 0.9 - 8))
    out[j + 3] = 255
  }
  return out
}

/* Red Pop / selective color — B&W except strong reds. */
export function colorPop(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    const isRed = r > 90 && r > g * 1.35 && r > b * 1.35
    if (isRed) {
      out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = 255
    } else {
      const l = 0.299 * r + 0.587 * g + 0.114 * b
      out[j] = l; out[j + 1] = l; out[j + 2] = l; out[j + 3] = 255
    }
  }
  return out
}

/* Ice Blue — cool arctic grade. */
export function ice(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    out[j] = Math.max(0, d[j] - 22)
    out[j + 1] = Math.max(0, d[j + 1] - 8)
    out[j + 2] = Math.min(255, d[j + 2] + 26)
    out[j + 3] = 255
  }
  return out
}

/* Sunset Glow — warm golden light. */
export function sunset(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const l = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]
    out[j] = Math.min(255, d[j] * 1.08 + 16)
    out[j + 1] = Math.min(255, d[j + 1] * 1.03 + 6)
    out[j + 2] = Math.min(255, Math.max(0, d[j + 2] - 14 + l * 0.05))
    out[j + 3] = 255
  }
  return out
}

/* Flat Matte — lifted blacks, muted colors (film still). */
export function matte(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    const m = l * 0.72 + 48
    out[j] = m + (r - l) * 0.25
    out[j + 1] = m + (g - l) * 0.25
    out[j + 2] = m + (b - l) * 0.25
    out[j + 3] = 255
  }
  return out
}

/* Noir — hard, contrasty black & white. */
export function noir(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const l = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]
    const c = Math.min(255, Math.max(0, (l - 118) * 1.55 + 128))
    out[j] = c; out[j + 1] = c; out[j + 2] = c; out[j + 3] = 255
  }
  return out
}

/* Bleach Bypass — silver halide: desaturated + high contrast + lifted. */
export function bleach(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    const c = Math.min(255, Math.max(0, (l - 108) * 1.32 + 122))
    out[j] = c + (r - l) * 0.22
    out[j + 1] = c + (g - l) * 0.22
    out[j + 2] = c + (b - l) * 0.22
    out[j + 3] = 255
  }
  return out
}

/* Lomo / Toy Camera — saturated, vignetted, slightly warm. */
export function lomo(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  const cx = (w - 1) / 2, cy = (h - 1) / 2
  const R = Math.hypot(cx, cy)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4
      const r = d[j], g = d[j + 1], b = d[j + 2]
      // saturate 1.25
      const l = 0.299 * r + 0.587 * g + 0.114 * b
      const sat = 1.22
      let nr = Math.min(255, l + (r - l) * sat)
      let ng = Math.min(255, l + (g - l) * sat)
      let nb = Math.min(255, l + (b - l) * sat)
      // warm
      nr = Math.min(255, nr * 1.04 + 8)
      nb = Math.max(0, nb - 8)
      // vignette
      const dist = Math.hypot(x - cx, y - cy) / R
      const v = 1 - Math.max(0, dist - 0.45) * 0.55
      out[j] = nr * v; out[j + 1] = ng * v; out[j + 2] = nb * v; out[j + 3] = 255
    }
  }
  return out
}

/* Pastel — soft, light, low saturation. */
export function pastel(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    const m = l * 0.55 + 92
    out[j] = m + (r - l) * 0.18
    out[j + 1] = m + (g - l) * 0.18
    out[j + 2] = m + (b - l) * 0.18
    out[j + 3] = 255
  }
  return out
}

/* Scanlines — retro CRT screen. */
export function scanlines(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++) {
    const line = (y % 2 === 0) ? 0.78 : 1
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4
      out[j] = d[j] * line
      out[j + 1] = d[j + 1] * line
      out[j + 2] = d[j + 2] * line
      out[j + 3] = 255
    }
  }
  return out
}

/* Ordered dithering — 4-level Bayer, newsprint-style. */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
export function dither(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4
      const l = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]
      const t = (l / 255) * 4
      const lo = Math.min(3, Math.floor(t))
      const frac = t - lo
      const thr = (BAYER4[(y % 4) * 4 + (x % 4)] + 0.5) / 16
      const level = frac > thr ? Math.min(3, lo + 1) : lo
      const v = Math.round((level / 3) * 255)
      out[j] = v; out[j + 1] = v; out[j + 2] = v; out[j + 3] = 255
    }
  }
  return out
}

/* Blueprint — white edge lines on deep blue (cyanotype × edges). */
export function blueprint(d, w, h) {
  const e = sobel(d, w, h)
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const edge = e[j] // sobel output is grayscale
    if (edge > 88) {
      out[j] = 235; out[j + 1] = 240; out[j + 2] = 255; out[j + 3] = 255
    } else {
      out[j] = 18; out[j + 1] = 58; out[j + 2] = 138; out[j + 3] = 255
    }
  }
  return out
}

/* --------------- commercial / product / interior grades (v0.17.8) ---------- */

/** Brighten speculars (highlights) only — makes shine pop. */
export function highlightBoost(d, w, h, amt = 0.45) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    const t = Math.max(0, (l - 150) / 105)
    const k = 1 + t * amt
    out[j] = Math.min(255, r * k); out[j + 1] = Math.min(255, g * k); out[j + 2] = Math.min(255, b * k); out[j + 3] = 255
  }
  return out
}

/** Matte finish — lifted blacks, muted color, capped highlights. */
export function matteFinish(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    const m = l * 0.78 + 42
    out[j] = Math.min(255, m + (r - l) * 0.55)
    out[j + 1] = Math.min(255, m + (g - l) * 0.55)
    out[j + 2] = Math.min(255, m + (b - l) * 0.55)
    out[j + 3] = 255
  }
  return out
}

/** Luxury grade — warm, rich, contrast + soft vignette. */
export function luxuryGrade(d, w, h) {
  const cx = (w - 1) / 2, cy = (h - 1) / 2, R = Math.hypot(cx, cy)
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4
      const r = d[j], g = d[j + 1], b = d[j + 2]
      const l = 0.299 * r + 0.587 * g + 0.114 * b
      const c = 1.13
      let nr = Math.min(255, (r - 128) * c + 128 + 10)
      let ng = Math.min(255, (g - 128) * c + 128 + 4)
      let nb = Math.min(255, Math.max(0, (b - 128) * c + 128 - 8))
      const avg = (nr + ng + nb) / 3
      const sat = 1.1
      nr = Math.min(255, avg + (nr - avg) * sat); ng = Math.min(255, avg + (ng - avg) * sat); nb = Math.min(255, avg + (nb - avg) * sat)
      const dist = Math.hypot(x - cx, y - cy) / R
      const v = 1 - Math.max(0, dist - 0.55) * 0.42
      out[j] = nr * v; out[j + 1] = ng * v; out[j + 2] = nb * v; out[j + 3] = 255
    }
  }
  return out
}

/** Brand-new product clean — despeckle + dehaze + gentle contrast. */
export function productClean(d, w, h) {
  const m = medianFilter(d, w, h, 1)
  const out = dehaze(m, w, h, 0.45)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    out[j] = Math.min(255, (out[j] - 128) * 1.08 + 128)
    out[j + 1] = Math.min(255, (out[j + 1] - 128) * 1.08 + 128)
    out[j + 2] = Math.min(255, (out[j + 2] - 128) * 1.08 + 128)
  }
  return out
}

/** Scratch / dust remover — stronger median. */
export function scratchRemove(d, w, h) { return medianFilter(d, w, h, 2) }

/** Fabric texture enhance — unsharp + a touch of color. */
export function fabricEnhance(d, w, h) {
  const blur = CONV_FILTERS.blur3(d, w, h)
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    for (let k = 0; k < 3; k++) out[j + k] = Math.min(255, Math.max(0, d[j + k] + (d[j + k] - blur[j + k]) * 1.15))
    const r = out[j], g = out[j + 1], b = out[j + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    out[j] = Math.min(255, l + (r - l) * 1.06)
    out[j + 1] = Math.min(255, l + (g - l) * 1.06)
    out[j + 2] = Math.min(255, l + (b - l) * 1.06)
    out[j + 3] = 255
  }
  return out
}

/** Denim pop — contrast + saturation. */
export function denimPop(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    let r = (d[j] - 128) * 1.18 + 128
    let g = (d[j + 1] - 128) * 1.18 + 128
    let b = (d[j + 2] - 128) * 1.18 + 128
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    r = l + (r - l) * 1.25; g = l + (g - l) * 1.25; b = l + (b - l) * 1.25
    out[j] = Math.min(255, Math.max(0, r)); out[j + 1] = Math.min(255, Math.max(0, g)); out[j + 2] = Math.min(255, Math.max(0, b)); out[j + 3] = 255
  }
  return out
}

/** Silk sheen — soft, satiny highlights. */
export function silkSheen(d, w, h) {
  const blur = CONV_FILTERS.blur3(d, w, h)
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    let r = d[j] * 0.45 + blur[j] * 0.55
    let g = d[j + 1] * 0.45 + blur[j + 1] * 0.55
    let b = d[j + 2] * 0.45 + blur[j + 2] * 0.55
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    r = l + (r - l) * 1.12; g = l + (g - l) * 1.12; b = l + (b - l) * 1.12
    out[j] = Math.min(255, r); out[j + 1] = Math.min(255, g); out[j + 2] = Math.min(255, b); out[j + 3] = 255
  }
  return highlightBoost(out, w, h, 0.35)
}

/** Metal shine — punchy contrast, bright speculars, slightly cool. */
export function metalShine(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    let r = (d[j] - 128) * 1.16 + 128 - 4
    let g = (d[j + 1] - 128) * 1.16 + 128 + 1
    let b = (d[j + 2] - 128) * 1.16 + 128 + 8
    out[j] = Math.min(255, Math.max(0, r)); out[j + 1] = Math.min(255, Math.max(0, g)); out[j + 2] = Math.min(255, Math.max(0, b)); out[j + 3] = 255
  }
  return highlightBoost(out, w, h, 0.5)
}

/** Diamond sparkle — sparkle + highlight lift. */
export function diamondSparkle(d, w, h) {
  return highlightBoost(sparkle(d, w, h, 0.5), w, h, 0.5)
}

/** Rich gold — warm metallic tone, saturated, glowing. */
export function goldRich(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    let nr = Math.min(255, r * 1.06 + 14)
    let ng = Math.min(255, g * 1.02 + 6)
    let nb = Math.max(0, b * 0.9 - 8)
    const l = 0.299 * nr + 0.587 * ng + 0.114 * nb
    const sat = 1.18
    nr = l + (nr - l) * sat; ng = l + (ng - l) * sat; nb = l + (nb - l) * sat
    out[j] = Math.min(255, nr); out[j + 1] = Math.min(255, ng); out[j + 2] = Math.min(255, nb); out[j + 3] = 255
  }
  return highlightBoost(out, w, h, 0.45)
}

/** Bright silver — cool, clean, desaturated highlights. */
export function silverBright(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    let v = l * 1.08
    out[j] = Math.min(255, v * 0.92 + 8)
    out[j + 1] = Math.min(255, v * 0.97 + 6)
    out[j + 2] = Math.min(255, v * 1.04 + 6)
    out[j + 3] = 255
  }
  return highlightBoost(out, w, h, 0.4)
}

/** Gemstone vibrance — rich saturation + contrast. */
export function gemVibrance(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    let r = (d[j] - 128) * 1.1 + 128
    let g = (d[j + 1] - 128) * 1.1 + 128
    let b = (d[j + 2] - 128) * 1.1 + 128
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    r = l + (r - l) * 1.35; g = l + (g - l) * 1.35; b = l + (b - l) * 1.35
    out[j] = Math.min(255, Math.max(0, r)); out[j + 1] = Math.min(255, Math.max(0, g)); out[j + 2] = Math.min(255, Math.max(0, b)); out[j + 3] = 255
  }
  return out
}

/** Glass gloss — bright speculars, slightly desaturated body. */
export function glassGloss(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = d[j], g = d[j + 1], b = d[j + 2]
    const l = 0.299 * r + 0.587 * g + 0.114 * b
    out[j] = Math.min(255, l + (r - l) * 0.92)
    out[j + 1] = Math.min(255, l + (g - l) * 0.92)
    out[j + 2] = Math.min(255, l + (b - l) * 0.92)
    out[j + 3] = 255
  }
  return highlightBoost(out, w, h, 0.6)
}

/** Room brighten — lift exposure + clear haze, natural. */
export function roomBrighten(d, w, h) {
  const out = dehaze(d, w, h, 0.4)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    out[j] = Math.min(255, out[j] * 1.14)
    out[j + 1] = Math.min(255, out[j + 1] * 1.14)
    out[j + 2] = Math.min(255, out[j + 2] * 1.14)
  }
  return out
}

/** Window light — brightens the upper part with a warm glow. */
export function windowLight(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++) {
    const t = 1 - y / h // 1 at top
    const k = 1 + t * 0.28
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4
      out[j] = Math.min(255, d[j] * k + t * 14)
      out[j + 1] = Math.min(255, d[j + 1] * k + t * 6)
      out[j + 2] = Math.min(255, d[j + 2] * k)
      out[j + 3] = 255
    }
  }
  return out
}

/** Floor clean — despeckle + brighten. */
export function floorClean(d, w, h) {
  const m = medianFilter(d, w, h, 1)
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    out[j] = Math.min(255, m[j] * 1.08)
    out[j + 1] = Math.min(255, m[j + 1] * 1.08)
    out[j + 2] = Math.min(255, m[j + 2] * 1.08)
    out[j + 3] = 255
  }
  return out
}

/** Luxury interior — warm grade + deeper vignette. */
export function interiorLux(d, w, h) {
  return vignette(luxuryGrade(d, w, h), w, h, 0.3)
}

/** Catalog / advertising grade — matte + sharpen + contrast. */
export function adGrade(d, w, h) {
  const m = matteFinish(d, w, h)
  const s = CONV_FILTERS.sharpenMore(m, w, h)
  const out = new Uint8ClampedArray(s.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    out[j] = Math.min(255, (s[j] - 128) * 1.08 + 128)
    out[j + 1] = Math.min(255, (s[j + 1] - 128) * 1.08 + 128)
    out[j + 2] = Math.min(255, (s[j + 2] - 128) * 1.08 + 128)
    out[j + 3] = 255
  }
  return out
}

/** Smooth fabric — gentle blur + median for garment creases/lint. */
export function clothSmooth(d, w, h) {
  const m = medianFilter(d, w, h, 1)
  const blur = CONV_FILTERS.blur3(m, w, h)
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    out[j] = m[j] * 0.72 + blur[j] * 0.28
    out[j + 1] = m[j + 1] * 0.72 + blur[j + 1] * 0.28
    out[j + 2] = m[j + 2] * 0.72 + blur[j + 2] * 0.28
    out[j + 3] = 255
  }
  return out
}

/** Spot/stain cleaner — median + light soften. */
export function spotCleaner(d, w, h) {
  const m = medianFilter(d, w, h, 2)
  const blur = CONV_FILTERS.blur3(m, w, h)
  const out = new Uint8ClampedArray(d.length)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    out[j] = m[j] * 0.8 + blur[j] * 0.2
    out[j + 1] = m[j + 1] * 0.8 + blur[j + 1] * 0.2
    out[j + 2] = m[j + 2] * 0.8 + blur[j + 2] * 0.2
    out[j + 3] = 255
  }
  return out
}
