// Gallery — the Home screen. Hero + project grid.
// Blueprint §3.A: 48px header (ik monogram / INKCEPTION / profile),
// hero card, 2-col scrollable project grid.

import { useRef, useState } from 'react'
import { cn, fileToDataUrl, formatDate } from '../lib/utils'
import { EXPORT_GROUPS, EXPORT_PRESETS, PLATFORM_ICONS } from '../lib/export'
import { Icon } from '../components/Icon'
import { Button, Chip, IconBtn, Modal } from '../components/ui'
import { Logo } from '../components/Logo'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'recent', label: 'Recent' },
  { id: 'archived', label: 'Archived' },
]

export function Gallery({ projects, onOpen, onNew, onDelete, onImportMedia, onTemplate }) {
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateGroup, setTemplateGroup] = useState('all')
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

  const recent = [...projects]
    .sort((a, b) => new Date(b.opened || b.date || 0) - new Date(a.opened || a.date || 0))
    .slice(0, 5)
  const templatePresets = EXPORT_PRESETS.filter((p) => templateGroup === 'all' || p.platform === templateGroup)

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
    if (filter === 'recent') return now - new Date(p.date).getTime() < 14 * 86400000
    if (filter === 'archived') return now - new Date(p.date).getTime() >= 14 * 86400000
    return true
  })

  return (
    <div className="flex h-full flex-col bg-ink">
      {/* Header — 48px, text-only wordmark */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-6">
        <Logo size="sm" />
        <div className="flex-1" />
        <IconBtn icon="user" title="Profile" size={17} />
      </header>

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
              <Button variant="primary" size="lg" icon="plus" onClick={onNew}>
                New Project
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon="upload"
                onClick={() => fileRef.current && fileRef.current.click()}
                disabled={importing}
              >
                {importing ? 'Importing…' : 'Open / Add Media'}
              </Button>
              <Button variant="ghost" size="lg" icon="grid" onClick={() => setTemplateOpen(true)}>
                Templates
              </Button>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-mute sm:block">
                ⌘N
              </span>
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
                      <div className="truncate text-xs font-semibold text-fg">{p.name}</div>
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
                    <Button variant="secondary" size="sm" icon="plus" onClick={onNew}>
                      New Project
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
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
                  <Button variant="primary" size="sm" icon="plus" onClick={onNew}>
                    New Project
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
        title="Open Template"
        subtitle="Blank canvas at any export size — grouped by platform"
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
            All · {EXPORT_PRESETS.length}
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
              {g} · {EXPORT_PRESETS.filter((p) => p.platform === g).length}
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
                    {EXPORT_PRESETS.filter((p) => p.platform === g).map((t) => (
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
        <p className="mt-3 text-[10px] leading-relaxed text-mute">
          Opens the editor with a blank document — then use Collage Studio to add photos, or Open
          to import an image.
        </p>
      </Modal>
    </div>
  )
}

function ProjectCard({ project, onOpen, confirmDelete, onAskDelete, onCancelDelete, onDelete }) {
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
          <div className="truncate text-sm font-semibold">{project.name}</div>
          <div className="mt-0.5 text-[11px] text-mute">
            {project.layers} Layers · {formatDate(project.date)}
          </div>
        </div>
        {project.status === 'edited' && <Chip>Edited</Chip>}
      </div>
    </div>
  )
}
