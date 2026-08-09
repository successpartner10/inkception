import { useEffect, useState } from 'react'
import { Gallery } from './screens/Gallery'
import { Editor } from './screens/Editor'

const STORAGE_KEY = 'inkception.projects.v1'

// Base-relative so assets resolve on GitHub Pages subpaths too.
const base = import.meta.env.BASE_URL // './' in production, '/' in dev
const asset = (p) => `${base}${p}`

const SEED_PROJECTS = [
  {
    id: 'p-aurora',
    name: 'Aurora Study',
    layers: 4,
    date: '2026-08-06T12:00:00',
    img: asset('samples/mountain.jpg'),
    status: 'edited',
  },
  {
    id: 'p-arch',
    name: 'Architectural Proof',
    layers: 6,
    date: '2026-08-02T12:00:00',
    img: asset('samples/bw.jpg'),
  },
  {
    id: 'p-vessel',
    name: 'Kintsugi Vessel',
    layers: 3,
    date: '2026-07-28T12:00:00',
    img: asset('samples/vase.jpg'),
  },
]

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* fall through to seeds */
  }
  return SEED_PROJECTS
}

let untitledCounter = 1

export default function App() {
  const [projects, setProjects] = useState(loadProjects)
  const [view, setView] = useState('gallery')
  const [currentId, setCurrentId] = useState(null)

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

  const createProject = () => {
    const p = {
      id: `p-${Date.now()}`,
      name: `Untitled ${String(untitledCounter++).padStart(2, '0')}`,
      layers: 4,
      date: new Date().toISOString(),
      img: asset('samples/bw.jpg'),
    }
    setProjects((ps) => [p, ...ps])
    setCurrentId(p.id)
    setView('editor')
  }

  const openProject = (id) => {
    setCurrentId(id)
    setView('editor')
  }

  const deleteProject = (id) => setProjects((ps) => ps.filter((p) => p.id !== id))

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
    return <Editor key={current.id} project={current} onBack={() => setView('gallery')} />
  }

  return (
    <Gallery
      projects={projects}
      onOpen={openProject}
      onNew={createProject}
      onDelete={deleteProject}
    />
  )
}
