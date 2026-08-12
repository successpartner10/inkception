// src/components/GoalMenu.jsx
// "What do you want to do today?" — an always-available dropdown (not a
// one-time modal). The trigger sits in the header; opening it shows what
// Inkception can do. Clicking a goal runs the right action on this screen,
// and each goal expands to a short "here's how" with steps.
import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'
import { Icon } from './Icon'
import { GOALS } from '../lib/goals'

export function GoalMenu({ onPick, autoOpen = false, compact = false }) {
  const [open, setOpen] = useState(autoOpen)
  const [expandedId, setExpandedId] = useState(null)
  const rootRef = useRef(null)

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (g) => {
    // the welcome has been seen — the dropdown stays available as a button
    try { localStorage.setItem('inkception.onboard', '1') } catch { /* ignore */ }
    setOpen(false)
    setExpandedId(null)
    onPick(g.action)
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setExpandedId(null) }}
        title="What do you want to do today?"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-ink border transition-colors',
          open ? 'border-white bg-surface-2 text-fg' : 'border-line text-dim hover:border-white hover:text-fg',
          compact ? 'px-2' : 'px-2.5',
        )}
      >
        <Icon name="sparkle" size={compact ? 14 : 15} className={open ? 'text-white' : ''} />
        {!compact && (
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.1em] sm:inline">What do you want to do?</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[80] mt-1.5 w-[min(92vw,340px)] overflow-hidden rounded-ink-lg border border-line bg-surface shadow-2xl">
          <div className="border-b border-line px-3 py-2.5">
            <div className="text-xs font-bold text-fg">Welcome to Inkception</div>
            <div className="mt-0.5 text-[9px] text-mute">What do you want to do today? Everything is free & runs on this device.</div>
          </div>

          <div className="max-h-[62vh] overflow-y-auto p-1.5 scrollbar-thin">
            {GOALS.map((g) => (
              <div key={g.id} className="rounded-ink transition-colors hover:bg-white/5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => pick(g)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-left"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ink bg-white/10 text-fg">
                      <Icon name={g.icon} size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-bold text-fg">{g.title}</span>
                      <span className="block truncate text-[9px] text-mute">{g.desc}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                    title={`How to ${g.title}`}
                    aria-label={`How to ${g.title}`}
                    className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-ink text-mute transition-colors hover:bg-white/10 hover:text-fg"
                  >
                    <Icon name="chevronDown" size={12} className={cn('transition-transform', expandedId === g.id && 'rotate-180')} />
                  </button>
                </div>
                {expandedId === g.id && (
                  <ol className="mb-2 space-y-1.5 border-l border-line pl-6 pr-3">
                    {g.steps.map((st, i) => (
                      <li key={i} className="flex gap-2 text-[10px] leading-relaxed text-dim">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[8px] font-bold text-fg">{i + 1}</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-line bg-surface-2/50 px-3 py-2 text-[9px] text-mute">
            No account · no uploads · nothing leaves your browser
          </div>
        </div>
      )}
    </div>
  )
}
