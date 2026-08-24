// src/components/AIModals.jsx
// The four AI-create dialogs — Describe (image→prompt), Generate (text→
// image), Headlines & CTA (copy), Animate (Live FX / 2.5D / Veo).
//
// Novice-first by design: every modal opens with a one-line plain-English
// "what is this?", cloud steps show an explicit consent gate the first
// time, and anything paid shows its approximate price BEFORE you click.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Button } from './ui'
import { Icon } from './Icon'
import { cn } from '../lib/utils'
import {
  aiConsentGiven, giveAiConsent, hasGeminiKey,
  describeViaWorker, describeViaGemini,
  copyViaWorker, copyOffline,
  generateViaWorker, imageViaGemini,
  videoViaGemini,
} from '../lib/ailane'

/* ------------------------------ consent gate ------------------------------ */

export function ConsentGate({ onReady, what = 'this image' }) {
  const [ok, setOk] = useState(aiConsentGiven())
  useEffect(() => { if (ok) onReady?.() }, [ok]) // eslint-disable-line react-hooks/exhaustive-deps
  if (ok) return null
  return (
    <div className="rounded-ink border border-line-2 bg-surface-2 p-4">
      <p className="text-sm font-bold text-fg">One quick thing before the AI runs</p>
      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-dim">
        Inkception is private by default — nothing leaves your device. This step sends {what} to a
        cloud AI model to work on it. Your image is used only to answer your request.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" icon="check" onClick={() => { giveAiConsent(); setOk(true) }}>
          Allow & remember
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOk(true)}>
          Allow once
        </Button>
      </div>
    </div>
  )
}

function Tip({ children }) {
  return (
    <p className="mb-3 flex items-start gap-2 rounded-ink border border-line bg-surface-2 px-3 py-2 text-[0.8125rem] leading-relaxed text-dim">
      <Icon name="info" size={14} className="mt-0.5 shrink-0 text-mute" />
      <span>{children}</span>
    </p>
  )
}

/* ------------------------------ describe ---------------------------------- */

export function DescribeModal({ open, onClose, imageSrc, onUsePrompt, notify = () => {} }) {
  const [busy, setBusy] = useState(false)
  const [out, setOut] = useState('')
  const [err, setErr] = useState('')
  const [consented, setConsented] = useState(aiConsentGiven())

  useEffect(() => { if (open) { setOut(''); setErr('') } }, [open])

  const run = async () => {
    if (!imageSrc || busy) return
    setBusy(true); setErr('')
    try {
      const split = imageSrc.split(',')
      const mime = (split[0].match(/data:(.*?);/) || [])[1] || 'image/png'
      const b64 = split[1]
      let text = ''
      try {
        text = await describeViaWorker(b64, mime)
      } catch {
        if (hasGeminiKey()) text = await describeViaGemini(b64, mime)
        else throw new Error('Free lane unavailable and no AI key set — add your Google AI key in Settings, or try again later.')
      }
      setOut(text)
    } catch (e) {
      setErr(e.message || 'Could not describe the image')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Describe this image" subtitle="AI writes the prompt — you stay in control" width="max-w-lg">
      <Tip>
        <b>What is this?</b> The AI looks at your image and writes a text description of it (subject,
        background, style, any text). You can edit that description and use it to regenerate or
        restyle the image — a great starting point when you don't know what to type.
      </Tip>
      {!consented && (
        <ConsentGate onReady={() => setConsented(true)} />
      )}
      {(consented || out) && (
        <>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" icon="sparkle" disabled={busy || !imageSrc} onClick={run}>
              {busy ? 'Reading the image…' : out ? 'Describe again' : 'Describe my image'}
            </Button>
            {out && (
              <Button variant="secondary" size="sm" icon="copy" onClick={() => { navigator.clipboard?.writeText(out); notify('Prompt copied') }}>
                Copy
              </Button>
            )}
          </div>
          {out && (
            <>
              <textarea
                value={out}
                onChange={(e) => setOut(e.target.value)}
                rows={7}
                className="mt-3 w-full resize-y rounded-ink border border-line bg-surface-2 p-3 text-sm leading-relaxed text-fg focus:border-white focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="primary" size="sm" icon="brush" onClick={() => { onUsePrompt(out); onClose() }}>
                  Use this prompt → Generate image
                </Button>
              </div>
              <p className="mt-2 text-[0.75rem] text-mute">Free lane. Falls back to your AI key if the free lane is busy.</p>
            </>
          )}
          {err && <p className="mt-3 rounded-ink border border-line-2 bg-surface-2 p-3 text-[0.8125rem] text-danger">{err}</p>}
        </>
      )}
    </Modal>
  )
}

/* ------------------------------ generate ---------------------------------- */

export function GenerateModal({ open, onClose, initialPrompt = '', onAddImage, notify = () => {} }) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [lane, setLane] = useState('free')
  const [busy, setBusy] = useState(false)
  const [out, setOut] = useState('')
  const [err, setErr] = useState('')
  const [consented, setConsented] = useState(aiConsentGiven())

  useEffect(() => { if (open) { setPrompt(initialPrompt); setOut(''); setErr('') } }, [open, initialPrompt])

  const ideas = useMemo(() => [
    'Soft studio backdrop, warm light, minimal product scene',
    'Night sky full of stars over quiet mountains, cinematic',
    'Pastel gradient background with soft grain, abstract',
  ], [])

  const run = async () => {
    if (!prompt.trim() || busy) return
    setBusy(true); setErr(''); setOut('')
    try {
      let url
      if (lane === 'pro') {
        if (!hasGeminiKey()) throw new Error('Add your Google AI key in Settings → AI keys first.')
        url = await imageViaGemini(prompt)
      } else {
        try {
          url = await generateViaWorker(prompt)
        } catch (e) {
          if (hasGeminiKey()) { setLane('pro'); url = await imageViaGemini(prompt) }
          else throw e
        }
      }
      setOut(url)
    } catch (e) {
      setErr(e.message || 'Generation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate an image" subtitle="Type it → it becomes a layer on your canvas" width="max-w-lg">
      <Tip>
        <b>What is this?</b> Type what you want (a background, a texture, a scene) and the AI paints
        it. The result lands on your canvas as a movable layer — drag it, scale it, frame it.
      </Tip>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="Describe the image you want…"
        className="w-full resize-y rounded-ink border border-line bg-surface-2 p-3 text-sm leading-relaxed text-fg placeholder:text-mute focus:border-white focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ideas.map((i) => (
          <button key={i} type="button" onClick={() => setPrompt(i)} className="rounded-ink border border-line px-2 py-1 text-left text-[0.75rem] text-dim transition-colors hover:text-fg">
            {i.slice(0, 34)}…
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-ink border border-line">
          <button type="button" onClick={() => setLane('free')} className={cn('px-3 py-2 text-[0.8125rem] font-bold uppercase tracking-[0.08em]', lane === 'free' ? 'bg-white text-black' : 'text-dim')}>Free lane</button>
          <button type="button" onClick={() => setLane('pro')} className={cn('px-3 py-2 text-[0.8125rem] font-bold uppercase tracking-[0.08em]', lane === 'pro' ? 'bg-white text-black' : 'text-dim')}>Pro · my key</button>
        </div>
        <Button variant="primary" size="sm" icon="sparkle" disabled={busy || !prompt.trim()} onClick={run}>
          {busy ? 'Painting…' : 'Generate'}
        </Button>
        {lane === 'pro' && !hasGeminiKey() && (
          <span className="text-[0.75rem] text-danger">Needs your AI key — Settings → AI keys</span>
        )}
      </div>
      <p className="mt-2 text-[0.75rem] text-mute">
        {lane === 'free'
          ? 'Free lane — shared, rate-limited, great for backgrounds & textures.'
          : 'Pro lane — photoreal quality via your own Google AI key, ≈ $0.05–0.15 per image, watermarked by Google.'}
      </p>
      {!consented && <div className="mt-3"><ConsentGate onReady={() => setConsented(true)} what='your prompt' /></div>}
      {out && (
        <div className="mt-4">
          <img src={out} alt="Generated result" className="max-h-72 w-full rounded-ink border border-line object-contain" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="primary" size="sm" icon="plus" onClick={() => { onAddImage(out); notify('Added as a layer'); onClose() }}>Add to canvas</Button>
            <a href={out} download="inkception-generated.png" className="inline-flex h-9 items-center gap-1.5 rounded-ink border border-white/40 px-3.5 text-[0.875rem] font-semibold uppercase tracking-[0.12em] text-fg hover:border-white">Download</a>
          </div>
        </div>
      )}
      {err && <p className="mt-3 rounded-ink border border-line-2 bg-surface-2 p-3 text-[0.8125rem] text-danger">{err}</p>}
    </Modal>
  )
}

/* ------------------------------ copy / CTA -------------------------------- */

const TONES = ['friendly', 'premium', 'playful', 'bold']

export function CopyModal({ open, onClose, onInsert, notify = () => {} }) {
  const [brief, setBrief] = useState('')
  const [tone, setTone] = useState('friendly')
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [source, setSource] = useState('') // free lane | offline

  useEffect(() => { if (open) { setItems([]); setErr('') } }, [open])

  const run = async () => {
    if (busy) return
    setBusy(true); setErr(''); setItems([])
    try {
      const out = await copyViaWorker(brief, tone)
      setItems(out); setSource('free')
    } catch {
      setItems(copyOffline(brief)); setSource('offline')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="AI headlines & CTA" subtitle="Suggestions you can edit — they land as real text layers" width="max-w-lg">
      <Tip>
        <b>What is this?</b> Tell it what you're promoting. The AI writes short headlines and
        call-to-action lines. Click one and it drops onto your canvas as an editable text layer —
        change the font, size and color like any text.
      </Tip>
      <input
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="What's this for? e.g. handmade candles, autumn sale"
        className="w-full rounded-ink border border-line bg-surface-2 p-3 text-sm text-fg placeholder:text-mute focus:border-white focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {TONES.map((t) => (
          <button key={t} type="button" onClick={() => setTone(t)} className={cn('rounded-ink px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-[0.08em]', tone === t ? 'bg-white text-black' : 'border border-line text-dim hover:text-fg')}>{t}</button>
        ))}
        <Button variant="primary" size="sm" icon="sparkle" disabled={busy || !brief.trim()} onClick={run} className="ml-auto">
          {busy ? 'Writing…' : 'Suggest'}
        </Button>
      </div>
      {items.length > 0 && (
        <>
          <p className="mt-4 label-xs text-mute">{source === 'offline' ? 'Offline suggestions (the AI writer was unavailable)' : 'From the free AI lane'} · click to add</p>
          <div className="mt-2 space-y-1.5">
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onInsert(it.text, it.kind); notify('Added as a text layer — edit it freely') }}
                className="flex w-full items-center justify-between gap-3 rounded-ink border border-line px-3 py-2.5 text-left transition-colors hover:border-white"
              >
                <span className="text-sm text-fg">{it.text}</span>
                <span className="label-xxs shrink-0 text-mute">{it.kind}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {err && <p className="mt-3 text-[0.8125rem] text-danger">{err}</p>}
    </Modal>
  )
}

/* ------------------------------ animate ----------------------------------- */

export function AnimateModal({
  open, onClose, imageSrc, hasKey = false, hasLayers = false,
  onLiveFx, onDepth, notify = () => {},
}) {
  const [tab, setTab] = useState('fx')
  const [prompt, setPrompt] = useState('')
  const [useImage, setUseImage] = useState(true)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [err, setErr] = useState('')
  const [consented, setConsented] = useState(aiConsentGiven())

  useEffect(() => { if (open) { setVideoUrl(''); setErr(''); setProgress('') } }, [open])

  const runVeo = async () => {
    if (busy) return
    if (!hasGeminiKey()) { setErr('Add your Google AI key in Settings → AI keys first (one-time, ~2 minutes).'); return }
    setBusy(true); setErr(''); setVideoUrl(''); setProgress('Starting Veo…')
    try {
      let imageBase64, imageMime
      if (useImage && imageSrc) {
        const split = imageSrc.split(',')
        imageMime = (split[0].match(/data:(.*?);/) || [])[1] || 'image/png'
        imageBase64 = split[1]
      }
      const r = await videoViaGemini(prompt || 'Gentle cinematic motion, subtle life, 4 seconds', {
        imageBase64, imageMime, onProgress: setProgress,
      })
      setVideoUrl(r.url)
      notify('Video ready')
    } catch (e) {
      setErr(e.message || 'Video generation failed')
    } finally {
      setBusy(false); setProgress('')
    }
  }

  const TABS = [
    { id: 'fx', label: 'Live FX', price: 'Free', desc: 'Fireworks, sparkles, snow… drawn live over your image. Always free, works offline.' },
    { id: 'depth', label: '2.5D Depth', price: 'Free', desc: 'Your person gently drifts over the background — a living photo. Uses Extract Layers (also free).' },
    { id: 'veo', label: 'AI Video (Veo)', price: '≈ $1.20 / 8s clip', desc: 'True image-to-video: the subject actually moves (turns, smiles). Rendered by Google Veo with YOUR key — you pay Google directly (≈ $0.15/second).' },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Animate your image" subtitle="Three ways — two are free" width="max-w-lg">
      <Tip>
        <b>What is this?</b> Make a still image feel alive. Start with the free options — most
        looks need nothing more. AI Video is the movie-magic one and costs real money per second,
        so it always shows the price first.
      </Tip>
      <div className="grid grid-cols-3 gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn('flex flex-col gap-1 rounded-ink border px-2 py-2 text-left transition-colors', tab === t.id ? 'border-white bg-surface-2' : 'border-line hover:border-line-2')}
          >
            <span className="text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-fg">{t.label}</span>
            <span className={cn('text-[0.75rem] font-bold', t.price === 'Free' ? 'text-dim' : 'text-danger')}>{t.price}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[0.875rem] leading-relaxed text-dim">{TABS.find((t) => t.id === tab)?.desc}</p>

      {tab === 'fx' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" icon="sparkle" onClick={() => { onLiveFx(); onClose() }}>Open Live FX picker</Button>
          <p className="w-full text-[0.75rem] text-mute">Exports as animated GIF / MP4 include the FX.</p>
        </div>
      )}
      {tab === 'depth' && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" icon="layers" onClick={() => { onDepth(); onClose() }}>
            {hasLayers ? 'Turn on 2.5D motion' : 'Extract layers, then animate'}
          </Button>
          <p className="w-full text-[0.75rem] text-mute">{hasLayers ? 'Your Face/Person layer will drift over the background.' : 'Runs the free layer extraction first (a few seconds).'}</p>
        </div>
      )}
      {tab === 'veo' && (
        <div className="mt-4">
          {!consented && <ConsentGate onReady={() => setConsented(true)} what={useImage ? 'your image' : 'your prompt'} />}
          {consented && (
            <>
              <label className="flex items-center gap-2 text-[0.875rem] text-dim">
                <input type="checkbox" checked={useImage} onChange={(e) => setUseImage(e.target.checked)} className="h-4 w-4 accent-white" />
                Animate <b>my current image</b> {useImage ? '(image → video)' : '(text → video)'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="How should it move? e.g. she turns her head and smiles"
                className="mt-2 w-full resize-y rounded-ink border border-line bg-surface-2 p-3 text-sm text-fg placeholder:text-mute focus:border-white focus:outline-none"
              />
              <div className="mt-3 rounded-ink border border-line-2 bg-surface-2 p-3">
                <p className="text-[0.8125rem] font-bold text-fg">Cost before you click</p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-dim">
                  Veo 3.1 Fast 1080p ≈ <b>$0.15 per second</b> → a typical 8-second clip ≈ <b>$1.20</b>,
                  billed to your own Google AI key. You only pay when you press Render.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="primary" size="sm" icon="play" disabled={busy} onClick={runVeo}>
                  {busy ? progress || 'Rendering…' : 'Render video (~1–2 min)'}
                </Button>
                {!hasKey && <span className="text-[0.75rem] text-danger">No AI key yet — Settings → AI keys</span>}
              </div>
              {videoUrl && (
                <div className="mt-4">
                  <video src={videoUrl} controls autoPlay loop className="w-full rounded-ink border border-line" />
                  <a href={videoUrl} download="inkception-video.mp4" className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-ink border border-white/40 px-3.5 text-[0.875rem] font-semibold uppercase tracking-[0.12em] text-fg hover:border-white">Download MP4</a>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {err && <p className="mt-3 rounded-ink border border-line-2 bg-surface-2 p-3 text-[0.8125rem] text-danger">{err}</p>}
    </Modal>
  )
}
