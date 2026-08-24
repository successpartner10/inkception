// src/lib/textdetect.js
// REAL text detection for layer extraction — OCR word boxes via
// tesseract.js (WebAssembly, runs entirely in the browser; the engine +
// English model download once, on first use, from the CDN and are then
// cached by the browser — no image data is ever uploaded).
//
// Returns clean text-region boxes (merged into blocks) in natural pixels.
// If OCR is unavailable (offline / blocked), callers fall back to the
// built-in heuristic text detector — Decompose still works, just less
// precisely.

import { loadImageElement } from './utils'

let workerPromise = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      const w = await createWorker('eng')
      return w
    })().catch((e) => {
      workerPromise = null // allow retry next time
      throw e
    })
  }
  return workerPromise
}

/**
 * Detect text regions. Returns an array of BLOCK boxes
 * [{ x, y, w, h, text, conf }] in natural image pixels — nearby words are
 * merged into a single block (that's one movable text element).
 * Returns [] when nothing readable is found or OCR is unavailable.
 */
export async function detectTextBlocks(src, { maxSize = 1100, minConfidence = 40 } = {}) {
  let worker
  try {
    worker = await getWorker()
  } catch {
    return []
  }
  const img = await loadImageElement(src)
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(2, Math.round(img.naturalWidth * scale))
  const h = Math.max(2, Math.round(img.naturalHeight * scale))
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  cv.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, w, h)

  let words
  try {
    const { data } = await worker.recognize(cv)
    words = (data && data.words) || []
  } catch {
    return []
  }

  const good = words
    .filter((wd) => (wd.confidence ?? 0) >= minConfidence && typeof wd.text === 'string' && wd.text.trim().length > 0)
    .map((wd) => {
      const b = wd.bbox // {x1,y1,x2,y2} in OCR-canvas px
      return {
        x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2,
        text: wd.text.trim(),
        conf: wd.confidence ?? 0,
      }
    })
  if (!good.length) return []

  // ---- merge nearby words into blocks (lines → paragraphs) ----
  // Two words join when their boxes are within ~0.9 of a line-height
  // vertically and ~1.2 line-heights horizontally.
  const blocks = []
  const used = new Array(good.length).fill(false)
  for (let i = 0; i < good.length; i++) {
    if (used[i]) continue
    used[i] = true
    const group = [good[i]]
    let grew = true
    while (grew) {
      grew = false
      const g = group[group.length - 1]
      const gh = Math.max(8, (g.y2 - g.y1) || 8)
      for (let j = 0; j < good.length; j++) {
        if (used[j]) continue
        const wd = good[j]
        const wh = Math.max(8, (wd.y2 - wd.y1) || 8)
        const lh = Math.max(gh, wh)
        const vGap = Math.max(g.y1, wd.y1) - Math.min(g.y2, wd.y2) // negative = overlap
        const hGap = Math.max(g.x1, wd.x1) - Math.min(g.x2, wd.x2)
        const vOk = vGap < lh * 0.6
        const hOk = hGap < lh * 1.6
        const vOverlapOk = Math.min(g.y2, wd.y2) - Math.max(g.y1, wd.y1) > lh * 0.25
        if (vOk && hOk && (vOverlapOk || Math.abs(vGap) < lh * 0.9)) {
          group.push(wd)
          used[j] = true
          grew = true
          break
        }
      }
    }
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, text = []
    for (const wd of group) {
      x1 = Math.min(x1, wd.x1); y1 = Math.min(y1, wd.y1)
      x2 = Math.max(x2, wd.x2); y2 = Math.max(y2, wd.y2)
      text.push(wd.text)
    }
    blocks.push({ x: x1, y: y1, w: x2 - x1, h: y2 - y1, text: text.join(' '), conf: group[0].conf })
  }

  // upscale back to natural pixels
  const inv = 1 / scale
  return blocks
    .map((b) => ({ ...b, x: b.x * inv, y: b.y * inv, w: b.w * inv, h: b.h * inv }))
    .filter((b) => b.w > 4 && b.h > 4)
    .sort((a, b) => b.w * b.h - a.w * a.h)
}
