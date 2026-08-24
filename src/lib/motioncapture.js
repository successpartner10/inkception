// src/lib/motioncapture.js
// Renders the motion effect (zoom / pan / sweep) as real frames and records
// them to video (MP4 where the browser supports it, else WebM). Honest
// animation — the exported file actually moves.

import { loadImageElement } from './utils'
import { fxState, fxStep, fxDraw } from './livex'

const loadImg = (src) => loadImageElement(src)

/**
 * Render `seconds` × `fps` frames of the image under a motion mode.
 * mode 'depth' = 2.5D parallax: needs `bgSrc` (clean background layer) and
 * `fgSrc` (person layer) from Extract Layers; falls back to a slow zoom.
 * `fx` = { kind, density, speed, seed } Live FX overlay, composited
 * deterministically so the export matches the on-screen preview exactly.
 * Returns { frames: HTMLCanvasElement[], fps, w, h }.
 */
export async function renderMotionFrames({
  src,
  filter,
  mode = 'zoom',
  speed = 1,
  w,
  h,
  seconds = 3,
  fps = 24,
  fx = null,
  bgSrc = null,
  fgSrc = null,
}) {
  const img = await loadImg(src)
  const bgImg = bgSrc ? await loadImg(bgSrc).catch(() => null) : null
  const fgImg = fgSrc ? await loadImg(fgSrc).catch(() => null) : null
  const depth = mode === 'depth' && bgImg && fgImg
  const fxSt = fx ? fxState(fx.kind, fx) : null
  const total = Math.round(seconds * fps)
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) // cover
  const iw = img.naturalWidth * s
  const ih = img.naturalHeight * s
  const frames = []
  const dur = seconds / speed
  for (let f = 0; f < total; f++) {
    const t = total <= 1 ? 0 : f / (total - 1)
    const local = (dur * t * fps) / total // eased progress in seconds
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    const ctx = cv.getContext('2d')
    if (filter) {
      try { ctx.filter = filter } catch { /* unsupported */ }
    }
    let scale = 1
    let ox = 0
    let oy = 0
    if (mode === 'zoom' || (mode === 'depth' && !depth)) {
      scale = 1 + 0.14 * local
    } else if (mode === 'pan') {
      scale = 1.1
      ox = -(iw * (scale - 1)) * 0.6 * local
      oy = -(ih * (scale - 1)) * 0.4 * local
    } else if (mode === 'sweep') {
      scale = 1 + 0.05 * local
    }
    const dw = iw * scale
    const dh = ih * scale
    if (depth) {
      // 2.5D parallax: background drifts & grows slightly, person sways
      const bScale = 1.03 + 0.06 * local
      ctx.drawImage(bgImg, (w - iw * bScale) / 2, (h - ih * bScale) / 2, iw * bScale, ih * bScale)
      const fScale = 1.05 + 0.02 * Math.sin(local * Math.PI * 2)
      const fxOff = Math.sin(local * Math.PI * 2) * w * 0.006
      const fyOff = Math.cos(local * Math.PI * 2) * h * 0.004
      ctx.drawImage(fgImg, (w - iw * fScale) / 2 + fxOff, (h - ih * fScale) / 2 + fyOff, iw * fScale, ih * fScale)
    } else {
      ctx.drawImage(img, (w - dw) / 2 + ox, (h - dh) / 2 + oy, dw, dh)
    }
    if (fxSt) {
      fxStep(fxSt, 1)
      fxDraw(fxSt, ctx, w, h)
    }
    if (mode === 'sweep') {
      const barW = w * 0.32
      const x = w * (0.1 + 0.9 * local) - barW / 2
      const g = ctx.createLinearGradient(x - barW / 2, 0, x + barW / 2, 0)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(0.5, 'rgba(255,255,255,0.28)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - barW / 2, 0, barW, h)
    }
    try { ctx.filter = 'none' } catch { /* noop */ }
    frames.push(cv)
  }
  return { frames, fps, w, h }
}

/** Pick the best supported video mime: MP4 (h264) → WebM (vp8/vp9). */
export function pickVideoMime() {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm',
  ]
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m
    } catch { /* keep trying */ }
  }
  return ''
}

/** Record pre-rendered frames into a video blob via canvas.captureStream. */
export function recordFrames(frames, { fps = 24, mimeType = pickVideoMime() } = {}) {
  return new Promise((resolve, reject) => {
    if (!frames.length || !mimeType) return reject(new Error('no supported video mime'))
    const cv = frames[0]
    const stream = cv.captureStream(fps)
    let rec
    try {
      rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
    } catch {
      return reject(new Error('MediaRecorder unavailable'))
    }
    const chunks = []
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    rec.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
    rec.onerror = (e) => reject(e)
    rec.start(100)
    let i = 0
    const ctx = cv.getContext('2d')
    const iv = setInterval(() => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.drawImage(frames[i % frames.length], 0, 0)
      i++
    }, 1000 / fps)
    setTimeout(() => {
      clearInterval(iv)
      try { rec.stop() } catch { reject(new Error('recorder failed')) }
    }, (frames.length / fps) * 1000 + 120)
  })
}
