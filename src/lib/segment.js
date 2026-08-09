// REAL subject/background segmentation (AI audit capability #1).
// MediaPipe Selfie Segmentation — a genuine content-aware matting model that
// runs fully in-browser via WASM. Model + wasm are self-hosted in
// /mediapipe/ so no runtime CDN is required.
//
// This replaces the old deterministic "edge brighten + checkerboard" trick
// with a true alpha matte of the subject.

import { SelfieSegmentation } from '@mediapipe/selfie_segmentation'
import { loadImageElement } from './utils'

const base = import.meta.env.BASE_URL
let segPromise = null

function createSegmenter() {
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
 * Produce a true transparent-background cutout of the subject.
 * Returns { dataUrl, width, height, coverage } where coverage is the fraction
 * of pixels classified as subject (0..1) — used to detect "no subject".
 */
export async function makeCutout(src, { maxSize = 1024 } = {}) {
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

  // Apply mask alpha to the source image → true cutout with soft edges.
  const out = sctx.getImageData(0, 0, w, h)
  let covered = 0
  for (let i = 0; i < out.data.length; i += 4) {
    const a = mdata[i + 3] / 255
    out.data[i + 3] = Math.round(out.data[i + 3] * a)
    if (a > 0.6) covered++
  }
  sctx.putImageData(out, 0, 0)

  return {
    dataUrl: srcCv.toDataURL('image/png'),
    width: w,
    height: h,
    coverage: covered / (w * h),
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
