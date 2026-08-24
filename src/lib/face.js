// src/lib/face.js
// REAL face detection (BlazeFace, MediaPipe Face Detection) — runs fully
// in-browser via WASM, self-hosted in /mediapipe/ (same privacy story as
// the selfie segmentation model — nothing leaves the device).
//
// Powers: face layer extraction (Decompose) and "Face" auto-focus in
// framed photos (template face frames).

import { loadImageElement } from './utils'

const base = import.meta.env.BASE_URL
let fdPromise = null

// MediaPipe is imported lazily (code-split) so it doesn't load until the
// first face detection — keeps the initial bundle small.
async function createDetector() {
  const { FaceDetection } = await import('@mediapipe/face_detection')
  return new Promise((resolve, reject) => {
    const fd = new FaceDetection({ locateFile: (file) => `${base}mediapipe/${file}` })
    fd.setOptions({ model: 'short', minDetectionConfidence: 0.5 })
    fd.onResults(() => {})
    const t = setTimeout(() => reject(new Error('Face detector load timeout')), 60000)
    fd.initialize()
      .then(() => { clearTimeout(t); resolve(fd) })
      .catch((e) => { clearTimeout(t); reject(e) })
  })
}

export function getFaceDetector() {
  if (!fdPromise) fdPromise = createDetector()
  return fdPromise
}

/**
 * Detect the primary face in an image.
 * Resolves with { x, y, w, h, cx, cy, score } in NATURAL image pixels,
 * or null when no face is found. Never rejects for "no face" — only for
 * genuine failures (model load etc.), which callers may catch and ignore.
 */
export async function detectFaceBox(src) {
  const fd = await getFaceDetector()
  const img = await loadImageElement(src)
  const results = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Face detection timeout')), 60000)
    fd.onResults((r) => { clearTimeout(t); resolve(r) })
    fd.send({ image: img }).catch((e) => { clearTimeout(t); reject(e) })
  })
  const dets = results && results.detections
  if (!dets || !dets.length) return null
  // highest score first (MediaPipe usually returns them sorted already)
  const det = dets.reduce((a, b) => ((b.score ?? 0) >= (a.score ?? 0) ? b : a))
  const bb = det.boundingBox || {}
  const W = img.naturalWidth || img.width
  const H = img.naturalHeight || img.height
  // MediaPipe JS solution returns normalized box keys in mixed casing —
  // handle every layout defensively.
  const cxN = bb.xCenter ?? bb.xcenter ?? bb.centerX ?? (bb.originX ?? 0) + (bb.width ?? 0) / 2
  const cyN = bb.yCenter ?? bb.ycenter ?? bb.centerY ?? (bb.originY ?? 0) + (bb.height ?? 0) / 2
  const wN = bb.width ?? 0
  const hN = bb.height ?? 0
  if (!wN || !hN) return null
  const cx = cxN * W
  const cy = cyN * H
  const w = wN * W
  const h = hN * H
  return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy, score: det.score ?? null, natW: W, natH: H }
}
