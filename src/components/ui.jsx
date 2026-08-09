// Core UI primitives — Button, Chip, Segmented, Modal, Toast, Slider,
// ActionCard, LayerRow. All follow the Inkception design system.

import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'
import { Icon } from './Icon'

/* ---------------------------------- Button --------------------------------- */

const VARIANTS = {
  primary: 'bg-white text-black hover:bg-[#e8e8e8] active:bg-white',
  secondary:
    'border border-white/40 text-fg hover:border-white hover:text-white active:bg-white/5',
  ghost: 'text-dim hover:text-fg hover:bg-white/5',
  danger: 'text-danger hover:bg-danger/10',
}

const SIZES = {
  sm: 'h-8 px-3 text-[11px] gap-1.5',
  md: 'h-10 px-4 text-xs gap-2',
  lg: 'h-12 px-6 text-[13px] gap-2.5',
  icon: 'h-9 w-9 p-0 justify-center',
  iconSm: 'h-7 w-7 p-0 justify-center',
}

export function Button({
  variant = 'ghost',
  size = 'md',
  icon,
  iconRight,
  active,
  className,
  children,
  ...rest
}) {
  const iconOnly = !children
  return (
    <button
      type="button"
      className={cn(
        'inline-flex select-none items-center justify-center rounded-ink font-semibold uppercase tracking-[0.12em] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-35',
        VARIANTS[variant],
        SIZES[iconOnly ? (size === 'sm' ? 'iconSm' : 'icon') : size],
        active && 'bg-white text-black hover:bg-white',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'iconSm' ? 13 : 15} />}
      {children}
      {iconRight && <Icon name={iconRight} size={15} />}
    </button>
  )
}

/** Small square icon button used in bars/rows. */
export function IconBtn({ icon, active, disabled, className, title, onClick, size = 16 }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-ink transition-colors disabled:pointer-events-none disabled:opacity-35',
        active ? 'bg-white text-black' : 'text-dim hover:bg-white/5 hover:text-fg',
        className,
      )}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}

/* ----------------------------------- Chip ----------------------------------- */

export function Chip({ children, active, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-ink bg-surface-2 px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.14em] text-dim',
        active && 'bg-white text-black',
        className,
      )}
    >
      {children}
    </span>
  )
}

/* --------------------------------- Segmented -------------------------------- */

export function Segmented({ items, value, onChange, className }) {
  return (
    <div className={cn('flex border-b border-line', className)}>
      {items.map((it) => {
        const isActive = value === it.id
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cn(
              'relative flex h-12 items-center gap-2 px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors',
              isActive ? 'text-white' : 'text-mute hover:text-dim',
            )}
          >
            {it.icon && <Icon name={it.icon} size={14} strokeWidth={1.8} />}
            {it.label}
            {isActive && <span className="absolute inset-x-2 bottom-0 h-[2px] bg-white" />}
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------- Modal ---------------------------------- */

export function Modal({ open, onClose, title, subtitle, width = 'max-w-md', children }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'flex max-h-[88vh] w-full flex-col overflow-hidden rounded-ink-lg border border-line bg-surface',
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-line pl-5 pr-3">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[10px] text-mute">{subtitle}</p>}
          </div>
          <IconBtn icon="close" title="Close" onClick={onClose} />
        </div>
        <div className="min-h-0 overflow-y-auto p-5 scrollbar-thin">{children}</div>
      </div>
    </div>
  )
}

/* ----------------------------------- Toast ---------------------------------- */

export function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [toast, onDone])

  if (!toast) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-ink bg-white px-4 py-2.5 text-xs font-semibold text-black ring-1 ring-black/20">
      <Icon name={toast.icon ?? 'check'} size={14} />
      {toast.msg}
    </div>
  )
}

/* ---------------------------------- Slider ---------------------------------- */
// Minimalist 1px track; white fill for the active segment; white circle thumb.

export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  onChange,
  onCommit,
  format,
  suffix = '',
}) {
  const ref = useRef(null)
  const [dragging, setDragging] = useState(false)
  const pct = ((value - min) / (max - min)) * 100
  const isReset = defaultValue !== undefined && Math.abs(value - defaultValue) < step / 2

  const update = (clientX) => {
    const rect = ref.current.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const v = min + t * (max - min)
    onChange(step ? Math.round(v / step) * step : v)
  }

  const reset = () => {
    if (defaultValue === undefined) return
    onChange(defaultValue)
    onCommit?.()
  }

  return (
    <div className="group select-none py-1.5">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="label-xs text-dim">{label}</span>
        <div className="flex items-center gap-1.5">
          {!isReset && defaultValue !== undefined && (
            <button
              type="button"
              title="Reset"
              onClick={reset}
              className="flex h-5 w-5 items-center justify-center rounded-ink text-mute opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
            >
              <Icon name="refresh" size={11} />
            </button>
          )}
          <span className="w-10 text-right text-xs tabular-nums text-fg">
            {format ? format(value) : `${value}${suffix}`}
          </span>
        </div>
      </div>
      <div
        ref={ref}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault()
            onChange(Math.max(min, value - step))
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault()
            onChange(Math.min(max, value + step))
          } else if (e.key === 'Enter') {
            reset()
          }
        }}
        onPointerDown={(e) => {
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          setDragging(true)
          update(e.clientX)
        }}
        onPointerMove={(e) => dragging && update(e.clientX)}
        onPointerUp={() => {
          if (dragging) {
            setDragging(false)
            onCommit?.()
          }
        }}
        onPointerCancel={() => {
          setDragging(false)
          onCommit?.()
        }}
        onDoubleClick={reset}
        className="relative flex h-6 touch-none cursor-pointer items-center"
      >
        <div className="relative h-px w-full bg-line-2">
          <div className="absolute inset-y-0 left-0 bg-fg" style={{ width: `${pct}%` }} />
        </div>
        <div
          className="pointer-events-none absolute h-[13px] w-[13px] rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.7)]"
          style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
        />
      </div>
    </div>
  )
}

/* -------------------------------- ActionCard -------------------------------- */
// Large surface button with 1px ghost border — AI suite actions.

export function ActionCard({ icon, title, desc, onClick, busy, progress, disabled, tag }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        'group relative flex flex-col items-start gap-3 overflow-hidden rounded-ink border p-4 text-left transition-colors duration-150',
        busy ? 'border-line-2 bg-surface-2' : 'border-line hover:border-white',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-ink border border-line text-fg transition-colors group-hover:border-line-2">
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border border-white/25 border-t-white" />
        ) : (
          <Icon name={icon} size={18} />
        )}
      </span>
      <span className="text-xs font-bold uppercase tracking-[0.1em] text-fg">{title}</span>
      <span className="text-[11px] leading-relaxed text-mute">{desc}</span>
      {tag && (
        <span className="absolute right-3 top-3">
          <Chip active>{tag}</Chip>
        </span>
      )}
      {busy && progress !== null && (
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-line-2">
          <span className="block h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
        </span>
      )}
    </button>
  )
}

/* --------------------------------- LayerRow --------------------------------- */

export function LayerRow({ layer, preview, selected, onSelect, onToggleVisibility, onToggleLock }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-ink border px-2.5 py-2 transition-colors',
        selected ? 'border-white bg-surface-2' : 'border-transparent hover:border-line hover:bg-surface-2',
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-ink border border-line bg-ink">
        {preview}
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-xs font-semibold', !layer.visible && 'text-mute')}>
          {layer.name}
        </div>
        <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-mute">
          {layer.type}
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <IconBtn
          icon={layer.visible ? 'eye' : 'eyeOff'}
          size={15}
          title={layer.locked ? 'Locked' : layer.visible ? 'Hide layer' : 'Show layer'}
          disabled={layer.locked}
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility()
          }}
        />
        <IconBtn
          icon={layer.locked ? 'lock' : 'lockOpen'}
          size={15}
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock()
          }}
        />
      </div>
    </div>
  )
}
