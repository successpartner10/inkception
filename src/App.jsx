import { useEffect, useState } from 'react'
import { Gallery } from './screens/Gallery'
import { Editor } from './screens/Editor'

const STORAGE_KEY = 'inkception.projects.v1'

// Base-relative so assets resolve on GitHub Pages subpaths too.
const base = import.meta.env.BASE_URL // './' in production, '/' in dev
const asset = (p) => `${base}${p}`

// Sample projects previously seeded on first run — now removed so the home
// page starts clean. Existing saved copies are filtered out below.
const SEED_IDS = ['p-aurora', 'p-arch', 'p-vessel']

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) {
        // drop the old sample projects; blob: URLs die on reload — replace
        // them so real projects still open (user re-imports via Open).
        return parsed
          .filter((p) => !SEED_IDS.includes(p.id))
          .map((p) =>
            typeof p.img === 'string' && p.img.startsWith('blob:')
              ? { ...p, img: asset('samples/bw.jpg') }
              : p,
          )
      }
    }
  } catch {
    /* ignore */
  }
  return []
}

let untitledCounter = 1

export default function App() {
  const [projects, setProjects] = useState(loadProjects)
  const [view, setView] = useState('gallery')
  const [currentId, setCurrentId] = useState(null)
  const [pendingCollage, setPendingCollage] = useState(null) // {layout:'custom', slots, size, name} opened from Templates

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    } catch {
      /* storage unavailable */
    }
  }, [projects])

  const current = projects.find((p) => p.id === currentId) || null

  useEffect(() => {
    document.title = current ? `${current.name} — Inkception` : 'Inkception — AI Design Studio'
  }, [current])

  const createProject = (img, template) => {
    const p = {
      id: `p-${Date.now()}`,
      name: template
        ? `${template.label} Template`
        : `Untitled ${String(untitledCounter++).padStart(2, '0')}`,
      layers: 4,
      date: new Date().toISOString(),
      // img may arrive as a click event when wired straight to onClick —
      // only accept a real string source (data URL / http / relative path).
      img: typeof img === 'string' ? img : asset('samples/bw.jpg'),
      ...(template ? { template: { w: template.w, h: template.h } } : {}),
    }
    setProjects((ps) => [p, ...ps])
    setCurrentId(p.id)
    setView('editor')
  }

  const startCollage = (tpl) => {
    createProject(null, { w: tpl.w, h: tpl.h, label: tpl.name || 'Collage' })
    setPendingCollage({ layout: tpl.layout || 'custom', slots: tpl.slots || null, size: { w: tpl.w, h: tpl.h }, name: tpl.name || 'Custom Collage' })
  }

  const openProject = (id) => {
    setCurrentId(id)
    setView('editor')
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, opened: new Date().toISOString() } : p)))
  }

  const deleteProject = (id) => setProjects((ps) => ps.filter((p) => p.id !== id))

  const renameProject = (id, name) =>
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p)))

  // live thumbnail — the Gallery preview reflects the current canvas state
  // (separate from `img`, the original source, so re-opening keeps full res)
  const updateThumb = (id, thumb) =>
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, thumb } : p)))

  // ⌘N → new project from anywhere
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        createProject()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  if (view === 'editor' && current) {
    return <Editor key={current.id} project={current} onBack={() => setView('gallery')} onRename={(name) => renameProject(current.id, name)} pendingCollage={pendingCollage} onPendingCollageHandled={() => setPendingCollage(null)} onThumb={(thumb) => updateThumb(current.id, thumb)} />
  }

  return (
    <Gallery
      projects={projects}
      onOpen={openProject}
      onNew={createProject}
      onDelete={deleteProject}
      onImportMedia={(url) => createProject(url)}
      onTemplate={(t) => createProject(null, t)}
      onStartCollage={startCollage}
    />
  )
}
