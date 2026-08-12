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
import { detectCollageBoxes } from '../lib/collage'
import { GlobalSearch } from '../components/GlobalSearch'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'recent', label: 'Recent' },
  { id: 'archived', label: 'Archived' },
]

// Sample photos — literal asset paths so the offline build can embed them.
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
  // first-run hint — one-time, dismissible
  const [showIntro, setShowIntro] = useState(() => {
    try { return localStorage.getItem('inkception.intro') !== '1' } catch { return true }
  })
  const dismissIntro = () => {
    try { localStorage.setItem('inkception.intro', '1') } catch { /* ignore */ }
    setShowIntro(false)
  }

  const gq = gallerySearch.trim().toLowerCase()
  const matchProject = (p) => !gq || p.name.toLowerCase().includes(gq)
  const matchPreset = (p) =>
    !gq ||
    [p.name, p.platform, p.ratio, p.use, `${p.w} x ${p.h}`, `${p.w}×${p.h}`].join(' ').toLowerCase().includes(gq)
  const fileRef = useRef(null)

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
        <IconBtn icon="user" title="Profile" size={17} />
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          {/* First-run hint — free, local, everything is on-device */}
          {showIntro && (
            <div className="mb-6 flex items-start gap-3 rounded-ink-lg border border-white/20 bg-surface p-4 sm:items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ink bg-white text-black">
                <Icon name="sparkle" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold">Everything here is free & local.</p>
                <p className="mt-1 text-[10px] leading-relaxed text-mute">
                  Open a photo, run one-click Actions (Actions tab), type things like “remove background” or “run my recipe” in the AI bar — no account, no uploads, nothing leaves this device.
                </p>
              </div>
              <button type="button" onClick={dismissIntro} className="shrink-0 rounded-ink border border-line px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-dim transition-colors hover:border-white hover:text-white">
                Got it
              </button>
            </div>
          )}

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
                    <span className="block truncate bg-surface px-1 py-1 text-center text-[8px] font-semibold text-dim group-hover:text-white">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </section>

          {/* Recent files */}
          {recent.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-3">
                <h2 className="label-sm text-fg">Recent Files</h2>
                <Chip active>{recent.length}</Chip>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpen(p.id)}
                    className="group flex items-center gap-3 rounded-ink border border-line p-2.5 text-left transition-colors hover:border-white"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-ink border border-line bg-surface-2">
                      {p.img && !p.template ? (
                        <img src={p.img} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-mute">
                          <Icon name="grid" size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-fg"><Highlight text={p.name} query={gallerySearch} /></div>
                      <div className="mt-0.5 text-[10px] text-mute">
                        {p.template ? `${p.template.w}×${p.template.h}` : `${p.layers} Layers`} ·{' '}
                        {formatDate(p.opened || p.date)}
                      </div>
                    </div>
                    <Icon name="chevronRight" size={14} className="shrink-0 text-mute opacity-0 transition-opacity group-hover:opacity-100" />
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
                          'h-7 rounded-ink px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
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

      {/* Template picker — blank canvas at any export size (grouped) */}
      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Templates & Layouts"
        subtitle="Start from a platform size, a collage layout, or a reference image"
        width="max-w-2xl"
      >
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setTemplateGroup('all')}
            className={cn(
              'shrink-0 rounded-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
              templateGroup === 'all' ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
            )}
          >
            All · {allTemplates.length}
          </button>
          {EXPORT_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setTemplateGroup(g)}
              className={cn(
                'shrink-0 rounded-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
                templateGroup === g ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
              )}
            >
              {g} · {allTemplates.filter((p) => p.platform === g).length}
            </button>
          ))}
        </div>
        <div className="mt-3 max-h-[46vh] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
          {templateGroup === 'all'
            ? EXPORT_GROUPS.map((g) => (
                <div key={g}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <Icon name={PLATFORM_ICONS[g]} size={13} className="text-mute" />
                    <span className="label-xs text-dim">{g}</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {allTemplates.filter((p) => p.platform === g).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTemplateOpen(false)
                          onTemplate({ w: t.w, h: t.h, label: `${t.name} (${t.w}×${t.h})` })
                        }}
                        className="flex items-center gap-2 rounded-ink border border-line px-2.5 py-2 text-left transition-colors hover:border-white"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ink border border-line text-dim">
                          <Icon name={PLATFORM_ICONS[t.platform]} size={13} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-semibold text-fg"><Highlight text={t.name} query={gallerySearch} /></span>
                          <span className="block text-[9px] text-mute">{t.w}×{t.h} · {t.ratio}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            : (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {templatePresets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTemplateOpen(false)
                      onTemplate({ w: t.w, h: t.h, label: `${t.name} (${t.w}×${t.h})` })
                    }}
                    className="flex items-center gap-2 rounded-ink border border-line px-2.5 py-2 text-left transition-colors hover:border-white"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ink border border-line text-dim">
                      <Icon name={PLATFORM_ICONS[t.platform]} size={13} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-fg">{t.name}</span>
                      <span className="block text-[9px] text-mute">{t.w}×{t.h} · {t.ratio}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
        </div>
        {/* Collage quick-starts */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Icon name="grid" size={13} className="text-mute" />
            <span className="label-xs text-dim">Collage layouts</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {[
              ['grid2', 'Grid 2', 'ig-portrait', 'Two photos side by side'],
              ['grid4', 'Grid 4', 'ig-square', '2×2 square grid'],
              ['hero', 'Hero + Sidekick', 'fb-cover', 'Big + small'],
              ['circleinset', 'Circle Inset', 'ig-square', 'White bg + circle frame'],
            ].map(([lid, lname, presetId, ldesc]) => {
              const sz = EXPORT_PRESETS.find((p) => p.id === presetId) || EXPORT_PRESETS[0]
              return (
                <button
                  key={lid}
                  type="button"
                  onClick={() => {
                    setTemplateOpen(false)
                    onStartCollage({ name: lname, w: sz.w, h: sz.h, layout: lid, slots: null })
                  }}
                  className="flex flex-col gap-1 rounded-ink border border-line px-2 py-2 text-left transition-colors hover:border-white"
                >
                  <span className="text-[10px] font-bold text-fg">{lname}</span>
                  <span className="text-[8px] leading-tight text-mute">{ldesc}</span>
                  <span className="text-[8px] text-mute">{sz.w}×{sz.h}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom layout from a reference image */}
        <div className="mt-4 rounded-ink border border-line bg-surface-2/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold text-fg">Collage / Custom layout</div>
              <div className="mt-0.5 text-[9px] text-mute">Upload a reference collage — the layout is detected, then you add photos in the editor</div>
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
                <span className="text-[9px] leading-relaxed text-mute">{refSlots.length >= 2 ? 'Start opens the editor with this layout — your photos fill the boxes.' : 'Try a reference with clear gaps/gutters between photos.'}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function ProjectCard({ project, onOpen, confirmDelete, onAskDelete, onCancelDelete, onDelete, query = '' }) {
  return (
    <div className="group cursor-pointer" onClick={onOpen}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-ink-lg border border-line bg-surface-2 transition-colors duration-150 group-hover:border-white">
        <img
          src={project.img}
          alt={project.name}
          draggable={false}
          className="h-full w-full object-cover opacity-90 transition-opacity duration-150 group-hover:opacity-100"
        />
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
          <div className="mt-0.5 text-[11px] text-mute">
            {project.layers} Layers · {formatDate(project.date)}
          </div>
        </div>
        {project.status === 'edited' && <Chip>Edited</Chip>}
      </div>
    </div>
  )
}
