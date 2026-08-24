// src/lib/ailane.js
// AI lanes — one client for every AI route in the app:
//
//   • Worker lane (free): same-origin /api/* Pages Function backed by
//     Cloudflare Workers AI. No key, no account — rate-limited, free tier.
//   • Pro lane (your key): direct browser → Google (Gemini) calls using a
//     key the user pastes in Settings. The key never leaves the device
//     except in the request to Google itself.
//   • Offline lane: local template fallbacks so copy suggestions always work.
//
// Every cloud call is gated behind an explicit one-time consent (image
// leaves the device) — the app's "private by default" promise stays honest.

const KEY_STORE = 'inkception.key.gemini'
const CONSENT_STORE = 'inkception.ai.consent.v1'

/* --------------------------------- key ----------------------------------- */

export function getGeminiKey() {
  try { return localStorage.getItem(KEY_STORE) || '' } catch { return '' }
}
export function setGeminiKey(k) {
  try {
    if (k) localStorage.setItem(KEY_STORE, k)
    else localStorage.removeItem(KEY_STORE)
  } catch { /* ignore */ }
}
export function hasGeminiKey() { return !!getGeminiKey() }

/* -------------------------------- consent -------------------------------- */

export function aiConsentGiven() {
  try { return localStorage.getItem(CONSENT_STORE) === '1' } catch { return false }
}
export function giveAiConsent() {
  try { localStorage.setItem(CONSENT_STORE, '1') } catch { /* ignore */ }
}
export function resetAiConsent() {
  try { localStorage.removeItem(CONSENT_STORE) } catch { /* ignore */ }
}

/* ------------------------------ worker lane ------------------------------ */

async function workerPost(path, body, timeoutMs = 60000) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(`/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal,
    })
    if (!res.ok) throw new Error(`worker ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

export async function workerPing() {
  try {
    const r = await workerPost('ping', {})
    return r && r.ok ? 'free' : null
  } catch { return null }
}

/** Image → structured text prompt. Worker lane (free). */
export async function describeViaWorker(base64, mime) {
  const r = await workerPost('describe', { image: base64, mime }, 90000)
  if (!r || !r.prompt) throw new Error('empty description')
  return r.prompt
}

/** Headline/CTA suggestions. Worker lane (free). */
export async function copyViaWorker(brief, tone) {
  const r = await workerPost('copy', { brief, tone }, 45000)
  if (!r || !Array.isArray(r.items) || !r.items.length) throw new Error('empty copy')
  return r.items
}

/** Text → image. Worker lane (free). Returns { dataUrl }. */
export async function generateViaWorker(prompt, { w = 1024, h = 1024 } = {}) {
  const r = await workerPost('generate', { prompt, w, h }, 120000)
  if (!r || !r.dataUrl) throw new Error('empty image')
  return r.dataUrl
}

/* ------------------------------- pro lane -------------------------------- */

const GEM = 'https://generativelanguage.googleapis.com/v1beta'

async function gemCall(model, method, body, key) {
  const res = await fetch(`${GEM}/models/${model}:${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let msg = `${res.status}`
    try { msg = (await res.json()).error?.message || msg } catch { /* keep */ }
    throw new Error(`Google API: ${msg}`)
  }
  return res.json()
}

const TEXT_MODELS = ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite']
const IMAGE_MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image']
const VIDEO_MODELS = ['veo-3.1-fast-generate-001', 'veo-3.1-generate-001', 'veo-3.0-generate-001']

/** Image → structured text prompt via the user's Gemini key. */
export async function describeViaGemini(base64, mime, key = getGeminiKey()) {
  const prompt = `Describe this image as a structured image-generation prompt. Use exactly these lines:
SUBJECT: <who/what, clothing, pose, expression>
BACKGROUND: <what is behind>
STYLE: <photo/illustration/3D, camera, lighting, mood>
TEXT: <any text visible in the image, or "none">
Be specific and visual. No preamble, just the 4 lines.`
  let lastErr
  for (const model of TEXT_MODELS) {
    try {
      const r = await gemCall(model, 'generateContent', {
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }] }],
      }, key)
      const text = r?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
      if (text.trim()) return text.trim()
      throw new Error('empty')
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('describe failed')
}

/** Text → image (or image+prompt → edited image) via Nano Banana class models. */
export async function imageViaGemini(prompt, { imageBase64, imageMime, key = getGeminiKey() } = {}) {
  let lastErr
  for (const model of IMAGE_MODELS) {
    try {
      const parts = [{ text: prompt }]
      if (imageBase64) parts.push({ inline_data: { mime_type: imageMime, data: imageBase64 } })
      const r = await gemCall(model, 'generateContent', {
        contents: [{ parts }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }, key)
      const out = r?.candidates?.[0]?.content?.parts || []
      const imgPart = out.find((p) => p.inlineData?.data || p.inline_data?.data)
      const b64 = imgPart?.inlineData?.data || imgPart?.inline_data?.data
      const mime = imgPart?.inlineData?.mimeType || imgPart?.inline_data?.mime_type || 'image/png'
      if (b64) return `data:${mime};base64,${b64}`
      throw new Error('model returned no image')
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('image generation failed')
}

/**
 * Image/text → video via Veo (image-to-video when an input image is given).
 * Returns { url, mime } where url is an object URL to the MP4 blob.
 * NOTE: billed per output second by Google — always show the price first.
 */
export async function videoViaGemini(prompt, { imageBase64, imageMime, seconds, key = getGeminiKey(), onProgress = () => {} } = {}) {
  let lastErr
  for (const model of VIDEO_MODELS) {
    try {
      const inst = { prompt }
      if (imageBase64) inst.image = { bytesBase64Encoded: imageBase64, mimeType: imageMime }
      const r = await gemCall(model, 'predictLongRunning', {
        instances: [inst],
        parameters: { aspectRatio: '16:9', sampleCount: 1 },
      }, key)
      const opName = r?.name
      if (!opName) throw new Error('no operation')
      // poll until done (Veo takes ~30s–3min)
      const deadline = Date.now() + 6 * 60 * 1000
      let done = false
      let resp = null
      while (Date.now() < deadline) {
        await new Promise((res) => setTimeout(res, 6000))
        onProgress('Rendering on Veo… this usually takes 1–2 minutes')
        const poll = await fetch(`${GEM}/${opName}`, { headers: { 'x-goog-api-key': key } })
        if (!poll.ok) throw new Error(`poll ${poll.status}`)
        resp = await poll.json()
        if (resp.done) { done = true; break }
      }
      if (!done) throw new Error('video timed out')
      const sample = resp?.response?.generateVideoResponse?.generatedSamples?.[0]
        || resp?.response?.generatedSamples?.[0]
      const uri = sample?.video?.uri || sample?.video?.url
        || resp?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
      if (!uri) throw new Error('no video in response')
      const dl = await fetch(uri.includes('alt=media') ? uri : `${uri}${uri.includes('?') ? '&' : '?'}alt=media`, {
        headers: { 'x-goog-api-key': key },
      })
      if (!dl.ok) throw new Error(`download ${dl.status}`)
      const blob = await dl.blob()
      return { url: URL.createObjectURL(blob), mime: blob.type || 'video/mp4' }
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('video generation failed')
}

/* ----------------------------- offline lane ------------------------------ */

/** Always-available local suggestions (no network, no key, no worker). */
export function copyOffline(brief) {
  const b = String(brief || 'your brand').trim() || 'your brand'
  const short = b.split(/\s+/).slice(0, 3).join(' ')
  const cap = short.charAt(0).toUpperCase() + short.slice(1)
  return [
    { kind: 'headline', text: `${cap}, made effortless.` },
    { kind: 'headline', text: `Meet ${short} — like never before.` },
    { kind: 'headline', text: `The smart way to ${short}.` },
    { kind: 'cta', text: 'Start now — it takes 30 seconds' },
    { kind: 'cta', text: 'Try it free today' },
    { kind: 'cta', text: 'Get yours →' },
  ]
}
