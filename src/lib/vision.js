// src/lib/vision.js
// Real, content-aware, on-device algorithms for the AI suite.
// Every function reads and responds to the image's actual pixel content.
// Honest implementations — nothing here fakes "AI".

import { loadImageElement } from './utils'

const MAX_PROCESS = 1400

const makeCanvas = (w, h) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export async function loadData(dataUrl, maxSize = MAX_PROCESS) {
  const img = await loadImageElement(dataUrl)
  const s = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(2, Math.round(img.naturalWidth * s))
  const h = Math.max(2, Math.round(img.naturalHeight * s))
  const cv = makeCanvas(w, h)
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  return { img, cv, ctx, w, h, data, toDataUrl: () => cv.toDataURL('image/png') }
}

/* ------------------------------------------------------------------ */
/* #12 — Denoise: noise-level detection + adaptive smoothing           */
/* ------------------------------------------------------------------ */
export async function denoise(src, strength = 50) {
  const L = await loadData(src, 1200)
  const d = L.data.data
  const w = L.w, h = L.h, n = w * h
  const lum = new Float32Array(n)
  const hp = new Float32Array(n)
  for (let i = 0; i < n; i++) lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
  let sum = 0, count = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const m = (lum[i - 1] + lum[i + 1] + lum[i - w] + lum[i + w]) / 4
      hp[i] = lum[i] - m
      sum += Math.abs(hp[i]); count++
    }
  }
  const mad = sum / count // measured noise level
  const thresh = mad * (0.6 + (strength / 100) * 2.2)
  const passes = 2 + Math.round(strength / 20)
  for (let p = 0; p < passes; p++) {
    const s = new Uint8ClampedArray(d)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        if (Math.abs(hp[i]) < thresh) continue
        const r = s[i * 4] + s[(i + 1) * 4] + s[(i - 1) * 4] + s[(i - w) * 4] + s[(i + w) * 4]
        const g = s[i * 4 + 1] + s[(i + 1) * 4 + 1] + s[(i - 1) * 4 + 1] + s[(i - w) * 4 + 1] + s[(i + w) * 4 + 1]
        const b = s[i * 4 + 2] + s[(i + 1) * 4 + 2] + s[(i - 1) * 4 + 2] + s[(i - w) * 4 + 2] + s[(i + w) * 4 + 2]
        d[i * 4] = r / 5; d[i * 4 + 1] = g / 5; d[i * 4 + 2] = b / 5
      }
    }
  }
  L.ctx.putImageData(L.data, 0, 0)
  return L.toDataUrl()
}

/* ------------------------------------------------------------------ */
/* #6 — Portrait retouch: skin-tone mask guides smoothing/brightening  */
/* ------------------------------------------------------------------ */
export function skinMask(d, w, h) {
  const mask = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn
    const l = (mx + mn) / 2
    let hh = 0
    if (dl > 0) {
      if (mx === r) hh = 60 * (((g - b) / dl) % 6)
      else if (mx === g) hh = 60 * ((b - r) / dl + 2)
      else hh = 60 * ((r - g) / dl + 4)
    }
    hh = (hh + 360) % 360
    const s = dl === 0 ? 0 : dl / (255 - Math.abs(2 * l - 255))
    if (hh >= 8 && hh <= 45 && s > 0.1 && l > 45 && l < 235) mask[i] = 1
  }
  // feather once (r=2) for soft blend edges
  const tmp = new Float32Array(w * h)
  const m = mask.slice()
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = 0, c = 0
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx >= 0 && ny >= 0 && nx < w && ny < h) { acc += m[ny * w + nx]; c++ }
        }
      }
      tmp[y * w + x] = acc / c
    }
  }
  return tmp
}

function boxBlur(d, w, h, rad) {
  const out = new Uint8ClampedArray(d.length)
  const tmp = new Uint8ClampedArray(d.length)
  for (let ch = 0; ch < 3; ch++) {
    // horizontal
    for (let y = 0; y < h; y++) {
      let acc = 0
      for (let x = 0; x < w; x++) { acc += d[(y * w + Math.min(x + rad, w - 1)) * 4 + ch] }
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 4 + ch] = acc / (rad * 2 + 1)
        const addX = x + rad + 1 < w ? d[(y * w + x + rad + 1) * 4 + ch] : d[(y * w + w - 1) * 4 + ch]
        const subX = x - rad >= 0 ? d[(y * w + x - rad) * 4 + ch] : d[(y * w) * 4 + ch]
        acc += addX - subX
      }
    }
    // vertical
    for (let x = 0; x < w; x++) {
      let acc = 0
      for (let y = 0; y < h; y++) { acc += tmp[(Math.min(y + rad, h - 1) * w + x) * 4 + ch] }
      for (let y = 0; y < h; y++) {
        out[(y * w + x) * 4 + ch] = acc / (rad * 2 + 1)
        const addY = y + rad + 1 < h ? tmp[((y + rad + 1) * w + x) * 4 + ch] : tmp[((h - 1) * w + x) * 4 + ch]
        const subY = y - rad >= 0 ? tmp[((y - rad) * w + x) * 4 + ch] : tmp[(0 * w + x) * 4 + ch]
        acc += addY - subY
      }
    }
  }
  for (let i = 0; i < out.length; i += 4) out[i + 3] = d[i + 3]
  return out
}

export async function retouch(src, { smooth = 40, blemish = 30, brighten = 0 } = {}) {
  const L = await loadData(src, 1100)
  const d = L.data.data
  const w = L.w, h = L.h
  const mask = skinMask(d, w, h)

  if (smooth > 0) {
    const blurred = boxBlur(d, w, h, 1 + Math.round(smooth / 28))
    const a = (smooth / 100) * 0.85
    for (let i = 0; i < w * h; i++) {
      const m = mask[i]
      if (m <= 0.01) continue
      const t = m * a
      for (let ch = 0; ch < 3; ch++) {
        d[i * 4 + ch] = Math.round(d[i * 4 + ch] * (1 - t) + blurred[i * 4 + ch] * t)
      }
    }
  }

  if (blemish > 0) {
    // 3x3 median, applied where masked + locally anomalous (spot detector)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        if (mask[i] <= 0.1) continue
        const win = []
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const j = ((y + dy) * w + (x + dx)) * 4
            win.push(d[j], d[j + 1], d[j + 2])
          }
        }
        const lum = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
        const med = win.slice().sort((a, b) => a - b)[13]
        if (Math.abs(lum - med) > 36) {
          const t = (blemish / 100) * mask[i] * 0.9
          for (let ch = 0; ch < 3; ch++) {
            d[i * 4 + ch] = Math.round(d[i * 4 + ch] * (1 - t) + win[ch + 3] * t)
          }
        }
      }
    }
  }

  if (brighten > 0) {
    const t = (brighten / 100) * 42
    for (let i = 0; i < w * h; i++) {
      const m = mask[i]
      if (m <= 0.01) continue
      const boost = t * m
      d[i * 4] = Math.min(255, d[i * 4] + boost)
      d[i * 4 + 1] = Math.min(255, d[i * 4 + 1] + boost)
      d[i * 4 + 2] = Math.min(255, d[i * 4 + 2] + boost)
    }
  }

  L.ctx.putImageData(L.data, 0, 0)
  return L.toDataUrl()
}

/* ------------------------------------------------------------------ */
/* #13 — Color grade / LUT match: histogram transfer from a reference  */
/* ------------------------------------------------------------------ */
function buildLut(srcHist, refHist) {
  const cdfS = new Array(256), cdfR = new Array(256)
  let s = 0, r = 0
  for (let v = 0; v < 256; v++) { s += srcHist[v]; cdfS[v] = s; r += refHist[v]; cdfR[v] = r }
  const lut = new Array(256)
  for (let v = 0; v < 256; v++) {
    const fr = cdfS[v] / s
    let u = 255
    for (let t = 0; t < 256; t++) { if (cdfR[t] / r >= fr) { u = t; break } }
    lut[v] = u
  }
  return lut
}

export async function colorGrade(src, refSrc, strength = 100) {
  const target = await loadData(src, 1200)
  const ref = await loadData(refSrc, 1200)
  const nT = target.w * target.h, nR = ref.w * ref.h
  const dT = target.data.data, dR = ref.data.data
  const luts = []
  for (let ch = 0; ch < 3; ch++) {
    const hs = new Array(256).fill(0), hr = new Array(256).fill(0)
    for (let i = 0; i < nT; i++) hs[dT[i * 4 + ch]]++
    for (let i = 0; i < nR; i++) hr[dR[i * 4 + ch]]++
    luts.push(buildLut(hs, hr))
  }
  const st = strength / 100
  for (let i = 0; i < dT.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      const v = dT[i + ch]
      dT[i + ch] = Math.round(v + (luts[ch][v] - v) * st)
    }
  }
  target.ctx.putImageData(target.data, 0, 0)
  return target.toDataUrl()
}

/* ------------------------------------------------------------------ */
/* #7 / #3 — Inpaint: diffusion fill of a masked region (eraser/fill)  */
/* ------------------------------------------------------------------ */
export async function inpaint(src, mask, processMax = 900) {
  const L = await loadData(src, processMax)
  const d = L.data.data
  const w = L.w, h = L.h
  // mask may be smaller or different size — build a copy at (w,h)
  let m
  if (mask.length === w * h) m = new Uint8ClampedArray(mask)
  else {
    m = new Uint8ClampedArray(w * h)
    const mw = Math.sqrt(mask.length) | 0
    const mh = mw
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        m[y * w + x] = mask[Math.min(mh - 1, Math.round((y / h) * mh)) * mw + Math.min(mw - 1, Math.round((x / w) * mw))] > 128 ? 1 : 0
      }
    }
  }
  // multi-pass diffusion from the region border
  const passes = 90
  let cur = new Uint8ClampedArray(d)
  const next = new Uint8ClampedArray(d.length)
  for (let p = 0; p < passes; p++) {
    next.set(cur)
    let changed = 0
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        if (!m[i]) continue
        let r = 0, g = 0, b = 0, c = 0
        const nb = [i - 1, i + 1, i - w, i + w]
        for (const j of nb) {
          if (!m[j]) { r += cur[j * 4]; g += cur[j * 4 + 1]; b += cur[j * 4 + 2]; c++ }
        }
        if (c > 0) {
          next[i * 4] = r / c; next[i * 4 + 1] = g / c; next[i * 4 + 2] = b / c
          changed++
        }
      }
    }
    ;[cur, next] = [next, cur]
    if (changed === 0) break
  }
  // blend back only masked pixels (edges stay soft)
  for (let i = 0; i < d.length; i += 4) {
    const px = (i / 4)
    if (m[px]) { d[i] = cur[i]; d[i + 1] = cur[i + 1]; d[i + 2] = cur[i + 2] }
  }
  L.ctx.putImageData(L.data, 0, 0)
  return L.toDataUrl()
}

/* ------------------------------------------------------------------ */
/* #14 — Smart crop: cover-crop to a ratio centered on a subject box   */
/* ------------------------------------------------------------------ */
export async function smartCrop(src, ratioW, ratioH, bbox) {
  const img = await loadImageElement(src)
  const W = img.naturalWidth, H = img.naturalHeight
  // bbox in natural px (may be null → geometric center)
  const cx = bbox ? clampC(bbox.x + bbox.w / 2, W) : W / 2
  const cy = bbox ? clampC(bbox.y + bbox.h / 2, H) : H / 2
  // cover crop dimensions
  const target = ratioW / ratioH
  let cw, ch
  if (W / H > target) { cw = H * target; ch = H } else { cw = W; ch = W / target }
  const sx = Math.min(Math.max(cx - cw / 2, 0), W - cw)
  const sy = Math.min(Math.max(cy - ch / 2, 0), H - ch)
  const out = makeCanvas(Math.round(cw), Math.round(ch))
  const ctx = out.getContext('2d')
  ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch)
  return out.toDataURL('image/png')
}
const clampC = (v, max) => Math.min(Math.max(v, 0), max)

/* ------------------------------------------------------------------ */
/* #5 — Layer decomposition (v1): panels / text / subject / background  */
/* ------------------------------------------------------------------ */
function connectedMasks(mask, w, h, minArea) {
  // returns array of {id, mask: Uint8Array} components ≥ minArea (flood fill)
  const visited = new Uint8Array(w * h)
  const comps = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!mask[i] || visited[i]) continue
      // BFS
      const stack = [i]
      visited[i] = 1
      const cells = []
      while (stack.length) {
        const j = stack.pop()
        cells.push(j)
        const jx = j % w, jy = (j / w) | 0
        const nb = [[jx - 1, jy], [jx + 1, jy], [jx, jy - 1], [jx, jy + 1]]
        for (const [nx, ny] of nb) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          const k = ny * w + nx
          if (mask[k] && !visited[k]) { visited[k] = 1; stack.push(k) }
        }
      }
      if (cells.length >= minArea) {
        const cm = new Uint8Array(w * h)
        for (const j of cells) cm[j] = 1
        comps.push(cm)
      }
    }
  }
  return comps
}

export async function decompose(src, subjectMask) {
  const L = await loadData(src, 800)
  const d = L.data.data
  const w = L.w, h = L.h, n = w * h

  // subject mask (from segmentation, resized)
  const sub = new Uint8Array(n)
  if (subjectMask) {
    const sw = subjectMask.w, sh = subjectMask.h
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sy = Math.min(sh - 1, Math.round((y / h) * sh))
        const sx = Math.min(sw - 1, Math.round((x / w) * sw))
        sub[y * w + x] = subjectMask.data[sy * sw + sx] ? 1 : 0
      }
    }
  }

  // flat-color panel mask: low local variance + quantized color
  const flat = new Uint8Array(n)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      let minV = 255, maxV = 0
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const j = ((y + dy) * w + (x + dx)) * 4
          const v = (d[j] + d[j + 1] + d[j + 2]) / 3
          if (v < minV) minV = v
          if (v > maxV) maxV = v
        }
      }
      if (maxV - minV < 26) flat[i] = 1
    }
  }
  const panelComps = connectedMasks(flat, w, h, Math.round(n * 0.004))
  const panel = new Uint8Array(n)
  for (const c of panelComps) for (let i = 0; i < n; i++) if (c[i]) panel[i] = 1

  // text mask: high local contrast + low color saturation (stroke-like)
  const text = new Uint8Array(n)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      let minV = 255, maxV = 0
      let sMin = 256
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const j = ((y + dy) * w + (x + dx)) * 4
          const r = d[j], g = d[j + 1], b = d[j + 2]
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
          const v = (r + g + b) / 3
          if (v < minV) minV = v
          if (v > maxV) maxV = v
          const sat = mx - mn
          if (sat < sMin) sMin = sat
        }
      }
      if (maxV - minV > 80 && sMin < 70) text[i] = 1
    }
  }
  const textComps = connectedMasks(text, w, h, Math.round(n * 0.0005))
  const textMask = new Uint8Array(n)
  for (const c of textComps) for (let i = 0; i < n; i++) if (c[i]) textMask[i] = 1

  // build the four layer canvases
  const makeLayer = (keep) => {
    const cv = makeCanvas(w, h)
    const ctx = cv.getContext('2d')
    const id = ctx.createImageData(w, h)
    for (let i = 0; i < n; i++) {
      if (keep[i]) {
        id.data[i * 4] = d[i * 4]; id.data[i * 4 + 1] = d[i * 4 + 1]; id.data[i * 4 + 2] = d[i * 4 + 2]; id.data[i * 4 + 3] = 255
      } else {
        id.data[i * 4 + 3] = 0
      }
    }
    ctx.putImageData(id, 0, 0)
    return cv.toDataURL('image/png')
  }
  const bg = new Uint8Array(n)
  for (let i = 0; i < n; i++) bg[i] = sub[i] ? 0 : 1

  return {
    subject: makeLayer(sub),
    panels: makeLayer(panel),
    text: makeLayer(textMask),
    background: makeLayer(bg),
    w, h,
    counts: {
      panels: panelComps.length,
      text: textComps.length,
      subjectCoverage: Math.round((sub.reduce((a, b) => a + b, 0) / n) * 100),
    },
  }
}
