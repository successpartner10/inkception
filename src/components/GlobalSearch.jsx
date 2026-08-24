// src/components/GlobalSearch.jsx
// One persistent search box — "search everything."
// Groups: Actions (via the smart synonym/taxonomy dictionary), Tools,
// Panels, Exports, Recipes, How-tos, Templates, Settings, entry points.
// ↑↓ navigate · Enter run · Esc close · / or Ctrl/Cmd+K focus from anywhere.

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../lib/utils'
import { Icon } from './Icon'
import { searchActions, scoreQuery } from '../lib/searchdict'

export function GlobalSearch({ items = [], includeActions = true, placeholder = 'Search everything…', onPick, onQueryChange, collapsible = false }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(0)
  // collapsible: the bar starts as a compact magnifying-glass icon (editor);
  // clicking it (or "/" / ⌘K) expands into the full search box.
  const [collapsed, setCollapsed] = useState(!!collapsible)
  const inputRef = useRef(null)
  const rootRef = useRef(null)

  const expand = () => {
    if (!collapsed) return
    setCollapsed(false)
    setOpen(true)
    // wait a frame so the input is mounted before focusing
    requestAnimationFrame(() => inputRef.current && inputRef.current.focus())
  }

  // focus from anywhere: "/" or ⌘/Ctrl+K (expands a collapsed bar first)
  useEffect(() => {
    const h = (e) => {
      const tag = (e.target && e.target.tagName) || ''
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        if (collapsed) {
          setCollapsed(false)
          requestAnimationFrame(() => {
            inputRef.current && inputRef.current.focus()
            setOpen(true)
          })
        } else {
          inputRef.current && inputRef.current.focus()
          setOpen(true)
        }
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQ(''); setOpen(false)
        if (collapsible) setCollapsed(true)
        else inputRef.current.blur()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [collapsed, collapsible])

  // click outside closes (and collapses a collapsible bar)
  useEffect(() => {
    const h = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        if (collapsible) setCollapsed(true)
      }
    }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [collapsible])

  const query = q.trim().toLowerCase()

  const results = useMemo(() => {
    if (!query) return []
    const groups = []
    const push = (group, list) => { if (list.length) groups.push({ group, items: list }) }
    // actions via smart dictionary
    if (includeActions) {
      push('Actions', searchActions(query, { localOnly: false }).slice(0, 12).map((r) => ({
        id: 'a-' + r.action.id,
        label: r.action.name,
        sub: r.action.desc,
        icon: r.action.icon || 'sparkle',
        act: () => onPick && onPick('action', r.action),
        score: r.score,
      })))
    }
    // everything else via generic scoring
    const others = items
      .map((it) => ({ it, score: Math.max(scoreQuery(it.label, query), scoreQuery((it.sub || '') + ' ' + (it.group || ''), query) * 0.5) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
    const byGroup = {}
    for (const { it, score } of others) {
      ;(byGroup[it.group] = byGroup[it.group] || []).push({ ...it, score })
    }
    for (const [g, list] of Object.entries(byGroup)) {
      push(g, list.sort((a, b) => b.score - a.score).slice(0, 8))
    }
    return groups
  }, [query, items, includeActions, onPick])

  const flat = results.flatMap((g) => g.items)
  useEffect(() => { setSel(0) }, [q, results.length])

  const run = (item) => { setOpen(false); item.act && item.act() }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, Math.max(0, flat.length - 1))) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (flat[sel]) run(flat[sel]) }
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      {collapsible && collapsed ? (
        <button
          type="button"
          onClick={expand}
          title="Search everything ( / )"
          aria-label="Search everything"
          className="flex h-9 w-9 items-center justify-center rounded-ink border border-line bg-surface text-mute transition-colors hover:border-white hover:text-fg"
        >
          <Icon name="search" size={15} />
        </button>
      ) : (
        <div
          className={cn(
            'flex h-9 items-center gap-2 rounded-ink border bg-surface px-2.5 transition-all',
            open ? 'border-white shadow-[0_0_14px_rgba(255,255,255,0.18)]' : 'border-line focus-within:border-white',
          )}
        >
          <Icon name="search" size={14} className="shrink-0 text-mute" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); onQueryChange && onQueryChange(e.target.value) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder={placeholder}
            aria-label="Search everything"
            className="h-full w-full min-w-0 bg-transparent text-xs text-fg placeholder:text-mute focus:outline-none"
          />
          {q ? (
            <button type="button" onClick={() => { setQ(''); setOpen(false); onQueryChange && onQueryChange(''); inputRef.current.focus() }} className="shrink-0 text-mute hover:text-fg" title="Clear" aria-label="Clear search">
              <Icon name="close" size={12} />
            </button>
          ) : collapsible ? (
            <button
              type="button"
              onClick={() => { setCollapsed(true); setOpen(false) }}
              title="Collapse search"
              aria-label="Collapse search"
              className="shrink-0 text-mute transition-colors hover:text-fg"
            >
              <Icon name="chevronLeft" size={13} />
            </button>
          ) : (
            <span className="hidden shrink-0 rounded-ink border border-line px-1.5 py-0.5 text-[0.75rem] font-bold text-mute sm:inline">/</span>
          )}
        </div>
      )}

      {open && query && (
        <div className="absolute right-0 top-full z-[80] mt-1.5 max-h-[70vh] w-full min-w-[320px] overflow-y-auto rounded-ink-lg border border-line bg-surface py-1 shadow-2xl scrollbar-thin sm:min-w-[420px]">
          {flat.length === 0 && <p className="px-4 py-6 text-center text-xs text-mute">Nothing found for “{q}” — try “shine”, “clean”, “face”…</p>}
          {results.map((g) => (
            <div key={g.group}>
              <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                <span className="label-xxs uppercase tracking-[0.12em] text-mute">{g.group} · {g.items.length}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              {g.items.map((it) => {
                const idx = flat.indexOf(it)
                return (
                  <button
                    key={it.id}
                    type="button"
                    onMouseEnter={() => setSel(idx)}
                    onClick={() => run(it)}
                    className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors', sel === idx ? 'bg-white/10' : '')}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-ink border border-line text-dim">
                      <Icon name={it.icon || 'sparkle'} size={13} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.875rem] font-semibold text-fg">{it.label}</span>
                      {it.sub && <span className="block truncate text-[0.75rem] text-mute">{it.sub}</span>}
                    </span>
                    {it.score ? <span className="label-xxs shrink-0 text-mute">{it.score}</span> : null}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
