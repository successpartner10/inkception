// src/components/SectionNav.jsx
// Website-style section menu — replaces the tucked-away "What do you want
// to do today?" dropdown. Every workflow (Edit · Pixel Studio · Fix & AI ·
// Collage · Template · Layers · Export · Restore) is a visible, labelled
// nav item across the top, so nothing hides behind search.
//
// Sections are plain data — each screen passes its own items + onPick.

import { cn } from '../lib/utils'
import { Icon } from './Icon'

export function SectionNav({ items, onPick, active }) {
  return (
    <nav
      aria-label="Sections"
      className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-line px-2 py-1.5 no-scrollbar sm:justify-center sm:gap-1 sm:px-4"
    >
      {items.map((it) => {
        const isActive = active === it.id
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onPick(it.id)}
            title={it.desc || it.label}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-ink px-2.5 py-1.5 text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] transition-colors',
              isActive ? 'bg-white text-black' : 'text-dim hover:bg-white/5 hover:text-fg',
            )}
          >
            {it.icon && <Icon name={it.icon} size={15} strokeWidth={2.2} />}
            <span>{it.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
