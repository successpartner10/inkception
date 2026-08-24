// functions/api/[[path]].js — Inkception's thin AI Worker (free lane).
// Runs as a Cloudflare Pages Function next to the static app; no account,
// no user key. Backed by Workers AI's free tier, best-effort rate-limited
// per IP. The Pro lane (Gemini/Veo with the user's own key) never touches
// this worker — those calls go browser → Google directly.
//
// Endpoints (POST JSON):
//   /api/ping      → { ok, models }
//   /api/describe  → { image, mime }          → { prompt }
//   /api/copy      → { brief, tone }          → { items: [{kind,text}] }
//   /api/generate  → { prompt, w, h }         → { dataUrl }

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url)
  const route = url.pathname.replace(/^.*\/api\//, '').replace(/\/$/, '')

  if (!env.AI) {
    return json({ error: 'AI binding missing — add the Workers AI binding to this Pages project (see README → AI lanes)' }, 503)
  }

  let body = {}
  try { body = await request.json() } catch { body = {} }

  try {
    if (route === 'ping') {
      return json({ ok: true, lane: 'free' })
    }

    if (!rateOk(request)) return json({ error: 'Free lane is busy — try again in a minute, or use your own key (Pro lane)' }, 429)

    if (route === 'describe') {
      const { image, mime = 'image/jpeg' } = body
      if (!image) return json({ error: 'missing image' }, 400)
      const prompt = await describe(env, image, mime)
      return json({ prompt })
    }

    if (route === 'copy') {
      const { brief = '', tone = 'friendly' } = body
      const items = await copy(env, brief, tone)
      return json({ items })
    }

    if (route === 'generate') {
      const { prompt = '' } = body
      if (!prompt.trim()) return json({ error: 'missing prompt' }, 400)
      const dataUrl = await generate(env, prompt)
      return json({ dataUrl })
    }

    return json({ error: 'unknown route' }, 404)
  } catch (e) {
    return json({ error: (e && e.message) || 'worker error' }, 500)
  }
}

export async function onRequestGet() {
  return json({ ok: true, lane: 'free', hint: 'POST /api/describe | /api/copy | /api/generate' })
}

/* --------------------------------- helpers -------------------------------- */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

/* best-effort per-IP rate limit (per isolate; good enough for a free lane) */
const buckets = new Map()
function rateOk(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'local'
  const now = Date.now()
  const b = buckets.get(ip) || { n: 0, t: now }
  if (now - b.t > 3600_000) { b.n = 0; b.t = now }
  b.n++
  buckets.set(ip, b)
  if (buckets.size > 5000) buckets.clear()
  return b.n <= 60
}

const VISION_MODELS = [
  '@cf/meta/llama-3.2-11b-vision',
  '@cf/google/gemma-4-26b-a4b-it',
]
const TEXT_MODELS = [
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/google/gemma-4-26b-a4b-it',
]
const IMAGE_MODELS = [
  '@cf/black-forest-labs/flux-2-klein',
  '@cf/black-forest-labs/flux-1-schnell',
]

async function describe(env, base64, mime) {
  const instruction = `Describe this image as a structured image-generation prompt. Use exactly these lines:
SUBJECT: <who/what, clothing, pose, expression>
BACKGROUND: <what is behind>
STYLE: <photo/illustration/3D, camera, lighting, mood>
TEXT: <any text visible in the image, or "none">
Be specific and visual. No preamble, just the 4 lines.`
  let lastErr
  for (const model of VISION_MODELS) {
    try {
      const r = await env.AI.run(model, {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: instruction },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
        max_tokens: 400,
      })
      const text = r && r.response && String(r.response).trim()
      if (text) return text
      throw new Error('empty response')
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('describe failed')
}

function parseItems(text) {
  const items = []
  for (const line of String(text || '').split('\n')) {
    const m = line.match(/^\s*(?:\[)?\s*(headline|cta|subheadline|tagline)\s*(?:\]|:|—|-)\s*(.+)\s*$/i)
    if (m && m[2].trim().length > 1) {
      items.push({ kind: m[1].toLowerCase(), text: m[2].trim().replace(/^["“]|["”]$/g, '') })
    }
  }
  return items.slice(0, 8)
}

async function copy(env, brief, tone) {
  const instruction = `You write short marketing copy. Brand/offer: "${brief}". Tone: ${tone}.
Return EXACTLY 6 lines, no preamble, each line formatted like:
[headline] <up to 8 words>
Use 3 headline lines, then:
[cta] <a 2-5 word call to action>
3 cta lines. Plain text only.`
  let lastErr
  for (const model of TEXT_MODELS) {
    try {
      const r = await env.AI.run(model, { messages: [{ role: 'user', content: instruction }], max_tokens: 300 })
      const text = r && r.response && String(r.response)
      const items = parseItems(text)
      if (items.length >= 3) return items
      throw new Error('unparseable')
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('copy failed')
}

async function generate(env, prompt) {
  let lastErr
  for (const model of IMAGE_MODELS) {
    try {
      const result = await env.AI.run(model, { prompt })
      let buf = null
      if (result instanceof Response) buf = await result.arrayBuffer()
      else if (result instanceof ArrayBuffer) buf = result
      else if (result && result.data) {
        // some models return base64 payloads
        return `data:image/png;base64,${result.data}`
      }
      if (buf && buf.byteLength > 100) {
        const b64 = arrayBufferToBase64(buf)
        return { dataUrl: `data:image/png;base64,${b64}` }
      }
      throw new Error('empty image')
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('generation failed')
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}
