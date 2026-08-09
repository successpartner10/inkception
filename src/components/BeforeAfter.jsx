// Before/After comparison overlay.
// White 2px divider + 32px circular handle; left clip shows the original
// (unfiltered) image, the base layer shows the edited version.

import { useRef } from 'react'
import { clamp } from '../lib/utils'
import { Icon } from './Icon'

export function BeforeAfter({ src, filter, pos, onChange, onCommit }) {
  const ref = useRef(null)

  const update = (clientX) => {
    const rect = ref.current.getBoundingClientRect()
    if (!rect.width) return
    onChange(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100))
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-20 cursor-ew-resize touch-none select-none"
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        update(e.clientX)
      }}
      onPointerMove={(e) => e.buttons === 1 && update(e.clientX)}
      onPointerUp={onCommit}
      onPointerCancel={onCommit}
    >
      {/* edited base */}
      <img
        src={src}
        alt="Edited"
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ filter }}
      />
      {/* original clip */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img src={src} alt="Original" draggable={false} className="absolute inset-0 h-full w-full object-contain" />
      </div>

      {/* divider + handle */}
      <div className="pointer-events-none absolute inset-y-0 w-[2px] bg-white" style={{ left: `${pos}%` }}>
        <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-black/50 text-white">
          <Icon name="compare" size={14} />
        </div>
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-ink bg-black/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/85">
        Original
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-ink bg-black/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/85">
        Edited
      </span>
    </div>
  )
}
