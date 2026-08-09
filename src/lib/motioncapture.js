// src/lib/motioncapture.js
// Renders the motion effect (zoom / pan / sweep) as real frames and records
// them to video (MP4 where the browser supports it, else WebM). Honest
// animation — the exported file actually moves.

import { loadImageElement } from './utils'

const loadImg = (src) => loadImageElement(src)

/**
 * Render `seconds` × `fps` frames of the image under a motion mode.
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
}) {
  const img = await loadImg(src)
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
    if (mode === 'zoom') {
      scale = 1 + 0.18 * local
    } else if (mode === 'pan') {
      scale = 1.1
      ox = -(iw * (scale - 1)) * 0.6 * local
      oy = -(ih * (scale - 1)) * 0.4 * local
    } else if (mode === 'sweep') {
      scale = 1 + 0.05 * local
    }
    const dw = iw * scale
    const dh = ih * scale
    ctx.drawImage(img, (w - dw) / 2 + ox, (h - dh) / 2 + oy, dw, dh)
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
