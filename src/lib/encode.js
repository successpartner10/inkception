// src/lib/encode.js
// Real export encoders, all in-browser: animated GIF (LZW), minimal PDF
// (DCT-embedded JPEG), flattened PSD (raw RGB planes).

/* ------------------------------ helpers ------------------------------ */

const canvas2d = (cv) => cv.getContext('2d', { willReadFrequently: true })

/* ------------------------- median-cut palette ------------------------- */
// Quantize a canvas down to a palette (used for GIF).
export function medianCut(cv, maxColors = 256) {
  const { data, width, height } = canvas2d(cv).getImageData(0, 0, cv.width, cv.height)
  const pixels = []
  for (let i = 0; i < data.length; i += 4) pixels.push([data[i], data[i + 1], data[i + 2]])
  // sample if huge
  let sample = pixels
  if (pixels.length > 60000) {
    sample = []
    for (let i = 0; i < pixels.length; i += Math.ceil(pixels.length / 60000)) sample.push(pixels[i])
  }
  let boxes = [sample]
  const range = (b) => {
    let rMin = 255, gMin = 255, bMin = 255, rMax = 0, gMax = 0, bMax = 0
    for (const p of b) {
      if (p[0] < rMin) rMin = p[0]; if (p[0] > rMax) rMax = p[0]
      if (p[1] < gMin) gMin = p[1]; if (p[1] > gMax) gMax = p[1]
      if (p[2] < bMin) bMin = p[2]; if (p[2] > bMax) bMax = p[2]
    }
    return { rMin, rMax, gMin, gMax, bMin, bMax }
  }
  const largest = (b) => {
    const r = range(b)
    const rr = r.rMax - r.rMin, gg = r.gMax - r.gMin, bb = r.bMax - r.bMin
    return Math.max(rr, gg, bb)
  }
  while (boxes.length < maxColors) {
    boxes.sort((a, b) => largest(b) - largest(a))
    const box = boxes[0]
    if (box.length < 2) break
    const r = range(box)
    const rr = r.rMax - r.rMin, gg = r.gMax - r.gMin, bb = r.bMax - r.bMin
    const axis = rr >= gg && rr >= bb ? 0 : gg >= bb ? 1 : 2
    box.sort((a, b) => a[axis] - b[axis])
    const mid = box.length >> 1
    boxes = [box.slice(0, mid), box.slice(mid), ...boxes.slice(1)]
  }
  const palette = boxes.map((b) => {
    let r = 0, g = 0, bl = 0
    for (const p of b) { r += p[0]; g += p[1]; bl += p[2] }
    const n = b.length || 1
    return [Math.round(r / n), Math.round(g / n), Math.round(bl / n)]
  })
  // pad to power of 2 between 2 and 256 (GIF requires 2^k entries)
  const k = Math.max(2, Math.min(8, Math.ceil(Math.log2(palette.length))))
  while (palette.length < 1 << k) palette.push([0, 0, 0])
  return { palette, minCodeSize: k }
}

/* ------------------------------ GIF (LZW) ----------------------------- */

function lzwEncode(minCodeSize, indices) {
  const clear = 1 << minCodeSize
  const eoi = clear + 1
  let codeSize = minCodeSize + 1
  const dict = new Map()
  let nextCode = eoi + 1
  const out = []
  let bitBuf = 0
  let bitCnt = 0
  const emit = (code) => {
    bitBuf |= code << bitCnt
    bitCnt += codeSize
    while (bitCnt >= 8) {
      out.push(bitBuf & 0xff)
      bitBuf >>>= 8
      bitCnt -= 8
    }
  }
  emit(clear)
  if (indices.length === 0) {
    emit(eoi)
  } else {
    let curr = indices[0]
    for (let i = 1; i < indices.length; i++) {
      const px = indices[i]
      const key = curr * 256 + px
      if (dict.has(key)) {
        curr = dict.get(key)
      } else {
        emit(curr)
        if (nextCode < 4096) {
          dict.set(key, nextCode++)
          if (nextCode === 1 << codeSize && codeSize < 12) codeSize++
        }
        curr = px
      }
    }
    emit(curr)
    emit(eoi)
  }
  if (bitCnt > 0) out.push(bitBuf & 0xff)
  return out
}

function frameData(cv, palette) {
  const { data, width, height } = canvas2d(cv).getImageData(0, 0, cv.width, cv.height)
  const cache = new Map()
  const idx = new Uint8Array(width * height)
  let o = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const key = (r << 16) | (g << 8) | b
    let best = cache.get(key)
    if (best === undefined) {
      let bd = Infinity
      for (let p = 0; p < palette.length; p++) {
        const pr = palette[p][0] - r, pg = palette[p][1] - g, pb = palette[p][2] - b
        const d = pr * pr + pg * pg + pb * pb
        if (d < bd) { bd = d; best = p }
      }
      cache.set(key, best)
    }
    idx[o++] = best
  }
  return idx
}

/**
 * Build an animated GIF from canvases.
 * @param {HTMLCanvasElement[]} frames
 * @param {number} delayMs delay per frame
 */
export function gifEncode(frames, delayMs = 100) {
  if (!frames.length) throw new Error('no frames')
  const w = frames[0].width
  const h = frames[0].height
  const { palette, minCodeSize } = medianCut(frames[0], 256)
  const bytes = []
  const push = (...n) => bytes.push(...n)
  const pushStr = (s) => { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i) & 0xff) }

  pushStr('GIF89a')
  // logical screen descriptor
  push(w & 0xff, (w >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff)
  push(0x80 | (minCodeSize - 1), 0, 0) // global color table present, bg 0, aspect 0
  // global color table
  for (const c of palette) push(c[0], c[1], c[2])

  for (const frame of frames) {
    // graphic control extension — transparent if any pixel maps to bg? keep opaque
    push(0x21, 0xf9, 4, 0, (delayMs / 10) & 0xff, (delayMs / 10) >> 8 & 0xff, 0, 0)
    // image descriptor
    push(0x2c, 0, 0, 0, 0, w & 0xff, (w >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff, 0)
    const idx = frameData(frame, palette)
    const lzw = lzwEncode(minCodeSize, idx)
    // sub-blocks
    push(minCodeSize)
    for (let i = 0; i < lzw.length; i += 255) {
      const chunk = lzw.slice(i, i + 255)
      push(chunk.length)
      push(...chunk)
    }
    push(0)
  }
  pushStr(';')
  return new Blob([new Uint8Array(bytes)], { type: 'image/gif' })
}

/* ------------------------------ PDF (JPEG) ----------------------------- */

export function pdfFromJpeg(jpegDataUrl, w, h) {
  const b64 = jpegDataUrl.split(',')[1]
  const bin = atob(b64)
  const jpeg = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) jpeg[i] = bin.charCodeAt(i)

  const W = Math.round(w)
  const H = Math.round(h)
  const objects = []
  // obj 1 catalog, 2 pages, 3 page, 4 image, 5 content
  const obj = (n, body) => {
    objects[n] = `${n} 0 obj\n${body}\nendobj\n`
  }
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>')
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`)
  obj(4, `<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`)
  obj(5, `<< /Length 46 >>\nstream\nq ${W} 0 0 ${H} 0 0 cm /Im0 Do Q\nendstream`)

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let i = 1; i <= 5; i++) {
    offsets[i] = pdf.length
    pdf += objects[i]
    if (i === 4) {
      // raw jpeg bytes
      let chunk = ''
      for (let c = 0; c < jpeg.length; c++) chunk += String.fromCharCode(jpeg[c])
      pdf += chunk
      pdf += '\nendstream\n'
    } else if (i === 5) {
      pdf += '\n'
    }
  }
  const xrefPos = pdf.length
  pdf += `xref\n0 6\n0000000000 65535 f \n`
  for (let i = 1; i <= 5; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

/* ------------------------------ PSD (flat) ----------------------------- */

export function psdFromCanvas(cv) {
  const { data, width: W, height: H } = canvas2d(cv).getImageData(0, 0, cv.width, cv.height)
  const len = W * H
  // planes R, G, B (raw, compression 0)
  const planes = [new Uint8Array(len), new Uint8Array(len), new Uint8Array(len)]
  for (let i = 0; i < len; i++) {
    planes[0][i] = data[i * 4]
    planes[1][i] = data[i * 4 + 1]
    planes[2][i] = data[i * 4 + 2]
  }
  const be32 = (n) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]
  const be16 = (n) => [(n >>> 8) & 0xff, n & 0xff]
  const parts = []
  // header
  parts.push(be32(0x38425053)) // '8BPS'
  parts.push(be16(1)) // version
  parts.push([0, 0, 0, 0, 0, 0]) // reserved
  parts.push(be16(3)) // channels RGB
  parts.push(be32(H))
  parts.push(be32(W))
  parts.push(be16(8)) // depth
  parts.push(be16(3)) // color mode RGB
  parts.push(be32(0)) // color mode data
  parts.push(be32(0)) // image resources
  parts.push(be32(0)) // layer & mask info (flattened)
  parts.push(be16(0)) // compression: raw
  parts.push(planes[0], planes[1], planes[2])
  const total = parts.reduce((a, p) => a + (p.byteLength || p.length), 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of parts) {
    out.set(p instanceof Uint8Array ? p : new Uint8Array(p), o)
    o += p.byteLength || p.length
  }
  return new Blob([out], { type: 'image/vnd.adobe.photoshop' })
}

/* ------------------------- color palette (AI) ------------------------- */

/** Extract N dominant colors from an image (real k-means-ish via median cut). */
export async function extractPalette(src, n = 5) {
  const img = await new Promise((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = src
  })
  const s = Math.min(1, 240 / Math.max(img.width, img.height))
  const cv = document.createElement('canvas')
  cv.width = Math.max(2, Math.round(img.width * s))
  cv.height = Math.max(2, Math.round(img.height * s))
  canvas2d(cv).drawImage(img, 0, 0, cv.width, cv.height)
  const { palette } = medianCut(cv, Math.max(n, 2))
  const seen = new Set()
  const out = []
  for (const c of palette) {
    const hex = '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
    if (!seen.has(hex)) {
      seen.add(hex)
      out.push({ hex, rgb: c })
      if (out.length >= n) break
    }
  }
  return out
}
