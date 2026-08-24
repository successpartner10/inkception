// Gallery — the Home screen. Hero + project grid.
// Blueprint §3.A: 48px header (ik monogram / INKCEPTION / profile),
// hero card, 2-col scrollable project grid.

import { useEffect, useRef, useState } from 'react'
import { cn, fileToDataUrl, formatDate } from '../lib/utils'
import { EXPORT_GROUPS, EXPORT_PRESETS, PLATFORM_ICONS } from '../lib/export'
import { loadCustomPresets } from '../lib/presets'
import { Icon } from '../components/Icon'
import { Button, Chip, Highlight, IconBtn, Modal } from '../components/ui'
import { Logo } from '../components/Logo'
import { COLLAGE_LAYOUTS, computeSlots, detectCollageBoxes } from '../lib/collage'
import { GlobalSearch } from '../components/GlobalSearch'
import { GoalMenu } from '../components/GoalMenu'
import { SectionNav } from '../components/SectionNav'
import { Onboarding } from '../components/Onboarding'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'recent', label: 'Recent' },
  { id: 'archived', label: 'Archived' },
]

// Sample photos — literal asset paths so the offline build can embed them.
/* top nav sections (website-style) — same goals as before, now always
   visible instead of hidden in a dropdown */
const GALLERY_SECTIONS = [
  { id: 'open', icon: 'image', label: 'Edit', desc: 'Open a photo & edit it' },
  { id: 'fix', icon: 'sparkle', label: 'Fix & AI', desc: 'Enhance, clean, remove BG' },
  { id: 'collage', icon: 'grid', label: 'Collage', desc: 'Multi-photo grid layouts' },
  { id: 'template', icon: 'shape', label: 'Templates', desc: 'Banners & platform sizes' },
  { id: 'export', icon: 'export', label: 'Export', desc: 'Every platform size' },
  { id: 'restore', icon: 'clock', label: 'Restore', desc: 'Old & damaged photos' },
]

const SAMPLE_PHOTOS = [
  { name: 'Portrait', src: `${import.meta.env.BASE_URL}samples/portrait.jpg` },
  { name: 'City Dusk', src: `${import.meta.env.BASE_URL}samples/city.jpg` },
  { name: 'Food Flatlay', src: `${import.meta.env.BASE_URL}samples/food.jpg` },
  { name: 'Misty Pines', src: `${import.meta.env.BASE_URL}samples/nature.jpg` },
  { name: 'Sneaker', src: `${import.meta.env.BASE_URL}samples/product.jpg` },
  { name: 'Mountain', src: `${import.meta.env.BASE_URL}samples/mountain.jpg` },
  { name: 'Vase', src: `${import.meta.env.BASE_URL}samples/vase.jpg` },
  { name: 'Mono B&W', src: `${import.meta.env.BASE_URL}samples/bw.jpg` },
]

// Collage quick-starts shown in the Templates modal (visual slot previews)
const COLLAGE_QUICK = [
  { lid: 'grid2', name: 'Grid 2', sz: EXPORT_PRESETS.find((p) => p.id === 'ig-portrait') || EXPORT_PRESETS[0], desc: 'Two photos side by side' },
  { lid: 'grid4', name: 'Grid 4', sz: EXPORT_PRESETS.find((p) => p.id === 'ig-square') || EXPORT_PRESETS[0], desc: '2×2 square grid' },
  { lid: 'hero', name: 'Hero + Sidekick', sz: EXPORT_PRESETS.find((p) => p.id === 'fb-cover') || EXPORT_PRESETS[0], desc: 'Big photo + smaller companion' },
  { lid: 'circleinset', name: 'Circle Inset', sz: EXPORT_PRESETS.find((p) => p.id === 'ig-square') || EXPORT_PRESETS[0], desc: 'White background + circular frame' },
]

// Scale a real w×h canvas into a display box (keeps true aspect ratio)
function fitRect(w, h, maxW = 150, maxH = 150) {
  const s = Math.min(maxW / w, maxH / h)
  return { width: Math.max(2, Math.round(w * s)), height: Math.max(2, Math.round(h * s)) }
}

export function Gallery({ projects, onOpen, onNew, onDelete, onImportMedia, onTemplate, onStartCollage }) {
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateGroup, setTemplateGroup] = useState('all')
  const [importing, setImporting] = useState(false)
  const [gallerySearch, setGallerySearch] = useState('')
  const [refImage, setRefImage] = useState(null) // reference collage for layout detect
  const [refSlots, setRefSlots] = useState([])
  const [refBusy, setRefBusy] = useState(false)
  const refInputRef = useRef(null)
  const customPresets = loadCustomPresets()
  const allTemplates = [...EXPORT_PRESETS, ...customPresets]
  // Templates modal — ratio quick-filter + live preview stage (desktop)
  const [templateRatio, setTemplateRatio] = useState('all')
  const [stage, setStage] = useState(null) // { kind:'preset', t } | { kind:'collage', lid, name, desc, sz }
  useEffect(() => {
    if (templateOpen) { setStage(null); setTemplateRatio('all') }
  }, [templateOpen])
  // first-run guide — "What do you want to do today?" (one-time, reopenable)
  const [showOnboard, setShowOnboard] = useState(() => {
    try { return localStorage.getItem('inkception.onboard') !== '1' } catch { return true }
  })
  // goal → do the thing right here on the home screen
  const pickGoal = (action) => {
    if (action === 'open' || action === 'fix' || action === 'restore') fileRef.current && fileRef.current.click()
    else if (action === 'template' || action === 'collage' || action === 'export') setTemplateOpen(true)
  }

  const gq = gallerySearch.trim().toLowerCase()
  const matchProject = (p) => !gq || p.name.toLowerCase().includes(gq)
  const matchPreset = (p) =>
    !gq ||
    [p.name, p.platform, p.ratio, p.use, `${p.w} x ${p.h}`, `${p.w}×${p.h}`].join(' ').toLowerCase().includes(gq)
  const fileRef = useRef(null)

  // Templates modal — ratio bucket + filtered views + live preview stage
  const ratioBucket = (p) => {
    const r = p.w / p.h
    if (r <= 0.7) return 'story'
    if (r >= 0.95 && r <= 1.05) return 'square'
    if (r >= 1.6) return 'wide'
    if (r < 0.95) return 'portrait'
    return 'landscape'
  }
  const matchRatio = (p) => templateRatio === 'all' || ratioBucket(p) === templateRatio
  const visibleAll = allTemplates.filter((p) => matchPreset(p) && matchRatio(p))
  const groupItems = (g) =>
    g === 'Custom'
      ? allTemplates.filter((p) => p.custom && matchPreset(p) && matchRatio(p))
      : allTemplates.filter((p) => !p.custom && p.platform === g && matchPreset(p) && matchRatio(p))
  const sections = templateGroup === 'all'
    ? [...EXPORT_GROUPS, ...(customPresets.length ? ['Custom'] : [])]
        .map((g) => ({ g, items: groupItems(g) }))
        .filter((s) => s.items.length)
    : [{ g: templateGroup, items: groupItems(templateGroup) }].filter((s) => s.items.length)
  const collageStage = (q) => {
    const meta = COLLAGE_LAYOUTS.find((l) => l.id === q.lid)
    return {
      kind: 'collage',
      lid: q.lid,
      title: q.name,
      sub: `${q.sz.w}×${q.sz.h}${meta ? ` · ${meta.min}–${meta.max} photos` : ''}`,
      desc: q.desc,
    }
  }
  const stageView = (() => {
    if (stage && stage.kind === 'collage') return collageStage(stage)
    if (stage && stage.kind === 'preset' && visibleAll.some((p) => p.id === stage.t.id)) {
      const t = stage.t
      return { kind: 'preset', t, title: t.name, sub: `${t.w}×${t.h} · ${t.ratio}`, desc: `${t.platform}${t.use ? ' — ' + t.use : ''}` }
    }
    const fp = visibleAll[0]
    if (fp) return { kind: 'preset', t: fp, title: fp.name, sub: `${fp.w}×${fp.h} · ${fp.ratio}`, desc: `${fp.platform}${fp.use ? ' — ' + fp.use : ''}` }
    return collageStage(COLLAGE_QUICK[0])
  })()

  // paste an image from the clipboard → new project
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData && e.clipboardData.items
      if (!items) return
      for (const it of items) {
        if (it.type && it.type.startsWith('image/')) {
          e.preventDefault()
          const f = it.getAsFile()
          if (!f) return
          fileToDataUrl(f)
            .then(onImportMedia)
            .catch(() => onImportMedia(URL.createObjectURL(f)))
          return
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onImportMedia])

  const recent = [...projects]
    .filter(matchProject)
    .sort((a, b) => new Date(b.opened || b.date || 0) - new Date(a.opened || a.date || 0))
    .slice(0, 5)
  const templatePresets = allTemplates.filter((p) => (templateGroup === 'all' || p.platform === templateGroup) && matchPreset(p))

  const detectRef = async (src) => {
    setRefBusy(true)
    try {
      const boxes = await detectCollageBoxes(src)
      setRefSlots(boxes && boxes.length >= 2 ? boxes : [])
      return boxes && boxes.length >= 2 ? boxes : null
    } catch { setRefSlots([]); return null } finally { setRefBusy(false) }
  }
  const startRefCollage = async () => {
    // start a sized canvas, then open the editor's collage with the detected slots
    const size = EXPORT_PRESETS.find((p) => p.id === 'ig-square') || EXPORT_PRESETS[0]
    const slots = refSlots
    setTemplateOpen(false)
    onStartCollage({ name: 'Custom Layout', w: size.w, h: size.h, layout: 'custom', slots })
  }

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f || !f.type.startsWith('image/')) return
    setImporting(true)
    try {
      // data URL (not blob:) so the project survives page reloads
      const dataUrl = await fileToDataUrl(f)
      onImportMedia(dataUrl)
    } catch {
      onImportMedia(URL.createObjectURL(f))
    } finally {
      setImporting(false)
    }
  }

  const now = Date.now()
  const filtered = projects.filter((p) => {
    if (!matchProject(p)) return false
    if (filter === 'recent') return now - new Date(p.date).getTime() < 14 * 86400000
    if (filter === 'archived') return now - new Date(p.date).getTime() >= 14 * 86400000
    return true
  })

  return (
    <div className="flex h-full flex-col bg-ink">
      {/* Header — 48px, text-only wordmark + same search bar as the editor */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-6">
        <Logo size="sm" />
        <GlobalSearch
          items={[
            ...projects.map((p) => ({ id: 'proj-' + p.id, label: p.name, group: 'Projects', sub: p.layers + ' layers', icon: 'image', act: () => onOpen(p.id) })),
            ...allTemplates.map((t) => ({ id: 'tpl-' + t.id, label: t.name + ' Template', group: 'Templates', sub: `${t.w}×${t.h} · ${t.platform}`, icon: PLATFORM_ICONS[t.platform] || 'grid', act: () => onTemplate(t) })),
            ...SAMPLE_PHOTOS.map((sp) => ({ id: 'smp-' + sp.src, label: sp.name, group: 'Samples', sub: 'Start from a sample', icon: 'image', act: () => onImportMedia(sp.src) })),
            { id: 'new', label: 'Blank canvas', group: 'Actions & more', sub: 'Start empty', icon: 'plus', act: () => onNew() },
            { id: 'open', label: 'Open / Add Media', group: 'Actions & more', sub: 'Import an image', icon: 'folder', act: () => fileRef.current && fileRef.current.click() },
          ]}
          includeActions={false}
          placeholder="Search projects, templates, samples…"
          onQueryChange={setGallerySearch}
        />
        <IconBtn icon="info" title="Welcome guide" size={18} onClick={() => setShowOnboard(true)} />
        <IconBtn icon="user" title="Profile" size={18} />
      </header>

      {/* first-visit welcome — three doors, one click each */}
      {showOnboard && (
        <Onboarding
          onAction={(a) => {
            try { localStorage.setItem('inkception.onboard', '1') } catch { /* ignore */ }
            setShowOnboard(false)
            if (a === 'open') fileRef.current && fileRef.current.click()
            else if (a === 'template') setTemplateOpen(true)
            else if (a === 'sample') onImportMedia(SAMPLE_PHOTOS[0].src)
          }}
          onClose={() => {
            try { localStorage.setItem('inkception.onboard', '1') } catch { /* ignore */ }
            setShowOnboard(false)
          }}
        />
      )}

      {/* website-style section menu — the "What do you want to do today?"
          dropdown, broken out as visible top-level sections */}
      <SectionNav items={GALLERY_SECTIONS} onPick={pickGoal} />

      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          {/* Hero */}
          <section className="rounded-ink-lg border border-line bg-surface p-6 sm:p-10">
            <Chip active>AI-First Design Studio</Chip>
            <h1 className="mt-6 text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl">
              Start
              <br />
              creating.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-dim">
              One monochrome canvas for photography, vector, and AI compositing. Pure black. Pure
              focus.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                icon="upload"
                onClick={() => fileRef.current && fileRef.current.click()}
                disabled={importing}
              >
                {importing ? 'Importing…' : 'Open / Add Media'}
              </Button>
              <Button variant="secondary" size="lg" icon="grid" onClick={() => setTemplateOpen(true)}>
                Start from a Template
              </Button>
              <Button variant="ghost" size="lg" icon="plus" onClick={() => onNew()}>
                Blank canvas
              </Button>
            </div>
            {/* Sample photos — one click to start editing */}
            <div className="mt-8">
              <div className="mb-2 flex items-center gap-2">
                <span className="label-xs text-dim">Or start with a sample</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {SAMPLE_PHOTOS.map((s) => (
                  <button
                    key={s.src}
                    type="button"
                    title={`Open ${s.name} sample`}
                    onClick={() => onImportMedia(s.src)}
                    className="group overflow-hidden rounded-ink border border-line transition-colors hover:border-white"
                  >
                    <img src={s.src} alt={s.name} loading="lazy" className="aspect-square w-full object-cover" />
                    <span className="block truncate bg-surface px-1 py-1 text-center text-[0.6875rem] font-semibold text-dim group-hover:text-white">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </section>

          {/* Recent files — compact thumbnail strip (image-first, live previews) */}
          {recent.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-3">
                <h2 className="label-sm text-fg">Recent Files</h2>
                <Chip active>{recent.length}</Chip>
              </div>
              <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
                {recent.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpen(p.id)}
                    className="group w-40 shrink-0 text-left"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-ink border border-line bg-surface-2 transition-colors group-hover:border-white">
                      {p.thumb || (p.img && !p.template) ? (
                        <img src={p.thumb || p.img} alt="" draggable={false} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-mute">
                          <Icon name="grid" size={16} />
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 truncate text-[0.875rem] font-semibold text-fg"><Highlight text={p.name} query={gallerySearch} /></div>
                    <div className="mt-0.5 text-[0.75rem] text-mute">
                      {p.template ? `${p.template.w}×${p.template.h}` : `${p.layers} Layers`} ·{' '}
                      {formatDate(p.opened || p.date)}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          <section className="mt-12">
            {projects.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="label-sm text-fg">Projects</h2>
                    <Chip>{projects.length}</Chip>
                  </div>
                  <div className="flex gap-1">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        className={cn(
                          'h-7 rounded-ink px-2.5 text-[0.8125rem] font-bold uppercase tracking-[0.12em] transition-colors',
                          filter === f.id ? 'bg-white text-black' : 'text-mute hover:bg-surface-2 hover:text-dim',
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="mt-6 flex flex-col items-center gap-3 rounded-ink-lg border border-dashed border-line-2 py-20 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-ink border border-line text-mute">
                      <Icon name="image" size={18} />
                    </span>
                    <p className="text-sm text-dim">Nothing here yet.</p>
                    <Button variant="secondary" size="sm" icon="plus" onClick={() => onNew()}>
                      Blank canvas
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        query={gallerySearch}
                        onOpen={() => onOpen(p.id)}
                        confirmDelete={pendingDelete === p.id}
                        onAskDelete={() => setPendingDelete(pendingDelete === p.id ? null : p.id)}
                        onCancelDelete={() => setPendingDelete(null)}
                        onDelete={() => {
                          onDelete(p.id)
                          setPendingDelete(null)
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-ink-lg border border-dashed border-line-2 py-20 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-ink border border-line text-mute">
                  <Icon name="image" size={20} />
                </span>
                <p className="text-sm font-semibold text-fg">No projects yet</p>
                <p className="max-w-xs text-xs leading-relaxed text-mute">
                  Start with a new project, open an image, or pick a template.
                </p>
                <div className="mt-1 flex flex-wrap justify-center gap-3">
                  <Button variant="secondary" size="sm" icon="plus" onClick={() => onNew()}>
                    Blank canvas
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="upload"
                    onClick={() => fileRef.current && fileRef.current.click()}
                  >
                    Open / Add Media
                  </Button>
                  <Button variant="ghost" size="sm" icon="grid" onClick={() => setTemplateOpen(true)}>
                    Templates
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-line px-4 sm:px-6">
        <span className="label-xs text-mute">Monochrome Studio</span>
        <span className="label-xs text-mute">
          {window.__INKCEPTION_VERSION__ || 'v-dev'} · © 2026 Inkception
        </span>
      </footer>

      {/* Template picker — visual size cards + collage layouts + reference */}
      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Templates & Layouts"
        subtitle="Start from a platform size, a collage layout, or a reference image"
        width="max-w-3xl"
      >
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin md:flex-row md:gap-5">
          {/* ---------- live preview stage (desktop) ---------- */}
          <div className="hidden shrink-0 flex-col md:sticky md:top-0 md:flex md:w-56">
            <span className="label-xs mb-2 text-dim">Preview</span>
            <div className="flex h-44 items-center justify-center rounded-ink-lg border border-line bg-surface-2/60">
              {stageView.kind === 'collage' ? (
                <div className="h-32 w-32 overflow-hidden rounded-[6px]">
                  <CollageMini lid={stageView.lid} big />
                </div>
              ) : stageView.kind === 'preset' ? (
                <div
                  className="flex items-center justify-center rounded-[4px] border border-white/60 bg-white/5"
                  style={fitRect(stageView.t.w, stageView.t.h, 150, 150)}
                >
                  <Icon name={PLATFORM_ICONS[stageView.t.platform] || 'grid'} size={16} className="text-white/50" />
                </div>
              ) : null}
            </div>
            <div className="mt-3 min-h-[64px]">
              <div className="truncate text-xs font-bold text-fg">{stageView.title}</div>
              <div className="mt-0.5 text-[0.8125rem] text-mute">{stageView.sub}</div>
              <div className="mt-1.5 text-[0.75rem] leading-relaxed text-dim">{stageView.desc}</div>
            </div>
            <p className="mt-3 border-t border-line pt-2 text-[0.7rem] leading-relaxed text-mute">
              Tap any size to open a blank canvas at exactly that size. Hover the cards to preview.
            </p>
          </div>

          {/* ---------- picker ---------- */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* platform groups */}
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setTemplateGroup('all')}
                className={cn(
                  'shrink-0 rounded-ink px-3 py-1.5 text-[0.8125rem] font-bold uppercase tracking-[0.12em] transition-colors',
                  templateGroup === 'all' ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
                )}
              >
                All · {visibleAll.length}
              </button>
              {EXPORT_GROUPS.map((g) => {
                const n = allTemplates.filter((p) => !p.custom && p.platform === g && matchPreset(p) && matchRatio(p)).length
                if (!n) return null
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setTemplateGroup(g)}
                    className={cn(
                      'shrink-0 rounded-ink px-3 py-1.5 text-[0.8125rem] font-bold uppercase tracking-[0.12em] transition-colors',
                      templateGroup === g ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
                    )}
                  >
                    {g} · {n}
                  </button>
                )
              })}
              {customPresets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTemplateGroup('Custom')}
                  className={cn(
                    'shrink-0 rounded-ink px-3 py-1.5 text-[0.8125rem] font-bold uppercase tracking-[0.12em] transition-colors',
                    templateGroup === 'Custom' ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
                  )}
                >
                  Custom · {allTemplates.filter((p) => p.custom && matchPreset(p) && matchRatio(p)).length}
                </button>
              )}
            </div>

            {/* ratio quick-filters */}
            <div className="no-scrollbar -mt-1 flex gap-1 overflow-x-auto pb-1">
              {[
                ['all', 'All ratios'],
                ['square', 'Square'],
                ['portrait', 'Portrait'],
                ['landscape', 'Landscape'],
                ['story', 'Story'],
                ['wide', 'Wide'],
              ].map(([rid, rl]) => (
                <button
                  key={rid}
                  type="button"
                  onClick={() => setTemplateRatio(rid)}
                  className={cn(
                    'shrink-0 rounded-ink px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-[0.1em] transition-colors',
                    templateRatio === rid ? 'bg-white text-black' : 'border border-line text-dim hover:text-white',
                  )}
                >
                  {rl}
                </button>
              ))}
            </div>

            {/* size cards, grouped */}
            {sections.length === 0 ? (
              <p className="rounded-ink border border-dashed border-line px-4 py-8 text-center text-xs text-mute">
                No sizes match — try another filter.
              </p>
            ) : (
              sections.map(({ g, items }) => (
                <div key={g}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <Icon name={PLATFORM_ICONS[g] || 'grid'} size={13} className="text-mute" />
                    <span className="label-xs text-dim">{g}</span>
                    <span className="label-xxs text-mute">{items.length}</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
                    {items.map((t) => (
                      <TemplateTile
                        key={t.id}
                        t={t}
                        query={gallerySearch}
                        onHover={() => setStage({ kind: 'preset', t })}
                        onStart={() => {
                          setTemplateOpen(false)
                          onTemplate({ w: t.w, h: t.h, label: `${t.name} (${t.w}×${t.h})` })
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Collage quick-starts — visual layout previews */}
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Icon name="grid" size={13} className="text-mute" />
                <span className="label-xs text-dim">Collage layouts</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {COLLAGE_QUICK.map((q) => {
                  const meta = COLLAGE_LAYOUTS.find((l) => l.id === q.lid)
                  return (
                    <button
                      key={q.lid}
                      type="button"
                      onMouseEnter={() => setStage({ kind: 'collage', ...q })}
                      onClick={() => {
                        setTemplateOpen(false)
                        onStartCollage({ name: q.name, w: q.sz.w, h: q.sz.h, layout: q.lid, slots: null })
                      }}
                      title={q.desc}
                      className="group rounded-ink border border-line p-1.5 text-left transition-colors hover:border-white"
                    >
                      <div className="h-16 w-full overflow-hidden rounded-[4px]">
                        <CollageMini lid={q.lid} />
                      </div>
                      <span className="mt-1 block truncate text-[0.75rem] font-bold uppercase tracking-[0.05em] text-fg">{q.name}</span>
                      <span className="block text-[0.6875rem] text-mute">
                        {q.sz.w}×{q.sz.h}{meta ? ` · ${meta.min}–${meta.max} photos` : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom layout from a reference image */}
            <div className="rounded-ink border border-line bg-surface-2/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[0.875rem] font-bold text-fg">Collage / Custom layout</div>
                  <div className="mt-0.5 text-[0.75rem] text-mute">Upload a reference collage — the layout is detected, then you add photos in the editor</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="sm" icon="upload" onClick={() => refInputRef.current && refInputRef.current.click()} disabled={refBusy}>
                    {refBusy ? 'Detecting…' : refImage ? 'Change reference' : 'Upload reference'}
                  </Button>
                  {refSlots.length >= 2 && (
                    <Button variant="primary" size="sm" icon="grid" onClick={startRefCollage}>
                      Start ({refSlots.length} slots)
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={refInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files && e.target.files[0]
                  e.target.value = ''
                  if (!f || !f.type.startsWith('image/')) return
                  const r = new FileReader()
                  r.onload = async () => {
                    setRefImage(r.result)
                    await detectRef(r.result)
                  }
                  r.readAsDataURL(f)
                }}
              />
              {refImage && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-ink border border-line">
                    <img src={refImage} alt="reference" className="h-full w-full object-contain opacity-30" />
                    {refSlots.map((s, i) => (
                      <span key={i} className="absolute border-2 border-white/90" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%`, height: `${s.h * 100}%` }} />
                    ))}
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <span className="label-xs text-dim">{refSlots.length >= 2 ? `${refSlots.length} slots detected` : refBusy ? 'Detecting layout…' : 'No clear layout found'}</span>
                    <span className="text-[0.75rem] leading-relaxed text-mute">{refSlots.length >= 2 ? 'Start opens the editor with this layout — your photos fill the boxes.' : 'Try a reference with clear gaps/gutters between photos.'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ProjectCard({ project, onOpen, confirmDelete, onAskDelete, onCancelDelete, onDelete, query = '' }) {
  return (
    <div className="group cursor-pointer" onClick={onOpen}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-ink-lg border border-line bg-surface-2 transition-colors duration-150 group-hover:border-white">
        {project.thumb || (project.img && !project.template) ? (
          <img
            src={project.thumb || project.img}
            alt={project.name}
            draggable={false}
            className="h-full w-full object-cover opacity-90 transition-opacity duration-150 group-hover:opacity-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-mute">
            <Icon name="grid" size={22} />
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/55 to-transparent p-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <span className="label-xs text-white/80">Open →</span>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onDelete() }}>
                Confirm
              </Button>
              <IconBtn icon="close" title="Cancel" onClick={(e) => { e.stopPropagation(); onCancelDelete() }} />
            </div>
          ) : (
            <IconBtn
              icon="trash"
              title="Delete project"
              className="bg-black/30"
              onClick={(e) => {
                e.stopPropagation()
                onAskDelete()
              }}
            />
          )}
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold"><Highlight text={project.name} query={query} /></div>
          <div className="mt-0.5 text-[0.875rem] text-mute">
            {project.layers} Layers · {formatDate(project.date)}
          </div>
        </div>
        {project.status === 'edited' && <Chip>Edited</Chip>}
      </div>
    </div>
  )
}

/* size card for the Templates modal — real aspect-ratio mini canvas */
function TemplateTile({ t, query = '', onHover, onStart }) {
  const r = fitRect(t.w, t.h, 44, 44)
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onStart}
      title={`${t.name} — ${t.w}×${t.h} · ${t.ratio}${t.use ? ' (' + t.use + ')' : ''}`}
      className="group flex flex-col items-center gap-1 rounded-ink border border-line p-2 text-left transition-colors hover:border-white"
    >
      <span className="flex h-14 w-full items-center justify-center">
        <span
          className="flex items-center justify-center rounded-[3px] border border-line-2 bg-surface-2 text-mute transition-colors group-hover:border-white/70 group-hover:text-fg"
          style={{ width: r.width, height: r.height }}
        >
          <Icon name={PLATFORM_ICONS[t.platform] || 'grid'} size={12} />
        </span>
      </span>
      <span className="w-full truncate text-center text-[0.75rem] font-bold uppercase tracking-[0.05em] text-fg">
        <Highlight text={t.name} query={query} />
      </span>
      <span className="text-[0.6875rem] text-mute">{t.w}×{t.h}</span>
    </button>
  )
}

/* mini collage layout preview — slot boxes at the layout's real proportions */
function CollageMini({ lid, big = false }) {
  const meta = COLLAGE_LAYOUTS.find((l) => l.id === lid)
  if (!meta) return null
  const slots = computeSlots(lid, meta.min, 1, 1, { circlePos: 'br' })
  return (
    <div className={cn('relative h-full w-full overflow-hidden rounded-[3px]', meta.whiteBack ? 'bg-white' : 'bg-white/10')}>
      {slots.map((s, i) => (
        <span
          key={i}
          className={cn('absolute overflow-hidden', s.circle ? (big ? 'rounded-full shadow-[0_0_0_3px_#fff]' : 'rounded-full') : 'rounded-[2px]')}
          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%`, height: `${s.h * 100}%` }}
        >
          <span className={cn('block h-full w-full', s.circle ? 'bg-white/90' : 'bg-white/70')} />
        </span>
      ))}
    </div>
  )
}
