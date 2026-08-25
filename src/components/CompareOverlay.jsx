// src/components/CompareOverlay.jsx
// Compare v2 — the honest before/after:
//   • side A defaults to the TRUE original file (not "current minus filters")
//   ◀ ▶ steppers walk any side through every saved visual version
//   • dropdowns pick any two versions directly
//   • Side-by-side mode + slider mode
//   • one-click "Revert to original" (still undoable via History)

import { useRef, useState } from 'react'
import { clamp } from '../lib/utils'
import { Icon } from './Icon'
import { cn } from '../lib/utils'

function VerSelect({ versions, idx, onPick, side }) {
  return (
    <label className="flex min-w-0 items-center gap-1">
      <span className="label-xxs shrink-0 text-white/60">{side}</span>
      <select
        value={idx}
        onChange={(e) => onPick(Number(e.target.value))}
        className="max-w-[11rem] truncate rounded-ink border border-white/25 bg-black/60 px-1.5 py-1 text-[0.75rem] font-bold text-white focus:border-white focus:outline-none"
      >
        {versions.map((v, i) => (
          <option key={i} value={i} className="bg-[#161616]">
            {i === 0 ? 'Original' : `v${i} · ${(v.label || 'Edit').slice(0, 18)}`}
          </option>
        ))}
      </select>
    </label>
  )
}

export function CompareOverlay({ versions, onClose, onRevertOriginal }) {
  const last = versions.length - 1
  const [idxA, setIdxA] = useState(0)
  const [idxB, setIdxB] = useState(last)
  const [pos, setPos] = useState(50)
  const [side, setSide] = useState(false) // slider | side-by-side
  const dragRef = useRef(null)

  const A = versions[Math.min(idxA, last)] || versions[0]
  const B = versions[Math.max(0, Math.min(idxB, last))] || versions[0]

  const update = (clientX) => {
    if (!dragRef.current) return
    const rect = dragRef.current.getBoundingClientRect()
    if (!rect.width) return
    setPos(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100))
  }

  const stepBtn = 'flex h-7 w-7 items-center justify-center rounded-ink border border-white/25 text-white/80 transition-colors hover:border-white hover:text-white'

  return (
    <div className="absolute inset-0 z-30 select-none bg-ink/95">
      {/* control bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-center gap-1.5 bg-black/75 px-3 py-2 backdrop-blur-sm">
        <VerSelect versions={versions} idx={idxA} onPick={setIdxA} side="A" />
        <button type="button" aria-label="A previous" className={stepBtn} onClick={() => setIdxA((i) => Math.max(0, i - 1))}>‹</button>
        <button type="button" aria-label="A next" className={stepBtn} onClick={() => setIdxA((i) => Math.min(last, i + 1))}>›</button>
        <button
          type="button"
          title="Swap sides"
          onClick={() => { setIdxA(idxB); setIdxB(idxA) }}
          className="flex h-7 items-center rounded-ink border border-white/25 px-2 text-[0.75rem] font-bold text-white/80 transition-colors hover:border-white hover:text-white"
        >
          ⇄
        </button>
        <button type="button" aria-label="B previous" className={stepBtn} onClick={() => setIdxB((i) => Math.max(0, i - 1))}>‹</button>
        <button type="button" aria-label="B next" className={stepBtn} onClick={() => setIdxB((i) => Math.min(last, i + 1))}>›</button>
        <VerSelect versions={versions} idx={idxB} onPick={setIdxB} side="B" />
        <span className="mx-1 h-5 w-px bg-white/20" />
        <button
          type="button"
          onClick={() => setSide((v) => !v)}
          className="flex h-7 items-center gap-1.5 rounded-ink border border-white/25 px-2 text-[0.75rem] font-bold text-white/80 transition-colors hover:border-white hover:text-white"
        >
          <Icon name={side ? 'compare' : 'grid'} size={12} /> {side ? 'Slider' : 'Side-by-side'}
        </button>
        <button
          type="button"
          onClick={onRevertOriginal}
          className="flex h-7 items-center gap-1.5 rounded-ink bg-white px-2.5 text-[0.75rem] font-extrabold text-black"
          title="Restore the original photo (layers you added stay; undo still works)"
        >
          ⤺ Revert to original
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close compare"
          className="flex h-7 w-7 items-center justify-center rounded-ink border border-white/25 text-white/80 hover:border-white hover:text-white"
        >
          <Icon name="close" size={13} />
        </button>
      </div>

      {side ? (
        <div className="absolute inset-0 top-14 grid grid-cols-2 gap-2 p-3">
          {[A, B].map((v, i) => (
            <div key={i} className="relative flex min-h-0 items-center justify-center rounded-ink border border-white/15 bg-black/40">
              <img src={v.url} alt="" draggable={false} className="max-h-full max-w-full object-contain" />
              <span className="absolute left-2 top-2 rounded-ink bg-black/70 px-2 py-0.5 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white/85">
                {i === 0 ? 'A' : 'B'} · {versions.indexOf(v) === 0 ? 'Original' : `v${versions.indexOf(v)}`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={dragRef}
          className="absolute inset-0 cursor-ew-resize touch-none"
          onPointerDown={(e) => {
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            update(e.clientX)
          }}
          onPointerMove={(e) => e.buttons === 1 && update(e.clientX)}
        >
          {/* B base */}
          <img src={B.url} alt="After" draggable={false} className="absolute inset-0 h-full w-full object-contain p-6 pt-20" />
          {/* A clip */}
          <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <img src={A.url} alt="Before" draggable={false} className="absolute inset-0 h-full w-full object-contain p-6 pt-20" />
          </div>
          {/* divider */}
          <div className="pointer-events-none absolute inset-y-0 w-[2px] bg-white" style={{ left: `${pos}%` }}>
            <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-black/60 text-white">
              <Icon name="compare" size={14} />
            </div>
          </div>
          <span className="pointer-events-none absolute left-3 top-16 z-10 rounded-ink bg-black/70 px-2 py-0.5 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white/85">
            A · {idxA === 0 ? 'Original' : `v${idxA}`}
          </span>
          <span className="pointer-events-none absolute right-3 top-16 z-10 rounded-ink bg-black/70 px-2 py-0.5 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white/85">
            B · {idxB === last ? 'Current' : `v${idxB}`}
          </span>
        </div>
      )}
    </div>
  )
}
