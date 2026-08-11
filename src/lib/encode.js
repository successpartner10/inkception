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

/* ------------------------------ PSD (layered) ----------------------------- */
// A real layered PSD writer: one layer record per canvas object, with
// name, opacity, visibility, blend mode, and RLE-compressed channel data
// (R/G/B + alpha mask per layer). Opens in pro editors (PSD-compatible) with
// editable layers intact.

const PSD_BLEND_KEYS = {
  'source-over': 'norm',
  normal: 'norm',
  multiply: 'mult',
  screen: 'scrn',
  overlay: 'over',
  darken: 'dark',
  lighten: 'lite',
  'color-dodge': 'div ',
  'color-burn': 'idiv',
  'hard-light': 'hLit',
  'soft-light': 'sLit',
  difference: 'diff',
  exclusion: 'smud',
}

class BW {
  constructor() { this.a = [] }
  u8(...n) { for (const x of n) this.a.push(x & 0xff) }
  str(s) { for (let i = 0; i < s.length; i++) this.a.push(s.charCodeAt(i) & 0xff) }
  be16(n) { this.a.push((n >> 8) & 0xff, n & 0xff) }
  be32(n) { this.a.push((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff) }
  patchBe32(offset, n) {
    this.a[offset] = (n >>> 24) & 0xff
    this.a[offset + 1] = (n >>> 16) & 0xff
    this.a[offset + 2] = (n >>> 8) & 0xff
    this.a[offset + 3] = n & 0xff
  }
  bytes() { return new Uint8Array(this.a) }
  len() { return this.a.length }
}

function rlePack(row) {
  // PackBits-style row encoder (PSD RLE)
  const out = []
  let i = 0
  const n = row.length
  while (i < n) {
    let run = 1
    while (i + run < n && row[i + run] === row[i] && run < 128) run++
    if (run >= 3) {
      out.push(257 - run, row[i])
      i += run
    } else {
      const lit = []
      while (i < n && lit.length < 128) {
        let r2 = 1
        while (i + r2 < n && row[i + r2] === row[i] && r2 < 128) r2++
        if (r2 >= 3) break
        lit.push(row[i])
        i++
      }
      out.push(lit.length - 1, ...lit)
    }
  }
  return out
}

function rleChannel(data, w, h) {
  const packedRows = []
  let total = 0
  for (let y = 0; y < h; y++) {
    const packed = rlePack(data.subarray(y * w, (y + 1) * w))
    packedRows.push(packed)
    total += 2 + packed.length
  }
  return { packedRows, total }
}

function loadCv(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas')
      cv.width = img.naturalWidth || img.width
      cv.height = img.naturalHeight || img.height
      cv.getContext('2d').drawImage(img, 0, 0)
      resolve(cv)
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

const clamp01 = (v) => Math.min(1, Math.max(0, v === undefined ? 1 : v))

/**
 * Write a layered PSD.
 * @param {number} w canvas width
 * @param {number} h canvas height
 * @param {Array} layers top-down: [{ name, opacity(0..1), visible, blend('source-over'|...),
 *                                    dataUrl (PNG with alpha, canvas-sized, object composited),
 *                                    top, left }]
 * @param {string} compositeDataUrl flattened full-canvas PNG (optional)
 */
export async function psdFromLayers(w, h, layers, compositeDataUrl) {
  const W = Math.round(w)
  const H = Math.round(h)
  const ordered = [...layers].reverse() // PSD stores bottom-up

  const rendered = []
  for (const L of ordered) {
    const cv = await loadCv(L.dataUrl)
    const id = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)
    const lw = cv.width
    const lh = cv.height
    const n = lw * lh
    const chR = new Uint8Array(n), chG = new Uint8Array(n), chB = new Uint8Array(n), chA = new Uint8Array(n)
    let hasAlpha = false
    for (let i = 0; i < n; i++) {
      chR[i] = id.data[i * 4]
      chG[i] = id.data[i * 4 + 1]
      chB[i] = id.data[i * 4 + 2]
      chA[i] = id.data[i * 4 + 3]
      if (id.data[i * 4 + 3] < 255) hasAlpha = true
    }
    const chans = []
    if (hasAlpha) chans.push({ id: -1, data: chA })
    chans.push({ id: 0, data: chR }, { id: 1, data: chG }, { id: 2, data: chB })
    rendered.push({
      top: Math.max(0, Math.round(L.top || 0)),
      left: Math.max(0, Math.round(L.left || 0)),
      rw: lw,
      rh: lh,
      name: String(L.name || 'Layer').slice(0, 31),
      opacity: Math.round(clamp01(L.opacity) * 255),
      visible: L.visible !== false,
      blend: PSD_BLEND_KEYS[L.blend] || 'norm',
      channels: chans.map((c) => ({ id: c.id, ...rleChannel(c.data, lw, lh) })),
    })
  }

  // composite (flattened) RGB
  let comp = null
  if (compositeDataUrl) {
    const cv = await loadCv(compositeDataUrl)
    const id = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)
    const n = cv.width * cv.height
    comp = { r: new Uint8Array(n), g: new Uint8Array(n), b: new Uint8Array(n) }
    for (let i = 0; i < n; i++) {
      comp.r[i] = id.data[i * 4]
      comp.g[i] = id.data[i * 4 + 1]
      comp.b[i] = id.data[i * 4 + 2]
    }
  }

  const out = new BW()
  // header
  out.str('8BPS')
  out.be16(1)
  out.u8(0, 0, 0, 0, 0, 0)
  out.be16(3) // RGB
  out.be32(H)
  out.be32(W)
  out.be16(8)
  out.be16(3)
  out.be32(0) // color mode data
  out.be32(0) // image resources

  // layer & mask section
  const sec = new BW()
  sec.be16(rendered.length)
  for (const rec of rendered) {
    sec.be32(rec.top)
    sec.be32(rec.left)
    sec.be32(rec.top + rec.rh)
    sec.be32(rec.left + rec.rw)
    sec.be16(rec.channels.length)
    for (const ch of rec.channels) {
      sec.be16(ch.id)
      sec.be32(ch.total + 2) // +2 for the RLE compression marker
    }
    sec.str('8BIM')
    sec.str(rec.blend)
    sec.u8(rec.opacity)
    sec.u8(0) // clipping
    sec.u8(8 | (rec.visible ? 2 : 0)) // flags: psd5.0+ (+visible bit)
    sec.u8(0) // filler
    const extraStart = sec.len()
    sec.be32(0) // extra data length (patched)
    sec.be32(0) // layer mask data length
    sec.be32(0) // blending ranges length
    const nb = [...rec.name].map((c) => c.charCodeAt(0) & 0xff)
    sec.u8(nb.length, ...nb)
    while ((nb.length + 1) % 4 !== 0) sec.u8(0) // name padded to 4
    sec.be32(0) // additional layer info length
    sec.patchBe32(extraStart, sec.len() - extraStart - 4)
    // channel data (RLE) follows the record
    for (const ch of rec.channels) {
      sec.be16(1) // compression = RLE
      for (const row of ch.packedRows) {
        sec.be16(row.length)
        sec.u8(...row)
      }
    }
  }
  sec.be32(0) // global layer mask length
  sec.be32(0) // additional layer info length
  out.be32(sec.len())
  out.u8(...sec.a)

  // image data (composite)
  out.be16(0) // raw
  if (comp) {
    out.u8(...comp.r)
    out.u8(...comp.g)
    out.u8(...comp.b)
  } else {
    for (let i = 0; i < W * H * 3; i++) out.u8(0)
  }

  return new Blob([out.bytes()], { type: 'image/vnd.adobe.photoshop' })
}

/** Flattened RGB PSD fallback (used when there are no canvas objects). */
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

/* ------------------------------ zip (batch export) ------------------------- */
// Minimal ZIP writer — STORE method (images are already compressed, so this
// gains nothing from deflate). Used to bundle multi-size exports into one
// folder. entries: [{ name, data: Blob | Uint8Array }]

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

export function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export async function zipFiles(entries) {
  const enc = new TextEncoder()
  const chunks = []
  const central = []
  let offset = 0
  for (const e of entries) {
    const data = e.data instanceof Uint8Array ? e.data : new Uint8Array(await e.data.arrayBuffer())
    const nameBytes = enc.encode(e.name)
    const crc = crc32(data)
    const lh = new DataView(new ArrayBuffer(30))
    lh.setUint32(0, 0x04034b50, true) // local file header sig
    lh.setUint16(4, 20, true) // version needed
    lh.setUint16(6, 0, true) // flags
    lh.setUint16(8, 0, true) // method: STORE
    lh.setUint16(10, 0, true) // mod time
    lh.setUint16(12, 0x21, true) // mod date
    lh.setUint32(14, crc, true)
    lh.setUint32(18, data.length, true)
    lh.setUint32(22, data.length, true)
    lh.setUint16(26, nameBytes.length, true)
    lh.setUint16(28, 0, true) // extra len
    chunks.push(new Uint8Array(lh.buffer), nameBytes, data)
    central.push({ nameBytes, crc, size: data.length, offset })
    offset += 30 + nameBytes.length + data.length
  }
  const cdStart = offset
  for (const c of central) {
    const cd = new DataView(new ArrayBuffer(46))
    cd.setUint32(0, 0x02014b50, true) // central dir sig
    cd.setUint16(4, 20, true) // version made by
    cd.setUint16(6, 20, true) // version needed
    cd.setUint16(8, 0, true) // flags
    cd.setUint16(10, 0, true) // method
    cd.setUint16(12, 0, true) // time
    cd.setUint16(14, 0x21, true) // date
    cd.setUint32(16, c.crc, true)
    cd.setUint32(20, c.size, true)
    cd.setUint32(24, c.size, true)
    cd.setUint16(28, c.nameBytes.length, true)
    cd.setUint16(30, 0, true) // extra
    cd.setUint16(32, 0, true) // comment
    cd.setUint16(34, 0, true) // disk start
    cd.setUint16(36, 0, true) // internal attrs
    cd.setUint32(38, (0o644 << 16) | 0x80000000 >>> 0, true) // external attrs (file)
    cd.setUint32(42, c.offset, true)
    chunks.push(new Uint8Array(cd.buffer), c.nameBytes)
    offset += 46 + c.nameBytes.length
  }
  const cdSize = offset - cdStart
  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true) // EOCD sig
  eocd.setUint16(4, 0, true) // disk
  eocd.setUint16(6, 0, true) // cd start disk
  eocd.setUint16(8, central.length, true) // entries this disk
  eocd.setUint16(10, central.length, true) // entries total
  eocd.setUint32(12, cdSize, true)
  eocd.setUint32(16, cdStart, true)
  chunks.push(new Uint8Array(eocd.buffer))

  const total = chunks.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of chunks) { out.set(p, o); o += p.length }
  return new Blob([out], { type: 'application/zip' })
}
