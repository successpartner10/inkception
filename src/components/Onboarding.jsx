// src/components/Onboarding.jsx
// First-visit welcome — three plain-language doors so a brand-new user
// lands inside a real task in one click. No jargon, no tour to sit through.

import { Button } from './ui'
import { Icon } from './Icon'

const CARDS = [
  {
    icon: 'image',
    title: 'Fix a photo',
    desc: 'Open any photo — brighten it, cut out the background, remove text. AI does the heavy lifting, you stay in control.',
    cta: 'Pick a photo',
    action: 'open',
  },
  {
    icon: 'shape',
    title: 'Make a banner',
    desc: 'Instagram, YouTube, website sizes. Drop a face onto a banner and drag until it looks right.',
    cta: 'Choose a size',
    action: 'template',
  },
  {
    icon: 'sparkle',
    title: 'Try the AI magic',
    desc: 'Split a photo into layers, describe an image with AI, generate new ones, even animate. Start from a sample — no upload needed.',
    cta: 'Open a sample',
    action: 'sample',
  },
]

export function Onboarding({ onAction, onClose, sampleSrc }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-3xl rounded-ink-lg border border-line bg-surface p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-fg">Welcome to Inkception</h2>
            <p className="mt-1.5 text-sm text-dim">Pick a door — you can do everything else later from the menu on top.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip"
            className="rounded-ink px-3 py-1.5 text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-mute transition-colors hover:text-fg"
          >
            Skip
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {CARDS.map((c) => (
            <button
              key={ c.action }
              type="button"
              onClick={() => onAction(c.action)}
              className="group flex h-full flex-col items-start gap-3 rounded-ink-lg border border-line bg-surface-2 p-4 text-left transition-colors hover:border-white"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-ink border border-line-2 text-fg">
                <Icon name={c.icon} size={22} strokeWidth={1.8} />
              </span>
              <span className="text-lg font-extrabold text-fg">{c.title}</span>
              <span className="text-[0.875rem] leading-relaxed text-dim">{c.desc}</span>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-fg group-hover:text-white">
                {c.cta} <Icon name="chevronRight" size={14} />
              </span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-[0.75rem] text-mute">
          Tips for beginners are switched on — every tool explains itself in plain words.
          Turn them off any time in Settings. {sampleSrc ? '' : ''}
        </p>
      </div>
    </div>
  )
}

/** Small dismissible fast-path strip for the editor (novice orientation). */
export function FastPathRibbon({ onOpen, onExport, onDismiss }) {
  const step = 'flex items-center gap-2 rounded-ink bg-surface-2 px-3 py-1.5'
  const num = 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[0.75rem] font-extrabold text-black'
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-b border-line px-3 py-2">
      <div className={step}>
        <span className={num}>1</span>
        <button type="button" onClick={onOpen} className="text-[0.8125rem] font-bold text-dim underline-offset-4 hover:text-fg hover:underline">Open your photo</button>
      </div>
      <span className="text-mute">→</span>
      <div className={step}>
        <span className={num}>2</span>
        <span className="text-[0.8125rem] font-bold text-dim">Pick a section above (Edit · Pixel Studio · Fix &amp; AI…)</span>
      </div>
      <span className="text-mute">→</span>
      <div className={step}>
        <span className={num}>3</span>
        <button type="button" onClick={onExport} className="text-[0.8125rem] font-bold text-dim underline-offset-4 hover:text-fg hover:underline">Export</button>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Hide guide" className="ml-1 rounded-ink px-2 py-1 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-mute hover:text-fg">
        Hide
      </button>
    </div>
  )
}
