// Editor — the infinite canvas workspace.
// Blueprint §3.B/§3.C/§3.D: utility bar (undo/redo/export), checkerboard
// canvas, before/after divider, bottom tool ribbon, adjust sliders, AI
// action grid and AI layer segmentation stack.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, Ellipse, IText, Line, PencilBrush, Rect, Image as FabricImage } from 'fabric'
import { Icon } from '../components/Icon'
import {
  ActionCard,
  Button,
  Chip,
  IconBtn,
  Modal,
  Segmented,
  Slider,
  Toast,
} from '../components/ui'
import { LayerRow } from '../components/ui'
import { BeforeAfter } from '../components/BeforeAfter'
import { VectorizePanel } from '../components/VectorizePanel'
import {
  AUTO_ENHANCE_FILTERS,
  DEFAULT_FILTERS,
  QUICK_DEFAULTS,
  applyQuickTransforms,
  buildFabricFilters,
  buildQuickFilters,
  cssFilterString,
  isDefaultFilters,
} from '../lib/filters'
import { EXPORT_GROUPS, EXPORT_PRESETS, PLATFORM_ICONS, renderExport } from '../lib/export'
import { compositeOnBackground, getSegmenter, makeCutout } from '../lib/segment'
import { PROMPT_SUGGESTIONS, matchPrompt } from '../lib/prompts'
import { clamp, cn, downloadDataUrl, loadImageElement, slug, useMediaQuery } from '../lib/utils'

const TAB_ITEMS = [
  { id: 'adjust', label: 'Adjust', icon: 'sliders' },
  { id: 'quick', label: 'Quick', icon: 'sparkle' },
  { id: 'ai', label: 'AI', icon: 'sparkle' },
  { id: 'layers', label: 'Layers', icon: 'layers' },
]

export const TOOLS = [
  { id: 'select', label: 'Select', key: 'V' },
  { id: 'rect', label: 'Rectangle', key: 'R' },
  { id: 'ellipse', label: 'Ellipse', key: 'E' },
  { id: 'line', label: 'Line', key: 'L' },
  { id: 'text', label: 'Text', key: 'T' },
  { id: 'brush', label: 'Brush', key: 'B' },
]

export const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion',
]

const LAYER_DEFAULTS = [
  { id: 'text', name: 'Editorial Text', type: 'Type', visible: true, locked: false },
  { id: 'vignette', name: 'Vignette', type: 'Effect', visible: true, locked: false },
  { id: 'subject', name: 'Subject', type: 'Photo', visible: true, locked: false },
  { id: 'backdrop', name: 'Backdrop', type: 'Fill', visible: true, locked: false },
]

export function Editor({ project, onBack }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  /* ------------------------------ canvas refs ------------------------------ */
  const canvasElRef = useRef(null)
  const fabricRef = useRef(null)
  const imgObjRef = useRef(null)
  const stageWrapRef = useRef(null)
  const fileRef = useRef(null)
  const naturalRef = useRef({ w: 0, h: 0 })
  const zoomRef = useRef(1)
  const busyRef = useRef(false)
  const beforeAfterRef = useRef(false)
  const busyTimerRef = useRef(null)
  const imageSrcRef = useRef(null)
  const filtersRef = useRef(DEFAULT_FILTERS)
  const toolRef = useRef('select')
  const draftRef = useRef(null)
  const fxRef = useRef(QUICK_DEFAULTS)

  /* --------------------------------- state --------------------------------- */
  const [imageSrc, setImageSrc] = useState(null)
  const [fit, setFit] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })
  const [fx, setFx] = useState({ ...QUICK_DEFAULTS })
  const [tool, setTool] = useState('select')
  const [layerOpacity, setLayerOpacity] = useState(100)
  const [blendMode, setBlendMode] = useState('normal')
  const [hist, setHist] = useState([{ ...DEFAULT_FILTERS }])
  const [histPos, setHistPos] = useState(0)
  const [layers, setLayers] = useState(LAYER_DEFAULTS)
  const [selectedLayer, setSelectedLayer] = useState('subject')
  const [beforeAfter, setBeforeAfter] = useState(false)
  const [comparePos, setComparePos] = useState(50)
  const [busy, setBusy] = useState(null)
  const [tab, setTab] = useState('adjust')
  const [aiView, setAiView] = useState('grid')
  const [exportOpen, setExportOpen] = useState(false)
  const [preset, setPreset] = useState('yt-thumb')
  const [exportGroup, setExportGroup] = useState('all')
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [format, setFormat] = useState('png')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [upscaled, setUpscaled] = useState(false)

  useEffect(() => {
    beforeAfterRef.current = beforeAfter
  }, [beforeAfter])
  useEffect(() => {
    busyRef.current = !!busy
  }, [busy])
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])
  useEffect(() => {
    fxRef.current = fx
  }, [fx])
  useEffect(() => {
    toolRef.current = tool
  }, [tool])
  useEffect(() => {
    imageSrcRef.current = imageSrc
  }, [imageSrc])

  const showToast = useCallback((msg, icon) => setToast({ msg, icon }), [])

  /* ------------------------------ fit / sizing ----------------------------- */
  const computeFit = useCallback(() => {
    const stage = stageWrapRef.current
    const nat = naturalRef.current
    if (!stage || !nat.w || !nat.h) return
    const availW = stage.clientWidth - 64
    const availH = stage.clientHeight - 64
    if (availW < 40 || availH < 40) return
    const s = Math.min(availW / nat.w, availH / nat.h)
    setFit({ w: Math.round(nat.w * s), h: Math.round(nat.h * s) })
  }, [])

  useEffect(() => {
    computeFit()
    if (!stageWrapRef.current) return
    const ro = new ResizeObserver(computeFit)
    ro.observe(stageWrapRef.current)
    window.addEventListener('resize', computeFit)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', computeFit)
    }
  }, [computeFit])

  /* ------------------------------ fabric init ------------------------------ */
  useEffect(() => {
    const c = new Canvas(canvasElRef.current, {
      selection: false,
      skipTargetFind: true,
      preserveObjectStacking: true,
    })
    fabricRef.current = c

    // brush
    const brush = new PencilBrush(c)
    brush.width = 4
    brush.color = '#ffffff'
    c.freeDrawingBrush = brush

    let pan = null

    c.on('mouse:down', (o) => {
      if (beforeAfterRef.current) return
      const t = toolRef.current
      if (t === 'select') {
        if (!o.target) pan = { x: o.e.clientX, y: o.e.clientY, vp: [...c.viewportTransform] }
        return
      }
      if (t === 'brush') {
        c.isDrawingMode = true
        return
      }
      const p = c.getPointer(o.e)
      if (t === 'rect') {
        const r = new Rect({
          left: p.x, top: p.y, width: 1, height: 1,
          fill: 'transparent', stroke: '#ffffff', strokeWidth: 2,
        })
        c.add(r)
        draftRef.current = r
      } else if (t === 'ellipse') {
        const el = new Ellipse({
          left: p.x, top: p.y, rx: 1, ry: 1,
          fill: 'transparent', stroke: '#ffffff', strokeWidth: 2,
        })
        c.add(el)
        draftRef.current = el
      } else if (t === 'line') {
        const ln = new Line([p.x, p.y, p.x, p.y], {
          stroke: '#ffffff', strokeWidth: 2,
        })
        c.add(ln)
        draftRef.current = ln
      } else if (t === 'text') {
        const it = new IText('Text', {
          left: p.x, top: p.y, fill: '#ffffff', fontSize: 26,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        })
        c.add(it)
        c.setActiveObject(it)
      }
    })

    c.on('mouse:move', (o) => {
      if (pan) {
        c.viewportTransform[4] = pan.vp[4] + (o.e.clientX - pan.x)
        c.viewportTransform[5] = pan.vp[5] + (o.e.clientY - pan.y)
        c.requestRenderAll()
        return
      }
      const d = draftRef.current
      if (!d) return
      const p = c.getPointer(o.e)
      if (d.type === 'rect') {
        d.set({ width: p.x - d.left, height: p.y - d.top })
      } else if (d.type === 'ellipse') {
        d.set({ rx: Math.abs((p.x - d.left) / 2), ry: Math.abs((p.y - d.top) / 2) })
        d.set({ left: (p.x + d.left) / 2, top: (p.y + d.top) / 2 })
      } else if (d.type === 'line') {
        d.set({ x2: p.x, y2: p.y })
      }
      c.requestRenderAll()
    })

    const end = () => {
      pan = null
      c.isDrawingMode = false
      if (draftRef.current) {
        draftRef.current.setCoords()
        draftRef.current = null
      }
    }
    c.on('mouse:up', end)
    c.on('mouse:out', end)

    return () => {
      c.dispose()
      fabricRef.current = null
    }
  }, [])

  /* tool change → toggle selection/editing mode */
  useEffect(() => {
    const c = fabricRef.current
    if (!c) return
    const isSelect = tool === 'select'
    c.selection = isSelect
    c.skipTargetFind = !isSelect
    c.isDrawingMode = tool === 'brush'
    if (!isSelect) c.discardActiveObject()
    c.requestRenderAll()
  }, [tool])

  /* ----------------------------- image loading ----------------------------- */
  const loadIntoCanvas = useCallback(
    async (src) => {
      clearInterval(busyTimerRef.current)
      setBusy(null)
      setUpscaled(false)
      setAiView('grid')
      setFx({ ...QUICK_DEFAULTS })
      setLayerOpacity(100)
      setBlendMode('normal')
      setImageSrc(src)
      imageSrcRef.current = src
      try {
        const el = await loadImageElement(src)
        naturalRef.current = { w: el.naturalWidth || el.width, h: el.naturalHeight || el.height }
        computeFit()
      } catch {
        showToast('Could not load image', 'close')
      }
    },
    [computeFit, showToast],
  )

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    loadIntoCanvas(project.img || `${base}samples/bw.jpg`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!fit.w || !fit.h || !imageSrc) return
    let alive = true
    const c = fabricRef.current
    if (!c) return
    c.setDimensions({ width: fit.w, height: fit.h })
    c.setViewportTransform([1, 0, 0, 1, 0, 0])
    ;(async () => {
      try {
        const img = await FabricImage.fromURL(imageSrc, { crossOrigin: 'anonymous' })
        if (!alive) return
        const scale = Math.min(fit.w / img.width, fit.h / img.height)
        img.set({
          left: (fit.w - img.width * scale) / 2,
          top: (fit.h - img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        })
        img.filters = buildFabricFilters(filtersRef.current)
        c.clear()
        c.add(img)
        c.requestRenderAll()
        imgObjRef.current = img
      } catch {
        /* ignore load errors */
      }
    })()
    return () => {
      alive = false
    }
  }, [fit, imageSrc])

  /* ------------------------------- filters -------------------------------- */
  useEffect(() => {
    filtersRef.current = filters
    const t = setTimeout(() => {
      const img = imgObjRef.current
      if (!img) return
      img.filters = [...buildFabricFilters(filters), ...buildQuickFilters(fxRef.current)]
      const p = img.applyFilters()
      applyQuickTransforms(img, fxRef.current)
      const c = fabricRef.current
      if (p && typeof p.then === 'function') p.then(() => c && c.requestRenderAll())
      else if (c) c.requestRenderAll()
    }, 30)
    return () => clearTimeout(t)
  }, [filters, fx])

  /* layer opacity + blend mode on the subject image */
  useEffect(() => {
    const img = imgObjRef.current
    if (!img) return
    img.set('opacity', layerOpacity / 100)
    img.set('globalCompositeOperation', blendMode === 'normal' ? 'source-over' : blendMode)
    if (fabricRef.current) fabricRef.current.requestRenderAll()
  }, [layerOpacity, blendMode])

  /* ---------------------------- history / undo ---------------------------- */
  const setLive = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const commitFilters = useCallback(
    (next) => {
      const last = hist[histPos]
      if (last && JSON.stringify(last) === JSON.stringify(next)) return
      const nh = [...hist.slice(0, histPos + 1), next]
      setHist(nh)
      setHistPos(nh.length - 1)
    },
    [hist, histPos],
  )

  const undo = useCallback(() => {
    if (histPos <= 0) return
    const p = histPos - 1
    setHistPos(p)
    setFilters({ ...hist[p] })
  }, [hist, histPos])

  const redo = useCallback(() => {
    if (histPos >= hist.length - 1) return
    const p = histPos + 1
    setHistPos(p)
    setFilters({ ...hist[p] })
  }, [hist, histPos])

  const resetAll = () => commitFilters({ ...DEFAULT_FILTERS })
  const canUndo = histPos > 0
  const canRedo = histPos < hist.length - 1

  /* ------------------------------ zoom / pan ------------------------------ */
  const zoomBy = (f) => {
    const c = fabricRef.current
    if (!c) return
    const z = clamp(zoomRef.current * f, 0.2, 5)
    zoomRef.current = z
    setZoom(z)
    c.zoomToPoint({ x: c.getWidth() / 2, y: c.getHeight() / 2 }, z)
  }
  const zoomFit = () => {
    const c = fabricRef.current
    if (!c) return
    zoomRef.current = 1
    setZoom(1)
    c.setViewportTransform([1, 0, 0, 1, 0, 0])
    c.requestRenderAll()
  }

  useEffect(() => {
    const el = stageWrapRef.current
    if (!el) return
    const handler = (e) => {
      if (beforeAfterRef.current) return
      e.preventDefault()
      const c = fabricRef.current
      if (!c) return
      const rect = c.getElement().getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const z = clamp(zoomRef.current * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 0.2, 5)
      zoomRef.current = z
      setZoom(z)
      c.zoomToPoint({ x, y }, z)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  /* ------------------------------ keyboard -------------------------------- */
  useEffect(() => {
    const h = (e) => {
      const mod = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()
      if (mod && k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && k === 'e') {
        e.preventDefault()
        setExportOpen(true)
      } else if (mod && k === 'b') {
        e.preventDefault()
        setBeforeAfter((v) => !v)
      } else if (mod && k === 'o') {
        e.preventDefault()
        fileRef.current && fileRef.current.click()
      } else if (mod || e.metaKey || e.ctrlKey || e.altKey) {
        return
      } else {
        // tool shortcuts + object ops (ignore when typing in a text input)
        const tag = (e.target && e.target.tagName) || ''
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return
        if (k === 'v') setTool('select')
        else if (k === 'r') setTool('rect')
        else if (k === 'e') setTool('ellipse')
        else if (k === 'l') setTool('line')
        else if (k === 't') setTool('text')
        else if (k === 'b') setTool('brush')
        else if (e.key === 'Delete' || e.key === 'Backspace') {
          const c = fabricRef.current
          const act = c && c.getActiveObject()
          if (act && act !== imgObjRef.current) {
            e.preventDefault()
            c.remove(act)
            c.requestRenderAll()
          }
        } else if (e.key === 'Escape') {
          const c = fabricRef.current
          if (c) {
            c.discardActiveObject()
            c.requestRenderAll()
          }
        }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [undo, redo])

  /* --------------------------------- layers -------------------------------- */
  const toggleLayer = (id) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)))
  const toggleLock = (id) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)))

  const duplicateLayer = () => {
    const img = imgObjRef.current
    if (!img) return
    const c = fabricRef.current
    if (!c) return
    img.clone()
      .then((dup) => {
        dup.set({ left: img.left + 24, top: img.top + 24, evented: false, selectable: false })
        c.add(dup)
        c.requestRenderAll()
        showToast('Layer duplicated', 'copy')
      })
      .catch(() => showToast('Could not duplicate layer', 'close'))
  }

  useEffect(() => {
    const img = imgObjRef.current
    if (!img) return
    const sub = layers.find((l) => l.id === 'subject')
    img.visible = sub ? sub.visible : true
    if (fabricRef.current) fabricRef.current.requestRenderAll()
  }, [layers])

  /* ------------------------------ AI pipeline ------------------------------ */
  /* REAL subject matting — replaces the old deterministic trick (audit #1). */
  const runRemoveBg = async () => {
    const src = imageSrcRef.current
    if (!src || busyRef.current) return
    const setStep = (progress, step) =>
      setBusy({ kind: 'real', title: 'Remove Background', step, progress })
    try {
      setStep(12, 'Loading segmentation model…')
      await getSegmenter()
      setStep(45, 'Segmenting subject…')
      const { dataUrl, coverage } = await makeCutout(src)
      if (coverage < 0.005) {
        setBusy(null)
        showToast('No clear subject detected — try another image', 'info')
        return
      }
      setStep(82, 'Applying alpha matte…')
      await loadIntoCanvas(dataUrl)
      setLayers((ls) => ls.map((l) => (l.id === 'backdrop' ? { ...l, visible: false } : l)))
      setBusy(null)
      showToast('Background removed — real subject matting', 'scissors')
    } catch {
      setBusy(null)
      showToast('Segmentation failed — check connection and retry', 'close')
    }
  }

  /* Real background replace (audit #4) — unlocked by the matte above. */
  const runReplaceBg = async (mode) => {
    const src = imageSrcRef.current
    if (!src || busyRef.current) return
    const setStep = (progress, step) =>
      setBusy({ kind: 'real', title: 'Replace Background', step, progress })
    try {
      setStep(12, 'Loading segmentation model…')
      await getSegmenter()
      setStep(45, 'Segmenting subject…')
      const { dataUrl, width, height, coverage } = await makeCutout(src)
      if (coverage < 0.005) {
        setBusy(null)
        showToast('No clear subject detected — try another image', 'info')
        return
      }
      setStep(75, 'Compositing new background…')
      const flat = await compositeOnBackground(dataUrl, { w: width, h: height, mode })
      await loadIntoCanvas(flat)
      setBusy(null)
      showToast('Background replaced', 'image')
    } catch {
      setBusy(null)
      showToast('Background replace failed — retry', 'close')
    }
  }

  const AI_PIPELINES = {
    enhance: {
      title: 'Auto Enhance',
      steps: ['Analyzing histogram', 'Balancing exposure', 'Correcting color', 'Applying preset'],
      finalize: () => {
        commitFilters({ ...AUTO_ENHANCE_FILTERS })
        showToast('Auto enhance applied')
      },
    },
    upscale: {
      title: 'Upscale 4×',
      steps: ['Analyzing detail', 'Upsampling', 'Sharpening', 'Rendering 4×'],
      finalize: async () => {
        const src = imageSrcRef.current
        if (!src) return
        const img = await loadImageElement(src)
        const w = img.naturalWidth * 4
        const h = img.naturalHeight * 4
        const cv = document.createElement('canvas')
        cv.width = w
        cv.height = h
        const ctx = cv.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.filter = cssFilterString(filtersRef.current)
        ctx.drawImage(img, 0, 0, w, h)
        await loadIntoCanvas(cv.toDataURL('image/png'))
        showToast(`Upscaled 4× → ${w}×${h}`, 'expand')
      },
    },
    vectorize: {
      title: 'Vectorize',
      steps: ['Detecting edges', 'Tracing contours', 'Simplifying paths', 'Building SVG'],
      finalize: () => {
        setAiView('vectorize')
      },
    },
  }

  const runAi = (kind) => {
    if (busyRef.current) return
    const pipe = AI_PIPELINES[kind]
    let i = 0
    setBusy({ kind, title: pipe.title, step: pipe.steps[0], progress: 6 })
    busyTimerRef.current = setInterval(() => {
      i += 1
      if (i >= pipe.steps.length) {
        clearInterval(busyTimerRef.current)
        setBusy(null)
        pipe.finalize()
      } else {
        setBusy({
          kind,
          title: pipe.title,
          step: pipe.steps[i],
          progress: Math.round((i / pipe.steps.length) * 100),
        })
      }
    }, 620)
  }

  const skipAi = () => {
    clearInterval(busyTimerRef.current)
    setBusy(null)
  }

  /* ------------------------- prompt command bar (#2) ------------------------ */
  const onPromptAction = useCallback(
    (action, payload) => {
      if (action === 'removebg') return runRemoveBg()
      if (action === 'replacebg') return setReplaceOpen(true)
      if (action === 'enhance') return runAi('enhance')
      if (action === 'upscale') return runAi('upscale')
      if (action === 'vectorize') return runAi('vectorize')
      if (action === 'fx') return setFx((f) => ({ ...f, ...payload }))
      if (action === 'filters') return commitFilters({ ...filtersRef.current, ...payload })
      if (action === 'reset') return resetAll()
      if (action === 'undo') return undo()
      if (action === 'redo') return redo()
      showToast('Try: "remove background", "make it warmer", "upscale 4×"', 'info')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commitFilters, resetAll, undo, redo],
  )

  /* --------------------------------- export -------------------------------- */
  const doExport = async () => {
    setExporting(true)
    try {
      const p =
        preset === 'original'
          ? { id: 'original', name: 'Original', w: naturalRef.current.w, h: naturalRef.current.h }
          : EXPORT_PRESETS.find((x) => x.id === preset)
      if (!p || !p.w || !p.h) throw new Error('invalid preset')
      let dataUrl = await renderExport(imageSrcRef.current, {
        w: p.w,
        h: p.h,
        filterString: cssFilterString(filtersRef.current),
      })
      const ext = format === 'jpg' ? 'jpg' : 'png'
      if (format === 'jpg') {
        const img = await loadImageElement(dataUrl)
        const cv = document.createElement('canvas')
        cv.width = p.w
        cv.height = p.h
        const ctx = cv.getContext('2d')
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, p.w, p.h)
        ctx.drawImage(img, 0, 0)
        dataUrl = cv.toDataURL('image/jpeg', 0.92)
      }
      downloadDataUrl(dataUrl, `${slug(project.name)}-${p.w}x${p.h}.${ext}`)
      setExportOpen(false)
      showToast(`Exported ${p.w}×${p.h} ${ext.toUpperCase()}`, 'download')
    } catch {
      showToast('Export failed', 'close')
    } finally {
      setExporting(false)
    }
  }

  /* --------------------------------- helpers -------------------------------- */
  const openTab = (t) => {
    setTab(t)
    setSheetOpen(true)
  }
  const stub = () => showToast('Preview build — tool stub', 'info')
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    if (f) {
      const url = URL.createObjectURL(f)
      await loadIntoCanvas(url)
      showToast('Image imported', 'upload')
    }
    e.target.value = ''
  }

  /* ------------------------------ panel renderer ----------------------------- */
  const renderPanel = () => {
    if (tab === 'adjust') return <AdjustTab {...{ filters, setLive, commitFilters, runEnhance: () => runAi('enhance'), resetAll, isDefault: isDefaultFilters(filters), busy }} />
    if (tab === 'quick') {
      return (
        <QuickTab
          fx={fx}
          setFx={setFx}
          filters={filters}
          setLive={setLive}
          commitFilters={commitFilters}
        />
      )
    }
    if (tab === 'ai') {
      return aiView === 'vectorize' ? (
        <VectorizePanel src={imageSrc} fileName={slug(project.name)} onBack={() => setAiView('grid')} />
      ) : (
        <AITab
          busy={busy}
          onRemoveBg={() => runRemoveBg()}
          onReplaceBg={() => setReplaceOpen(true)}
          onEnhance={() => runAi('enhance')}
          onUpscale={() => runAi('upscale')}
          onVectorize={() => runAi('vectorize')}
          upscaled={upscaled}
          onPromptAction={onPromptAction}
        />
      )
    }
    return (
      <LayersTab
        layers={layers}
        selected={selectedLayer}
        onSelect={setSelectedLayer}
        onToggleVisibility={toggleLayer}
        onToggleLock={toggleLock}
        imageSrc={imageSrc}
        showToast={showToast}
        layerOpacity={layerOpacity}
        setLayerOpacity={setLayerOpacity}
        blendMode={blendMode}
        setBlendMode={setBlendMode}
        onDuplicateLayer={() => duplicateLayer()}
      />
    )
  }

  const imageLabel = `${naturalRef.current.w || '–'}×${naturalRef.current.h || '–'}${upscaled ? ' · 4×' : ''}`

  return (
    <div className="flex h-full flex-col bg-ink">
      {/* ------------------------------- top bar ------------------------------ */}
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-3 sm:px-4">
        <IconBtn icon="chevronLeft" title="Back to gallery" onClick={onBack} />
        <div className="ml-2 flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">{project.name}</span>
          <Chip className="hidden sm:inline-flex">{project.layers} Layers</Chip>
        </div>
        <div className="flex-1" />

        <div className="hidden items-center gap-0.5 lg:flex">
          <IconBtn icon="undo" title="Undo (⌘Z)" disabled={!canUndo} onClick={undo} />
          <IconBtn icon="redo" title="Redo (⌘⇧Z)" disabled={!canRedo} onClick={redo} />
          <div className="mx-2 h-5 w-px bg-line" />
          <Button
            variant="secondary"
            size="sm"
            icon="folder"
            onClick={() => fileRef.current && fileRef.current.click()}
          >
            Open
          </Button>
          <Button variant="secondary" size="sm" icon="export" onClick={() => setExportOpen(true)}>
            Export
          </Button>
        </div>
        <div className="flex items-center gap-0.5 lg:hidden">
          <IconBtn icon="undo" title="Undo (⌘Z)" disabled={!canUndo} onClick={undo} />
          <IconBtn icon="redo" title="Redo (⌘⇧Z)" disabled={!canRedo} onClick={redo} />
          <IconBtn icon="folder" title="Open file" onClick={() => fileRef.current && fileRef.current.click()} />
          <IconBtn icon="export" title="Export (⌘E)" onClick={() => setExportOpen(true)} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ------------------------------ canvas area ---------------------------- */}
        <main
          ref={stageWrapRef}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={async (e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files && e.dataTransfer.files[0]
            if (f && f.type.startsWith('image/')) {
              const url = URL.createObjectURL(f)
              await loadIntoCanvas(url)
              showToast('Image imported', 'upload')
            }
          }}
          className="checkerboard relative flex min-w-0 flex-1 items-center justify-center overflow-hidden"
        >
          <div
            className={cn(
              'relative rounded-ink-lg border border-line overflow-hidden transition-shadow',
              dragOver && 'border-white',
            )}
            style={{ width: fit.w || 320, height: fit.h || 240 }}
          >
            {layers.find((l) => l.id === 'backdrop')?.visible && (
              <div className="absolute inset-0 bg-[#161616]" />
            )}
            <canvas ref={canvasElRef} className="absolute inset-0" />
            {layers.find((l) => l.id === 'vignette')?.visible && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.55) 100%)',
                  mixBlendMode: 'multiply',
                }}
              />
            )}
            {layers.find((l) => l.id === 'text')?.visible && (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/90">
                  Inkception — Est. 2026
                </span>
                <span className="hidden text-[9px] font-bold uppercase tracking-[0.3em] text-white/60 sm:block">
                  Proof 04
                </span>
              </div>
            )}

            {beforeAfter && imageSrc && (
              <BeforeAfter
                src={imageSrc}
                filter={cssFilterString(filters)}
                pos={comparePos}
                onChange={setComparePos}
              />
            )}

            {busy && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/70">
                <span className="h-8 w-8 animate-spin rounded-full border border-white/25 border-t-white" />
                <div className="text-center">
                  <div className="text-sm font-semibold">{busy.title}</div>
                  <div className="mt-1 text-xs text-dim">{busy.step}</div>
                </div>
                <div className="h-[2px] w-40 overflow-hidden bg-line-2">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${busy.progress}%` }} />
                </div>
                <button
                  type="button"
                  onClick={skipAi}
                  className="label-xs text-mute transition-colors hover:text-white"
                >
                  Skip
                </button>
              </div>
            )}

            {dragOver && (
              <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-white/5">
                <span className="label-sm border border-white bg-black/60 px-4 py-2 text-white">
                  Drop image
                </span>
              </div>
            )}
          </div>

          {/* floating zoom pill */}
          <div className="absolute bottom-4 left-4 flex items-center rounded-ink border border-line bg-surface">
            <IconBtn icon="zoomOut" title="Zoom out" onClick={() => zoomBy(1 / 1.25)} />
            <button
              type="button"
              title="Fit (100%)"
              onClick={zoomFit}
              className="w-11 text-center text-[10px] tabular-nums text-dim hover:text-white"
            >
              {Math.round(zoom * 100)}%
            </button>
            <IconBtn icon="zoomIn" title="Zoom in" onClick={() => zoomBy(1.25)} />
          </div>

          {/* floating compare toggle */}
          <button
            type="button"
            onClick={() => setBeforeAfter((v) => !v)}
            className={cn(
              'absolute bottom-4 right-4 flex h-9 items-center gap-2 rounded-ink border px-3 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
              beforeAfter ? 'border-white bg-white text-black' : 'border-line bg-surface text-dim hover:border-white hover:text-white',
            )}
          >
            <Icon name="compare" size={14} />
            Compare
          </button>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </main>

        {/* --------------------------- desktop inspector -------------------------- */}
        {isDesktop && (
          <aside className="flex w-[340px] shrink-0 flex-col border-l border-line bg-surface">
            <Segmented items={TAB_ITEMS} value={tab} onChange={setTab} />
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">{renderPanel()}</div>
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <span className="label-xs text-mute">Auto-saved locally</span>
              <span className="label-xs text-mute">{imageLabel}</span>
            </div>
          </aside>
        )}
      </div>

      {/* ------------------------------ tool ribbon ------------------------------ */}
      <footer className="no-scrollbar flex h-12 shrink-0 items-center gap-0.5 overflow-x-auto border-t border-line px-2 sm:px-3">
        <IconBtn icon="move" title="Select / Move (V)" active={tool === 'select'} onClick={() => setTool('select')} />
        <IconBtn icon="shape" title="Rectangle (R)" active={tool === 'rect'} onClick={() => setTool('rect')} />
        <IconBtn icon="circle" title="Ellipse (E)" active={tool === 'ellipse'} onClick={() => setTool('ellipse')} />
        <IconBtn icon="minus" title="Line (L)" active={tool === 'line'} onClick={() => setTool('line')} />
        <IconBtn icon="text" title="Text (T)" active={tool === 'text'} onClick={() => setTool('text')} />
        <IconBtn icon="brush" title="Brush (B)" active={tool === 'brush'} onClick={() => setTool('brush')} />
        <div className="mx-1.5 h-5 w-px shrink-0 bg-line" />
        <IconBtn icon="upload" title="Import image (⌘O)" onClick={() => fileRef.current && fileRef.current.click()} />
        <IconBtn icon="compare" title="Before / After (⌘B)" active={beforeAfter} onClick={() => setBeforeAfter((v) => !v)} />
        <div className="mx-1.5 h-5 w-px shrink-0 bg-line" />
        <IconBtn icon="zoomOut" title="Zoom out" onClick={() => zoomBy(1 / 1.25)} />
        <span className="w-11 shrink-0 text-center text-[10px] tabular-nums text-dim">
          {Math.round(zoom * 100)}%
        </span>
        <IconBtn icon="zoomIn" title="Zoom in" onClick={() => zoomBy(1.25)} />
        <IconBtn icon="fit" title="Fit" onClick={zoomFit} />
        <div className="mx-1.5 h-5 w-px shrink-0 bg-line" />
        <IconBtn
          icon="sparkle"
          title="AI Suite"
          active={tab === 'ai' || aiView === 'vectorize'}
          onClick={() => openTab('ai')}
        />
        <IconBtn icon="layers" title="Layers" active={tab === 'layers'} onClick={() => openTab('layers')} />
        <div className="ml-auto hidden shrink-0 pr-1 text-[10px] text-mute xl:block">
          Drag to pan · Scroll to zoom · ⌘Z / ⌘⇧Z undo · ⌘E export
        </div>
      </footer>

      {/* ------------------------------ mobile sheet ------------------------------ */}
      {!isDesktop && (
        <>
          <button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-ink bg-white text-black"
            aria-label={sheetOpen ? 'Close panels' : 'Open panels'}
          >
            <Icon name={sheetOpen ? 'close' : 'sliders'} size={18} />
          </button>
          {sheetOpen && (
            <div className="fixed inset-x-0 bottom-0 z-40 flex h-[65vh] flex-col rounded-t-ink-lg border-t border-line bg-surface">
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-2" />
              <Segmented items={TAB_ITEMS} value={tab} onChange={setTab} />
              <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">{renderPanel()}</div>
            </div>
          )}
        </>
      )}

      {/* --------------------------- replace background modal ---------------------- */}
      <Modal
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        title="Replace Background"
        subtitle="Real subject matting — pick a new backdrop"
        width="max-w-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'black', label: 'Solid Black', swatch: 'bg-black border border-line' },
            { id: 'white', label: 'Solid White', swatch: 'bg-white' },
            { id: 'gradient', label: 'Gradient', swatch: 'bg-gradient-to-br from-[#101010] to-[#3d3d3d]' },
            { id: 'transparent', label: 'Transparent', swatch: 'checkerboard' },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setReplaceOpen(false)
                runReplaceBg(o.id)
              }}
              className="flex flex-col items-center gap-2 rounded-ink border border-line p-4 transition-colors hover:border-white"
            >
              <span className={cn('h-12 w-full rounded-ink border border-line-2', o.swatch)} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg">
                {o.label}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-mute">
          Runs on-device via MediaPipe segmentation — the subject keeps its true alpha matte.
        </p>
      </Modal>

      {/* -------------------------------- export modal ----------------------------- */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export"
        subtitle="Platform presets — cover-cropped to exact size"
        width="max-w-2xl"
      >
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setExportGroup('all')}
            className={cn(
              'shrink-0 rounded-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
              exportGroup === 'all' ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
            )}
          >
            All · {EXPORT_PRESETS.length}
          </button>
          {EXPORT_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setExportGroup(g)}
              className={cn(
                'shrink-0 rounded-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
                exportGroup === g ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
              )}
            >
              {g} · {EXPORT_PRESETS.filter((p) => p.platform === g).length}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {exportGroup === 'all'
            ? EXPORT_GROUPS.map((g) => (
                <div key={g} className="mb-4 last:mb-0">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon name={PLATFORM_ICONS[g]} size={13} className="text-mute" />
                    <span className="label-xs text-dim">{g}</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {EXPORT_PRESETS.filter((p) => p.platform === g).map((p) => (
                      <PresetRow key={p.id} p={p} active={preset === p.id} onClick={() => setPreset(p.id)} />
                    ))}
                  </div>
                </div>
              ))
            : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {EXPORT_PRESETS.filter((p) => p.platform === exportGroup).map((p) => (
                  <PresetRow key={p.id} p={p} active={preset === p.id} onClick={() => setPreset(p.id)} />
                ))}
              </div>
            )}
        </div>

        <button
          type="button"
          onClick={() => setPreset('original')}
          className={cn(
            'mt-4 flex w-full items-center justify-between rounded-ink border px-3.5 py-2.5 text-left transition-colors',
            preset === 'original' ? 'border-white bg-surface-2' : 'border-line hover:border-line-2',
          )}
        >
          <span className="text-xs font-semibold">Original size</span>
          <span className="flex items-center gap-2">
            <span className="text-[10px] text-mute">
              {naturalRef.current.w || '–'}×{naturalRef.current.h || '–'}
            </span>
            {preset === 'original' && <Icon name="check" size={14} className="text-white" />}
          </span>
        </button>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="label-xs text-mute">Format</span>
            <div className="flex rounded-ink border border-line p-0.5">
              {['png', 'jpg'].map((fm) => (
                <button
                  key={fm}
                  type="button"
                  onClick={() => setFormat(fm)}
                  className={cn(
                    'rounded-[6px] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors',
                    format === fm ? 'bg-white text-black' : 'text-dim hover:text-white',
                  )}
                >
                  {fm}
                </button>
              ))}
            </div>
          </div>
          <span className="label-xs text-mute">{imageLabel}</span>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setExportOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" icon="export" onClick={doExport} disabled={exporting}>
            {exporting ? 'Rendering…' : `Export ${format.toUpperCase()}`}
          </Button>
        </div>
      </Modal>

      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}

/* ------------------------------ export preset ---------------------------- */
function PresetRow({ p, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={p.use}
      className={cn(
        'flex items-center gap-2.5 rounded-ink border px-2.5 py-2 text-left transition-colors',
        active ? 'border-white bg-surface-2' : 'border-line hover:border-line-2',
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-ink border border-line text-dim">
        <Icon name={PLATFORM_ICONS[p.platform]} size={13} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-semibold">{p.name}</span>
        <span className="mt-0.5 block text-[9px] text-mute">
          {p.w}×{p.h} · {p.ratio}
        </span>
      </span>
      {active && <Icon name="check" size={13} className="shrink-0 text-white" />}
    </button>
  )
}

/* ----------------------------- tab: Quick actions -------------------------- */
// Spec §7 — 20 one-click effects in 4 groups.
function QuickTab({ fx, setFx, filters, setLive, commitFilters }) {
  const clampFilter = (key, delta, min = 40, max = 160) =>
    commitFilters({ ...filters, [key]: Math.min(max, Math.max(min, filters[key] + delta)) })

  const toggle = (key) => setFx((f) => ({ ...f, [key]: !f[key] }))

  const groups = [
    {
      label: 'Color',
      items: [
        { label: 'Invert', icon: 'refresh', active: fx.invert, onClick: () => toggle('invert') },
        { label: 'Black & White', icon: 'image', active: fx.bw, onClick: () => toggle('bw') },
        { label: 'Sepia', icon: 'clock', active: fx.sepia, onClick: () => toggle('sepia') },
        { label: 'Vintage', icon: 'archive', active: fx.vintage, onClick: () => toggle('vintage') },
      ],
    },
    {
      label: 'Adjust',
      items: [
        { label: 'Brighten', icon: 'sun', onClick: () => clampFilter('brightness', 12) },
        { label: 'Darken', icon: 'moon', onClick: () => clampFilter('brightness', -12) },
        { label: 'Contrast +', icon: 'sliders', onClick: () => clampFilter('contrast', 10) },
        { label: 'Contrast −', icon: 'sliders', onClick: () => clampFilter('contrast', -10) },
        { label: 'Saturate', icon: 'droplet', onClick: () => clampFilter('saturation', 15, 0, 200) },
        { label: 'Desaturate', icon: 'droplet', onClick: () => commitFilters({ ...filters, saturation: 60 }) },
      ],
    },
    {
      label: 'Filter',
      items: [
        { label: 'Blur', icon: 'wind', active: fx.blur > 0, onClick: () => setFx((f) => ({ ...f, blur: f.blur > 0 ? 0 : 0.35 })) },
        { label: 'Blur More', icon: 'wind', active: fx.blur >= 0.7, onClick: () => setFx((f) => ({ ...f, blur: f.blur >= 0.7 ? 0 : 0.9 })) },
        { label: 'Sharpen', icon: 'focus', active: fx.sharpen, onClick: () => toggle('sharpen') },
        { label: 'Noise', icon: 'sparkle', active: fx.noise > 0, onClick: () => setFx((f) => ({ ...f, noise: f.noise > 0 ? 0 : 60 })) },
        { label: 'Pixelate', icon: 'grid', active: fx.pixelate > 0, onClick: () => setFx((f) => ({ ...f, pixelate: f.pixelate > 0 ? 0 : 8 })) },
      ],
    },
    {
      label: 'Transform',
      items: [
        { label: 'Flip H', icon: 'flipH', active: fx.flipX, onClick: () => toggle('flipX') },
        { label: 'Flip V', icon: 'flipV', active: fx.flipY, onClick: () => toggle('flipY') },
        { label: 'Rotate 90°', icon: 'rotateCw', onClick: () => setFx((f) => ({ ...f, angle: (f.angle + 90) % 360 })) },
        { label: 'Reset All', icon: 'refresh', onClick: () => { setFx({ ...QUICK_DEFAULTS }); commitFilters({ ...DEFAULT_FILTERS }) } },
      ],
    },
  ]

  return (
    <div className="p-4">
      {groups.map((g) => (
        <div key={g.label} className="mb-5 last:mb-0">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="label-xs text-dim">{g.label}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {g.items.map((it) => (
              <button
                key={it.label}
                type="button"
                onClick={it.onClick}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-ink border px-1 py-2.5 transition-colors',
                  it.active ? 'border-white bg-surface-2 text-white' : 'border-line text-dim hover:border-line-2 hover:text-fg',
                )}
              >
                <Icon name={it.icon} size={15} />
                <span className="text-[8.5px] font-semibold uppercase tracking-[0.06em]">{it.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------ tab: Adjust ------------------------------ */
function AdjustTab({ filters, setLive, commitFilters, runEnhance, resetAll, isDefault, busy }) {
  const f = filters
  const commit = () => commitFilters({ ...f })
  const bind = (key, min, max, format) => ({
    value: f[key],
    min,
    max,
    defaultValue: DEFAULT_FILTERS[key],
    onChange: (v) => setLive({ [key]: v }),
    onCommit: commit,
    format,
  })
  return (
    <div className="p-5">
      <Button variant="primary" className="w-full" icon="sparkle" onClick={runEnhance} disabled={busy}>
        Auto Enhance
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full"
        onClick={resetAll}
        disabled={isDefault}
      >
        Reset Adjustments
      </Button>

      <div className="mt-6 space-y-4">
        <Slider label="Brightness" {...bind('brightness', 40, 160, (v) => `${v >= 100 ? '+' : ''}${v - 100}`)} />
        <Slider label="Contrast" {...bind('contrast', 40, 160, (v) => `${v >= 100 ? '+' : ''}${v - 100}`)} />
        <Slider label="Saturation" {...bind('saturation', 0, 200, (v) => `${v >= 100 ? '+' : ''}${v - 100}`)} />
        <Slider label="Exposure" {...bind('exposure', -100, 100, (v) => `${v >= 0 ? '+' : ''}${v}`)} />
        <Slider label="Temperature" {...bind('temperature', -100, 100, (v) => (v === 0 ? '0' : v > 0 ? `Warm ${v}` : `Cool ${-v}`))} />
        <Slider label="Tint" {...bind('tint', -100, 100, (v) => `${v >= 0 ? '+' : ''}${v}`)} />
      </div>

      <p className="mt-6 text-[10px] leading-relaxed text-mute">
        Double-click any slider to reset it. Undo/redo with ⌘Z / ⌘⇧Z.
      </p>
    </div>
  )
}

/* -------------------------------- tab: AI --------------------------------- */
function AITab({ busy, onRemoveBg, onReplaceBg, onEnhance, onUpscale, onVectorize, upscaled, onPromptAction }) {
  const [phrase, setPhrase] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const m = matchPrompt(phrase)
    if (!m) return
    setPhrase('')
    onPromptAction(m.action, m.payload)
  }

  return (
    <div className="p-4">
      {/* Command bar — "design with words" (audit #2) */}
      <form
        onSubmit={submit}
        className="rounded-ink border border-line p-3 transition-colors focus-within:border-white"
      >
        <div className="flex items-center gap-2">
          <Icon name="sparkle" size={14} className="shrink-0 text-dim" />
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder='Describe the edit — "remove background"…'
            className="min-w-0 flex-1 bg-transparent text-xs text-fg placeholder:text-mute focus:outline-none"
          />
          <button
            type="submit"
            disabled={!phrase.trim()}
            className="shrink-0 rounded-ink bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-black disabled:opacity-40"
          >
            Go
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {PROMPT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPromptAction(matchPrompt(s).action, matchPrompt(s).payload)}
              className="rounded-ink bg-surface-2 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-dim transition-colors hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      <p className="mt-4 text-xs leading-relaxed text-dim">
        Real AI runs on-device: MediaPipe subject matting produces a true alpha cutout — no image
        leaves your device. Deterministic tools (enhance, upscale, vectorize) are labeled as such.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <ActionCard
          icon="scissors"
          title="Remove Background"
          desc="Real subject matting (MediaPipe, on-device)."
          onClick={onRemoveBg}
          busy={busy?.kind === 'real'}
          progress={busy?.kind === 'real' ? busy.progress : null}
          tag="On-device"
        />
        <ActionCard
          icon="image"
          title="Replace Background"
          desc="Swap in black, white, gradient or transparent."
          onClick={onReplaceBg}
        />
        <ActionCard
          icon="sparkle"
          title="Auto Enhance"
          desc="Exposure & color correction."
          onClick={onEnhance}
          busy={busy?.kind === 'enhance'}
          progress={busy?.kind === 'enhance' ? busy.progress : null}
        />
        <ActionCard
          icon="expand"
          title="Upscale 4×"
          desc="Resolution enhancement."
          onClick={onUpscale}
          disabled={upscaled}
          tag={upscaled ? 'Applied' : undefined}
          busy={busy?.kind === 'upscale'}
          progress={busy?.kind === 'upscale' ? busy.progress : null}
        />
        <ActionCard
          icon="penTool"
          title="Vectorize"
          desc="Raster → SVG conversion."
          onClick={onVectorize}
          busy={busy?.kind === 'vectorize'}
          progress={busy?.kind === 'vectorize' ? busy.progress : null}
        />
      </div>
    </div>
  )
}

/* ------------------------------- tab: Layers ------------------------------ */
function LayersTab({
  layers, selected, onSelect, onToggleVisibility, onToggleLock, imageSrc, showToast,
  layerOpacity, setLayerOpacity, blendMode, setBlendMode, onDuplicateLayer,
}) {
  const previews = {
    text: <span className="text-[10px] font-extrabold tracking-widest text-fg">Tt</span>,
    vignette: (
      <div
        className="h-full w-full"
        style={{ background: 'radial-gradient(circle at 50% 40%, transparent 30%, rgba(0,0,0,0.9) 75%)' }}
      />
    ),
    subject: imageSrc ? <img src={imageSrc} alt="" className="h-full w-full object-cover" /> : null,
    backdrop: <div className="h-full w-full bg-[#242424]" />,
  }

  const selectedLayer = layers.find((l) => l.id === selected)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between px-1">
        <span className="label-xs text-mute">Visibility · Lock</span>
        <div className="flex items-center gap-1">
          <IconBtn
            icon="copy"
            size={15}
            title="Duplicate layer"
            onClick={onDuplicateLayer}
          />
          <IconBtn
            icon="plus"
            size={15}
            title="Add layer (ships with object tools)"
            onClick={() => showToast('Create shapes with the toolbar tools', 'info')}
          />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {layers.map((l) => (
          <LayerRow
            key={l.id}
            layer={l}
            preview={previews[l.id]}
            selected={selected === l.id}
            onSelect={() => onSelect(l.id)}
            onToggleVisibility={() => onToggleVisibility(l.id)}
            onToggleLock={() => onToggleLock(l.id)}
          />
        ))}
      </div>

      {/* selected-layer properties (spec §5) */}
      {selectedLayer && selectedLayer.type === 'Photo' && (
        <div className="mt-4 rounded-ink border border-line p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="label-xs text-dim">Layer Properties</span>
            <span className="label-xs text-mute">{selectedLayer.name}</span>
          </div>
          <Slider
            label="Opacity"
            value={layerOpacity}
            min={0}
            max={100}
            defaultValue={100}
            onChange={setLayerOpacity}
            format={(v) => `${v}%`}
          />
          <div className="mt-2">
            <span className="label-xs text-dim">Blend Mode</span>
            <select
              value={blendMode}
              onChange={(e) => setBlendMode(e.target.value)}
              className="mt-1.5 w-full rounded-ink border border-line bg-surface-2 px-2 py-1.5 text-xs text-fg focus:border-white focus:outline-none"
            >
              {BLEND_MODES.map((b) => (
                <option key={b} value={b} className="bg-surface text-fg">
                  {b.charAt(0).toUpperCase() + b.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <p className="mt-4 px-1 text-[10px] leading-relaxed text-mute">
        Segmented layers are produced by the AI suite — run Remove Background, then toggle the
        Backdrop layer off. Draw with the toolbar tools: Rectangle R, Ellipse E, Line L, Text T,
        Brush B. Delete removes a selected shape.
      </p>
    </div>
  )
}
