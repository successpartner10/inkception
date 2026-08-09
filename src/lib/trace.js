// Real edge-tracing → SVG. Canny-ish pipeline condensed for the browser:
// luminance → Sobel gradient → adaptive threshold → run-length line emission.
// This is the "Vectorize" engine behind the AI suite.

import { loadImageElement } from './utils'

export async function traceImage(src, { detail = 60, smoothing = 40 } = {}) {
  const t0 = performance.now()
  const SIZE = 160
  const PAD = 4

  const img = await loadImageElement(src)
  const cv = document.createElement('canvas')
  cv.width = SIZE
  cv.height = SIZE
  const ctx = cv.getContext('2d', { willReadFrequently: true })

  const s = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh)

  const { data } = ctx.getImageData(0, 0, SIZE, SIZE)

  // luminance
  const lum = new Float32Array(SIZE * SIZE)
  for (let i = 0; i < SIZE * SIZE; i++) {
    const j = i * 4
    lum[i] = 0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]
  }

  // sobel magnitude
  const grad = new Float32Array(SIZE * SIZE)
  let maxG = 0
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      const i = y * SIZE + x
      const gx = lum[i + 1] - lum[i - 1]
      const gy = lum[i + SIZE] - lum[i - SIZE]
      const g = Math.abs(gx) + Math.abs(gy)
      grad[i] = g
      if (g > maxG) maxG = g
    }
  }

  // detail ↑ → lower threshold (more edges captured)
  const threshold = maxG * (0.34 - (detail / 100) * 0.28)
  const edge = new Uint8Array(SIZE * SIZE)
  for (let i = 0; i < SIZE * SIZE; i++) edge[i] = grad[i] >= threshold ? 1 : 0

  // smoothing ↑ → longer minimum runs (fewer, cleaner strokes)
  const minRun = 1 + Math.round((smoothing / 100) * 12)

  const lines = []
  const visited = new Uint8Array(SIZE * SIZE)

  // horizontal runs
  for (let y = 0; y < SIZE; y++) {
    let x = 0
    while (x < SIZE) {
      if (!edge[y * SIZE + x]) {
        x++
        continue
      }
      let x2 = x
      while (x2 < SIZE && edge[y * SIZE + x2]) x2++
      const len = x2 - x
      if (len >= minRun) {
        lines.push([x + PAD, y + PAD, x2 - 1 + PAD, y + PAD])
        for (let k = x; k < x2; k++) visited[y * SIZE + k] = 1
      }
      x = x2
    }
  }

  // vertical runs for the leftovers
  for (let x = 0; x < SIZE; x++) {
    let y = 0
    while (y < SIZE) {
      if (!edge[y * SIZE + x] || visited[y * SIZE + x]) {
        y++
        continue
      }
      let y2 = y
      while (y2 < SIZE && edge[y2 * SIZE + x] && !visited[y2 * SIZE + x]) y2++
      const len = y2 - y
      if (len >= Math.max(2, minRun)) lines.push([x + PAD, y + PAD, x + PAD, y2 - 1 + PAD])
      y = Math.max(y2, y + 1)
    }
  }

  const vb = SIZE + PAD * 2
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" width="100%" height="100%" ` +
    `shape-rendering="crispEdges">` +
    `<g fill="none" stroke="#e5e2e1" stroke-width="0.75" stroke-linecap="round">` +
    lines.map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('') +
    `</g></svg>`

  return {
    svg,
    stats: {
      lines: lines.length,
      points: lines.length * 2,
      ms: Math.round(performance.now() - t0),
    },
  }
}
