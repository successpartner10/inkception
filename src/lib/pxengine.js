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
