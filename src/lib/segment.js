// REAL subject/background segmentation (AI audit capability #1).
// MediaPipe Selfie Segmentation — a genuine content-aware matting model that
// runs fully in-browser via WASM. Model + wasm are self-hosted in
// /mediapipe/ so no runtime CDN is required.
//
// This replaces the old deterministic "edge brighten + checkerboard" trick
// with a true alpha matte of the subject.

import { loadImageElement } from './utils'

const base = import.meta.env.BASE_URL
let segPromise = null

// MediaPipe is imported lazily (code-split) so it doesn't load until the
// first segmentation — keeps the initial bundle small.
async function createSegmenter() {
  const { SelfieSegmentation } = await import('@mediapipe/selfie_segmentation')
  return new Promise((resolve, reject) => {
    const seg = new SelfieSegmentation({
      locateFile: (file) => `${base}mediapipe/${file}`,
    })
    seg.setOptions({ modelSelection: 1, selfieMode: false })
    seg.onResults(() => {})
    const t = setTimeout(() => reject(new Error('Segmenter load timeout')), 60000)
    seg.initialize()
      .then(() => {
        clearTimeout(t)
        resolve(seg)
      })
      .catch((e) => {
        clearTimeout(t)
        reject(e)
      })
  })
}

/** Lazily created singleton — first call downloads/initializes the model. */
export function getSegmenter() {
  if (!segPromise) segPromise = createSegmenter()
  return segPromise
}

/** One-shot segmentation; resolves with the solution's results object. */
function segmentOnce(seg, img) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Segmentation timeout')), 60000)
    seg.onResults((results) => {
      clearTimeout(t)
      resolve(results)
    })
    seg.send({ image: img }).catch((e) => {
      clearTimeout(t)
      reject(e)
    })
  })
}

/**
 * Segment the subject; returns source canvas, binary mask and coverage.
 * Used by makeCutout, smart crop and layer decomposition.
 */
export async function segmentImage(src, { maxSize = 1024 } = {}) {
  const seg = await getSegmenter()
  const img = await loadImageElement(src)
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(2, Math.round(img.naturalWidth * scale))
  const h = Math.max(2, Math.round(img.naturalHeight * scale))

  const srcCv = document.createElement('canvas')
  srcCv.width = w
  srcCv.height = h
  const sctx = srcCv.getContext('2d', { willReadFrequently: true })
  sctx.drawImage(img, 0, 0, w, h)

  const results = await segmentOnce(seg, srcCv)
  const mask = results.segmentationMask

  // Normalize the mask into a canvas we can read pixels from.
  let mCv
  if (mask instanceof HTMLCanvasElement) mCv = mask
  else {
    mCv = document.createElement('canvas')
    mCv.width = w
    mCv.height = h
    mCv.getContext('2d').drawImage(mask, 0, 0, w, h)
  }
  const mctx = mCv.getContext('2d', { willReadFrequently: true })
  const mdata = mctx.getImageData(0, 0, mCv.width, mCv.height).data

  const maskData = new Uint8Array(w * h)
  let covered = 0
  for (let i = 0; i < w * h; i++) {
    const a = mdata[i * 4 + 3] / 255
    if (a > 0.6) { maskData[i] = 1; covered++ }
  }

  return { srcCv, sctx, w, h, scale, mask: { data: maskData, w, h }, coverage: covered / (w * h) }
}

/**
 * Produce a true transparent-background cutout of the subject.
 * Returns { dataUrl, width, height, coverage } where coverage is the fraction
 * of pixels classified as subject (0..1) — used to detect "no subject".
 */
export async function makeCutout(src, { maxSize = 1024 } = {}) {
  const { srcCv, sctx, w, h, mask, coverage } = await segmentImage(src, { maxSize })
  const out = sctx.getImageData(0, 0, w, h)
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i + 3] = Math.round(out.data[i + 3] * mask.data[i / 4])
  }
  sctx.putImageData(out, 0, 0)
  return { dataUrl: srcCv.toDataURL('image/png'), width: w, height: h, coverage }
}

/** Subject bounding box in natural pixels (for smart crop). Returns null if no subject. */
export async function subjectBBox(src, { maxSize = 640 } = {}) {
  const { mask, scale } = await segmentImage(src, { maxSize })
  const m = mask.data
  let minX = mask.w, minY = mask.h, maxX = -1, maxY = -1
  for (let y = 0; y < mask.h; y++) {
    for (let x = 0; x < mask.w; x++) {
      if (m[y * mask.w + x]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  const inv = 1 / scale
  return {
    x: Math.round(minX * inv), y: Math.round(minY * inv),
    w: Math.round((maxX - minX + 1) * inv), h: Math.round((maxY - minY + 1) * inv),
  }
}

/**
 * Composite a cutout onto a chosen background (AI capability #4).
 * mode: 'black' | 'white' | 'gradient' | 'transparent'
 * Returns a flattened dataUrl.
 */
export function compositeOnBackground(cutoutDataUrl, { w, h, mode }) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')

  if (mode === 'black') {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, h)
  } else if (mode === 'white') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  } else if (mode === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#101010')
    g.addColorStop(1, '#3d3d3d')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
  // 'transparent' → leave the base empty (checkerboard shows in the UI)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h)
      resolve(cv.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = cutoutDataUrl
  })
}
