// src/lib/psd.js
// Layered PSD writer — self-contained, no external library (the ag-psd
// dependency hung the export in the browser; this replaces it).
//
// Writes a spec-valid PSD: RGB, 8-bit, one layer per entry with real
// alpha channels + blend modes + names, plus the flattened composite.
// Everything is stored RAW (compression 0) — fast to write, big but
// perfectly valid, and every PSD reader opens it.

const BLEND_KEYS = {
  normal: 'norm', 'source-over': 'norm',
  multiply: 'mul ', screen: 'scrn', overlay: 'over',
  darken: 'dark', lighten: 'lite',
  'color-dodge': 'd dg', 'color-burn': 'idiv',
  'hard-light': 'hLit', 'soft-light': 'sLit',
  difference: 'diff', exclusion: 'smud',
}

/* big-endian helpers */
const be32 = (n) => new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255])
const be16 = (n) => new Uint8Array([(n >>> 8) & 255, n & 255])
const ascii = (s) => new Uint8Array(s.split('').map((c) => c.charCodeAt(0) & 255))

class ByteOut {
  constructor() { this.chunks = []; this.len = 0 }
  push(...parts) {
    for (const p of parts) {
      this.chunks.push(p)
      this.len += p.byteLength || p.length
    }
    return this
  }
  blob(type) { return new Blob(this.chunks, { type }) }
}

/* Pascal string padded to a multiple of 4 (PSD layer-name rule) */
function pascalName(name) {
  const bytes = ascii(String(name || 'Layer').slice(0, 31))
  const out = [Math.min(31, bytes.length)]
  out.push(...bytes)
  while (out.length % 4 !== 0) out.push(0)
  return new Uint8Array(out)
}

/** extract A,R,G,B planes from a canvas */
function planesFrom(canvas) {
  const w = canvas.width
  const h = canvas.height
  const n = w * h
  const { data } = canvas.getContext('2d').getImageData(0, 0, w, h)
  const A = new Uint8Array(n), R = new Uint8Array(n), G = new Uint8Array(n), B = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    A[i] = data[i * 4 + 3]
    R[i] = data[i * 4]
    G[i] = data[i * 4 + 1]
    B[i] = data[i * 4 + 2]
  }
  return { w, h, A, R, G, B }
}

/**
 * Build a layered PSD blob.
 * layers: [{ name, left, top, right, bottom, opacity 0..1, hidden, blend, canvas }]
 * (layers given TOP-FIRST, like fabric's object order; the file stores
 * bottom-first, so this reverses them.)
 */
export function buildLayeredPsdBlob({ width, height, layers, compositeCanvas }) {
  const W = Math.round(width)
  const H = Math.round(height)
  const file = new ByteOut()

  /* ---- header ---- */
  file.push(
    ascii('8BPS'), be16(1), new Uint8Array(6), // signature, version, reserved
    be16(3),                                    // channels (RGB composite)
    be32(H), be32(W), be16(8), be16(3),         // rows, cols, depth, RGB mode
    be32(0),                                    // color mode data
    be32(0),                                    // image resources
  )

  /* ---- layer & mask information ---- */
  const bottomFirst = layers.slice().reverse()
  const layerRecords = new ByteOut()
  layerRecords.push(be16(bottomFirst.length)) // layer count

  // pass 1: extract channel data per layer (bottom-first)
  const chans = bottomFirst.map((l) => planesFrom(l.canvas))

  // pass 2: records (need channel lengths, which depend only on canvas size)
  for (let i = 0; i < bottomFirst.length; i++) {
    const l = bottomFirst[i]
    const { w, h, A, R, G, B } = chans[i]
    const chanLen = 2 + w * h // compression u16 + raw bytes
    const extra = new ByteOut()
    extra.push(be32(0)) // mask data: none
    extra.push(be32(0)) // blending ranges: none
    extra.push(pascalName(l.name))
    const flags = l.hidden ? 2 : 0 // bit 1 = hidden
    layerRecords.push(
      be32(Math.round(l.top)), be32(Math.round(l.left)),
      be32(Math.round(l.bottom)), be32(Math.round(l.right)),
      be16(4), // 4 channels: A,R,G,B
      be16(-1 & 0xffff), be32(chanLen), // alpha
      be16(0), be32(chanLen),           // R
      be16(1), be32(chanLen),           // G
      be16(2), be32(chanLen),           // B
      ascii('8BIM'),
      ascii(BLEND_KEYS[l.blend] || 'norm'),
      new Uint8Array([Math.max(0, Math.min(255, Math.round((l.opacity ?? 1) * 255))), 0, flags, 0]),
      be32(extra.len), ...extra.chunks,
    )
  }
  // channel image data follows all records
  for (const c of chans) {
    for (const plane of [c.A, c.R, c.G, c.B]) {
      layerRecords.push(be16(0), plane) // raw
    }
  }

  const layerInfo = new ByteOut()
  layerInfo.push(be32(layerRecords.len), ...layerRecords.chunks)

  const layerAndMask = new ByteOut()
  layerAndMask.push(...layerInfo.chunks, be32(0)) // + global layer mask info: none
  file.push(be32(layerAndMask.len), ...layerAndMask.chunks)

  /* ---- composite image data (flattened preview) ---- */
  file.push(be16(0)) // raw
  const comp = planesFrom(compositeCanvas)
  file.push(comp.R, comp.G, comp.B)

  return file.blob('image/vnd.adobe.photoshop')
}
