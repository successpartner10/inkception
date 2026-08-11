// src/lib/classify.js
// Photo-type detection — runs 100% on-device on a small downscaled copy.
// The goal: show only the Actions that apply to what's actually in the
// image (face/portrait vs product vs landscape vs document vs general),
// so the catalog stays relevant. Honest heuristic + user-overridable.

export const PHOTO_TYPES = [
  { id: 'auto', label: 'Auto' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'product', label: 'Product' },
  { id: 'landscape', label: 'Scene' },
  { id: 'document', label: 'Document' },
  { id: 'all', label: 'All' },
]

export const TYPE_LABEL = {
  portrait: 'Portrait / Face',
  product: 'Product',
  landscape: 'Scene / Landscape',
  document: 'Document / Plan',
  generic: 'General',
}

function load(src) {
  return new Promise((res, rej) => {
    const im = new Image()
    im.onload = () => res(im)
    im.onerror = rej
    im.src = src
  })
}

/**
 * Analyze pixels → { type, person, skinRatio, satAvg, brightAvg, edgeDensity,
 * whiteRatio, label }. Fast: max ~180px working size.
 */
export async function classifyImage(src) {
  const img = await load(src)
  const S = 180
  const scale = Math.min(1, S / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
  const w = Math.max(8, Math.round((img.naturalWidth || 1) * scale))
  const h = Math.max(8, Math.round((img.naturalHeight || 1) * scale))
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data

  let skin = 0, satSum = 0, lumSum = 0, white = 0, total = 0
  // edge density via simple luminance gradient
  let edge = 0
  const lum = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const j = i * 4
    const r = data[j], g = data[j + 1], b = data[j + 2]
    const L = 0.299 * r + 0.587 * g + 0.114 * b
    lum[i] = L
    lumSum += L
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    satSum += mx === 0 ? 0 : (mx - mn) / mx
    if (r > 235 && g > 235 && b > 235) white++
    // classic skin-tone test (YUV-ish heuristic)
    if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15 && r - b > 15) skin++
    total++
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx = Math.abs(lum[i + 1] - lum[i - 1])
      const gy = Math.abs(lum[i + w] - lum[i - w])
      if (gx + gy > 60) edge++
    }
  }
  const edgeDensity = edge / ((w - 2) * (h - 2))
  const skinRatio = skin / total
  const satAvg = satSum / total
  const brightAvg = lumSum / total / 255
  const whiteRatio = white / total

  // person/portrait — skin coverage is a solid free proxy
  const person = skinRatio > 0.10

  // product vs scene: object in the centre, cleaner border ring
  let centerEdge = 0, borderEdge = 0, cn = 0, bn = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const inBorder = x < w * 0.14 || x > w * 0.86 || y < h * 0.14 || y > h * 0.86
      const e = lum[i] > 0 ? Math.abs(lum[i] - (lum[Math.min(h - 1, y + 1) * w + x] || lum[i])) : 0
      if (inBorder) { borderEdge += e; bn++ } else { centerEdge += e; cn++ }
    }
  }
  const ce = cn ? centerEdge / cn : 0
  const be = bn ? borderEdge / bn : 0

  let type = 'generic'
  if (person) type = 'portrait'
  // document only when confident: lots of clean white paper + dark line work
  else if (whiteRatio > 0.42 && edgeDensity > 0.06) type = 'document'
  // product: distinct object on a clean surrounding (mono or color OK)
  else if (ce > be * 1.35 && ce > 0.04 && whiteRatio < 0.65 && (satAvg > 0.08 || brightAvg > 0.28)) type = 'product'
  // landscape: bright, colorful, busy edges
  else if (edgeDensity > 0.05 && satAvg > 0.14 && brightAvg > 0.38) type = 'landscape'
  // otherwise generic → show ALL actions (honest: not confident)

  return {
    type,
    person,
    skinRatio,
    satAvg,
    brightAvg,
    edgeDensity,
    whiteRatio,
    label: TYPE_LABEL[type] || TYPE_LABEL.generic,
  }
}
