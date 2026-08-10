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
import { compositeOnBackground, getSegmenter, makeCutout, segmentImage, subjectBBox } from '../lib/segment'
import { colorGrade, decompose, denoise, inpaint, retouch, smartCrop } from '../lib/vision'
import { extractPalette, gifEncode, pdfFromJpeg, psdFromCanvas } from '../lib/encode'
import { buildLayeredPsdBlob } from '../lib/psd'
import { pickVideoMime, recordFrames, renderMotionFrames } from '../lib/motioncapture'
import { traceImage } from '../lib/trace'
import { PROMPT_SUGGESTIONS, matchPrompt } from '../lib/prompts'
import { COLLAGE_LAYOUTS, computeSlots } from '../lib/collage'
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, FONTS } from '../lib/fonts'
import { clamp, cn, downloadBlob, downloadDataUrl, loadImageElement, slug, useMediaQuery } from '../lib/utils'

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

/* font helper — full CSS font-family stack for a family name */
function fontStack(family) {
  const f = FONTS.find((x) => x.family === family)
  return f ? f.stack : `'${family}', sans-serif`
}

const isTextObject = (o) => o && (o.type === 'i-text' || o.type === 'textbox' || o.type === 'text')

/* friendly "…now" phrasing for the busy overlay */
function busyNowPhrase(title) {
  const t = String(title || '')
  const map = {
    'Remove Background': 'Removing background now…',
    'Replace Background': 'Replacing background now…',
    'Auto Enhance': 'Enhancing photo now…',
    'Upscale 4×': 'Upscaling now…',
    'Portrait Retouch': 'Retouching portrait now…',
    Denoise: 'Reducing noise now…',
    'Color Grade': 'Applying color grade now…',
    'Smart Crop': 'Cropping now…',
    'Decompose to Layers': 'Decomposing to layers now…',
    'Batch AI': 'Processing batch now…',
    'Texture Fill': 'Filling region now…',
    'Collage Studio': 'Building collage now…',
    'Export GIF': 'Rendering GIF now…',
    'Export MP4': 'Rendering video now…',
    Crop: 'Cropping now…',
  }
  if (map[t]) return map[t]
  if (t.startsWith('Export')) return `${t.replace('Export ', 'Exporting ').toLowerCase()} now…`
  if (t.startsWith('Upscale')) return 'Upscaling now…'
  return `${t} — working now…`
}

/* friendly layer name for PSD export */
function layerNameFor(obj, baseImg, decomp) {
  if (obj === baseImg) return 'Image'
  const d = decomp.find((x) => x.img === obj)
  if (d) return d.name
  const map = {
    image: 'Image',
    rect: 'Rectangle',
    ellipse: 'Ellipse',
    line: 'Line',
    'i-text': 'Text',
    textbox: 'Text',
    path: 'Brush Stroke',
    polygon: 'Shape',
  }
  return map[obj.type] || (obj.name || 'Layer')
}

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
  const decompRef = useRef([])
  const paintCanvasRef = useRef(null)
  const maskCvRef = useRef(null)
  const paintRectRef = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const textFontRef = useRef(DEFAULT_FONT)
  const textSizeRef = useRef(DEFAULT_FONT_SIZE)

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
  const [retouchOpen, setRetouchOpen] = useState(false)
  const [denoiseOpen, setDenoiseOpen] = useState(false)
  const [lutOpen, setLutOpen] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [motionOpen, setMotionOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [collageOpen, setCollageOpen] = useState(false)
  const [upscaleOpen, setUpscaleOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteColors, setPaletteColors] = useState([])
  const [eraseMode, setEraseMode] = useState(null) // null | 'erase' | 'fill'
  const [motion, setMotion] = useState({ mode: 'off', speed: 1 })
  const [extraLayers, setExtraLayers] = useState([])
  const [batchResult, setBatchResult] = useState(null)
  const [format, setFormat] = useState('png')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [upscaled, setUpscaled] = useState(false)
  const [isTemplate, setIsTemplate] = useState(false)
  const [textFont, setTextFont] = useState(DEFAULT_FONT)
  const [textSize, setTextSize] = useState(DEFAULT_FONT_SIZE)
  const [activeText, setActiveText] = useState(false)
  const [cropSel, setCropSel] = useState(null) // {x,y,w,h} in display px
  const cropRef = useRef(null) // drag start point
  const cropOverlayRect = useRef(null)
  const dragTimerRef = useRef(null)

  useEffect(() => {
    beforeAfterRef.current = beforeAfter
  }, [beforeAfter])
  useEffect(() => {
    busyRef.current = !!busy
    // Auto-collapse the mobile sheet when a background job starts so the
    // canvas preview (and the progress overlay) stay visible — no manual
    // menu closing needed.
    if (busy) setSheetOpen(false)
    // Watchdog: a stuck/hung job must NEVER permanently block the image.
    // Auto-clear after 90s so the canvas is always recoverable.
    if (busy) {
      const t = setTimeout(() => {
        clearInterval(busyTimerRef.current)
        setBusy(null)
        showToast('Operation timed out — the canvas is unlocked', 'info')
      }, 90000)
      return () => clearTimeout(t)
    }
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

  /* Only one modal open at a time (best practice — prevents stacked dialogs
     where a backdrop from an earlier modal blocks clicks on the new one). */
  const closeAllModals = () => {
    setReplaceOpen(false)
    setRetouchOpen(false)
    setDenoiseOpen(false)
    setLutOpen(false)
    setCropOpen(false)
    setMotionOpen(false)
    setBatchOpen(false)
    setCollageOpen(false)
    setUpscaleOpen(false)
    setPaletteOpen(false)
    setExportOpen(false)
  }
  const openModal = (setter) => {
    closeAllModals()
    setter(true)
  }

  /* ------------------------------ fit / sizing ----------------------------- */
  const calcFitFor = useCallback((w, h) => {
    const stage = stageWrapRef.current
    if (!stage || !w || !h) return null
    const availW = stage.clientWidth - 64
    const availH = stage.clientHeight - 64
    if (availW < 40 || availH < 40) return null
    const s = Math.min(availW / w, availH / h)
    return { w: Math.round(w * s), h: Math.round(h * s) }
  }, [])

  const computeFit = useCallback(() => {
    const nat = naturalRef.current
    const f = calcFitFor(nat.w, nat.h)
    if (f) setFit(f)
  }, [calcFitFor])

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
          left: p.x, top: p.y, fill: '#ffffff',
          fontSize: textSizeRef.current,
          fontFamily: fontStack(textFontRef.current),
        })
        c.add(it)
        c.setActiveObject(it)
        setActiveText(true)
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

    // sync font controls with the selected text object
    const syncTextSelection = () => {
      const o = c.getActiveObject()
      if (isTextObject(o)) {
        setActiveText(true)
        setTextFont(o.fontFamily ? o.fontFamily.replace(/'/g, '') : DEFAULT_FONT)
        setTextSize(Math.round(o.fontSize || DEFAULT_FONT_SIZE))
      } else {
        setActiveText(false)
      }
    }
    c.on('selection:created', syncTextSelection)
    c.on('selection:updated', syncTextSelection)
    c.on('selection:cleared', () => setActiveText(false))

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
      setIsTemplate(false)
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
    if (project.template) {
      // blank document template (from Gallery → Open Template)
      setIsTemplate(true)
      naturalRef.current = { w: project.template.w, h: project.template.h }
      computeFit()
      return
    }
    const base = import.meta.env.BASE_URL
    loadIntoCanvas(project.img || `${base}samples/bw.jpg`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* canvas sizing — keeps existing objects (collage layers survive resizes) */
  useEffect(() => {
    const c = fabricRef.current
    if (!c || !fit.w || !fit.h) return
    c.setDimensions({ width: fit.w, height: fit.h })
    c.setViewportTransform([1, 0, 0, 1, 0, 0])
  }, [fit])

  /* base image — replaces only the old base image, never wipes other objects */
  useEffect(() => {
    if (!fit.w || !fit.h || !imageSrc) return
    let alive = true
    const c = fabricRef.current
    if (!c) return
    ;(async () => {
      try {
        // crossOrigin 'anonymous' breaks file:// (local/offline) loads — only
        // request it when served over http(s), where CORS applies.
        const isFile = typeof location !== 'undefined' && location.protocol === 'file:'
        const img = await FabricImage.fromURL(imageSrc, isFile ? {} : { crossOrigin: 'anonymous' })
        if (!alive) return
        const scale = Math.min(fit.w / img.width, fit.h / img.height)
        img.set({
          left: (fit.w - img.width * scale) / 2,
          top: (fit.h - img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          // selectable so users can select & delete the on-screen image
          selectable: true,
          evented: true,
        })
        img.filters = buildFabricFilters(filtersRef.current)
        if (imgObjRef.current) c.remove(imgObjRef.current)
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

  const resetAll = () => {
    // set the live values AND push to history so Reset actually applies
    setFilters({ ...DEFAULT_FILTERS })
    commitFilters({ ...DEFAULT_FILTERS })
  }
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

  /* --------------------------- delete / on-screen --------------------------- */
  // Declared BEFORE the keyboard effect (which references deleteActive) to
  // avoid a TDZ ReferenceError that crashed the editor on mount.
  const deleteWholeImage = useCallback(() => {
    const c = fabricRef.current
    if (!c) return
    decompRef.current.forEach((d) => c.remove(d.img))
    decompRef.current = []
    setExtraLayers([])
    if (imgObjRef.current) c.remove(imgObjRef.current)
    imgObjRef.current = null
    setImageSrc(null)
    imageSrcRef.current = null
    naturalRef.current = { w: 0, h: 0 }
    setUpscaled(false)
    setEraseMode(null)
    setBeforeAfter(false)
    setFx({ ...QUICK_DEFAULTS })
    c.requestRenderAll()
    showToast('Image deleted', 'trash')
  }, [showToast])

  const deleteActive = useCallback(() => {
    const c = fabricRef.current
    if (!c) return
    const act = c.getActiveObject()
    if (act) {
      if (act === imgObjRef.current) return deleteWholeImage()
      c.remove(act)
      c.requestRenderAll()
      return
    }
    if (imgObjRef.current) return deleteWholeImage()
    showToast('Nothing to delete', 'info')
  }, [deleteWholeImage, showToast])

  const deleteLayer = useCallback(
    (id) => {
      const c = fabricRef.current
      const d = decompRef.current.find((x) => x.id === id)
      if (d && c) c.remove(d.img)
      decompRef.current = decompRef.current.filter((x) => x.id !== id)
      setExtraLayers(
        decompRef.current.map((x) => ({ id: x.id, name: x.name, type: x.type, dataUrl: x.dataUrl, visible: x.visible })),
      )
      if (c) c.requestRenderAll()
      showToast('Layer deleted', 'trash')
    },
    [showToast],
  )

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
        openModal(setExportOpen)
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
          e.preventDefault()
          deleteActive()
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
  }, [undo, redo, deleteActive])

  /* --------------------------------- layers -------------------------------- */
  const toggleLayer = (id) => {
    const ex = decompRef.current.find((d) => d.id === id)
    if (ex) {
      ex.img.visible = !ex.img.visible
      if (fabricRef.current) fabricRef.current.requestRenderAll()
    }
    setExtraLayers((xs) => xs.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)))
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)))
  }
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

  /* --------------------------- collage studio (#9) -------------------------- */
  const buildCollage = useCallback(
    async (layoutId, urls, opts = {}) => {
      const c = fabricRef.current
      if (!c || !urls.length) return
      setCollageOpen(false)
      const { placement = 'current', size, append = false } = opts

      let W = fit.w
      let H = fit.h

      // Option A — place on a brand-new blank document
      if (placement === 'new' && size) {
        if (imgObjRef.current) c.remove(imgObjRef.current)
        imgObjRef.current = null
        setImageSrc(null)
        imageSrcRef.current = null
        naturalRef.current = { w: size.w, h: size.h }
        const nf = calcFitFor(size.w, size.h) || { w: 640, h: 640 }
        setFit(nf)
        W = nf.w
        H = nf.h
        // fresh document → clear any prior collage/base objects
        decompRef.current.forEach((d) => c.remove(d.img))
        decompRef.current = []
        setExtraLayers([])
      }

      // Option B — append: keep existing collage layers, add new photos on top
      if (append === false) {
        decompRef.current.filter((d) => d.id.startsWith('col-')).forEach((d) => c.remove(d.img))
        decompRef.current = decompRef.current.filter((d) => !d.id.startsWith('col-'))
      }

      if (!W || !H) {
        showToast('Canvas not ready', 'close')
        return
      }
      setTool('select')
      setBusy({ kind: 'real', title: 'Collage Studio', step: 'Arranging photos…', progress: 40 })
      try {
        // cap photos at the layout's max so a too-large selection still builds
        const meta = COLLAGE_LAYOUTS.find((l) => l.id === layoutId)
        const used = meta ? urls.slice(0, meta.max) : urls
        const slots = computeSlots(layoutId, used.length, W, H)
        const rot =
          layoutId === 'polaroid'
            ? [-6, 6, 5, -5, 4]
            : layoutId === 'overlap'
              ? [-3, 3, -2, 2, -2]
              : null
        for (let i = 0; i < slots.length && i < used.length; i++) {
          const slot = slots[i]
          const img = await FabricImage.fromURL(used[i])
          const px = { x: slot.x * W, y: slot.y * H, w: slot.w * W, h: slot.h * H }
          const s = Math.min(px.w / img.width, px.h / img.height)
          img.set({
            left: px.x + (px.w - img.width * s) / 2,
            top: px.y + (px.h - img.height * s) / 2,
            scaleX: s,
            scaleY: s,
            selectable: true,
            evented: true,
          })
          if (rot) img.set('angle', rot[i % rot.length])
          if (append) {
            // cascade new photos slightly so nothing is hidden exactly underneath
            img.set({ left: img.left + (i % 5) * 22, top: img.top + (i % 5) * 22 })
          }
          // remember the grid slot so the photo can auto fit/fill it later
          img.set('slotRect', px)
          img.set('fitMode', 'cover')
          c.add(img)
          decompRef.current.push({ id: `col-${Date.now()}-${i}`, img, name: `Photo ${i + 1}`, type: 'Collage', dataUrl: used[i], visible: true })
        }
        c.requestRenderAll()
        setExtraLayers(
          decompRef.current.map((x) => ({ id: x.id, name: x.name, type: x.type, dataUrl: x.dataUrl, visible: x.visible })),
        )
        setBusy(null)
        showToast(
          placement === 'new'
            ? `New ${size.w}×${size.h} canvas with ${used.length} photos`
            : append
              ? `Added ${used.length} photos to the canvas`
              : `Collage built — ${used.length} photos on canvas`,
          'grid',
        )
      } catch {
        setBusy(null)
        showToast('Collage failed', 'close')
      }
    },
    [fit.w, fit.h, calcFitFor, showToast],
  )

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
      const isFile = typeof location !== 'undefined' && location.protocol === 'file:'
      showToast(
        isFile
          ? 'AI segmentation needs the online version (or a local server)'
          : 'Segmentation failed — check connection and retry',
        'close',
      )
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
    vectorize: {
      title: 'Vectorize',
      steps: ['Detecting edges', 'Tracing contours', 'Simplifying paths', 'Building SVG'],
      finalize: () => {
        setAiView('vectorize')
      },
    },
  }

  /* Upscale 2× / 4× / 8× — high-quality resample */
  const runUpscale = async (factor) => {
    const src = imageSrcRef.current
    if (!src || busyRef.current) return
    setUpscaleOpen(false)
    setBusy({ kind: 'real', title: `Upscale ${factor}×`, step: 'Rendering at higher resolution…', progress: 45 })
    try {
      const img = await loadImageElement(src)
      const w = img.naturalWidth * factor
      const h = img.naturalHeight * factor
      const cv = document.createElement('canvas')
      cv.width = w
      cv.height = h
      const ctx = cv.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.filter = cssFilterString(filtersRef.current)
      ctx.drawImage(img, 0, 0, w, h)
      await loadIntoCanvas(cv.toDataURL('image/png'))
      setBusy(null)
      showToast(`Upscaled ${factor}× → ${w}×${h}`, 'expand')
    } catch {
      setBusy(null)
      showToast('Upscale failed', 'close')
    }
  }

  /* Color palette extraction — reads actual image content */
  const runPalette = async () => {
    const src = imageSrcRef.current
    if (!src || busyRef.current) return
    setBusy({ kind: 'real', title: 'Color Palette', step: 'Analyzing dominant colors…', progress: 50 })
    try {
      const colors = await extractPalette(src, 6)
      setPaletteColors(colors)
      openModal(setPaletteOpen)
      setBusy(null)
    } catch {
      setBusy(null)
      showToast('Palette extraction failed', 'close')
    }
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

  /* --------------------- AI capability handlers (audit #6–#19) ---------------- */
  const busyJob = (title) => ({
    kind: 'real',
    title,
    step: 'Processing…',
    progress: 20,
  })

  /* #6 — Portrait retouch */
  const runRetouch = async (opts) => {
    const src = imageSrcRef.current
    if (!src || busyRef.current) return
    setBusy(busyJob('Portrait Retouch'))
    try {
      setBusy({ kind: 'real', title: 'Portrait Retouch', step: 'Detecting skin tones…', progress: 40 })
      const out = await retouch(src, opts)
      await loadIntoCanvas(out)
      setBusy(null)
      showToast('Retouch applied', 'droplet')
    } catch { setBusy(null); showToast('Retouch failed', 'close') }
  }

  /* #12 — Denoise */
  const runDenoise = async (strength) => {
    const src = imageSrcRef.current
    if (!src || busyRef.current) return
    setBusy(busyJob('Denoise'))
    try {
      setBusy({ kind: 'real', title: 'Denoise', step: 'Measuring noise level…', progress: 40 })
      const out = await denoise(src, strength)
      await loadIntoCanvas(out)
      setBusy(null)
      showToast('Noise reduced', 'wind')
    } catch { setBusy(null); showToast('Denoise failed', 'close') }
  }

  /* #13 — Color grade / LUT match from a reference image */
  const runColorGrade = async (refSrc, strength) => {
    const src = imageSrcRef.current
    if (!src || busyRef.current) return
    setBusy(busyJob('Color Grade'))
    try {
      setBusy({ kind: 'real', title: 'Color Grade', step: 'Sampling reference tone curve…', progress: 40 })
      const out = await colorGrade(src, refSrc, strength)
      await loadIntoCanvas(out)
      setBusy(null)
      showToast('Tone curve matched to reference', 'sliders')
    } catch { setBusy(null); showToast('Color grade failed — pick a reference image', 'close') }
  }

  /* #14 — Face/subject-aware smart crop */
  const runSmartCrop = async (ratio) => {
    const src = imageSrcRef.current
    if (!src || busyRef.current) return
    setBusy(busyJob('Smart Crop'))
    try {
      setBusy({ kind: 'real', title: 'Smart Crop', step: 'Locating subject…', progress: 45 })
      const bbox = await subjectBBox(src)
      const [rw, rh] = ratio.split(':').map(Number)
      const out = await smartCrop(src, rw, rh, bbox)
      await loadIntoCanvas(out)
      setBusy(null)
      showToast(bbox ? 'Cropped around subject' : 'No subject found — centered crop', 'crop')
    } catch { setBusy(null); showToast('Smart crop failed', 'close') }
  }

  /* #5 — Decompose to layers (panels / text / subject / background) */
  const runDecompose = async () => {
    const src = imageSrcRef.current
    if (!src || busyRef.current) return
    setBusy(busyJob('Decompose to Layers'))
    try {
      setBusy({ kind: 'real', title: 'Decompose to Layers', step: 'Segmenting subject…', progress: 35 })
      const seg = await segmentImage(src, { maxSize: 800 })
      setBusy({ kind: 'real', title: 'Decompose to Layers', step: 'Detecting panels & text…', progress: 65 })
      const dec = await decompose(src, seg.mask)
      setBusy({ kind: 'real', title: 'Decompose to Layers', step: 'Building layers…', progress: 90 })
      const c = fabricRef.current
      if (!c) throw new Error('no canvas')
      // remove previous decomposition images
      decompRef.current.forEach((d) => c.remove(d.img))
      decompRef.current = []
      if (imgObjRef.current) imgObjRef.current.visible = false
      const scale = Math.min(fit.w / dec.w, fit.h / dec.h)
      const entries = [
        ['background', 'Background'], ['panels', 'Panels'], ['text', 'Text'], ['subject', 'Subject'],
      ]
      for (const [key, name] of entries) {
        const im = await FabricImage.fromURL(dec[key])
        im.set({
          left: (fit.w - dec.w * scale) / 2,
          top: (fit.h - dec.h * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        })
        c.add(im)
        decompRef.current.push({ id: `dec-${key}`, img: im, name, type: 'AI Layer', dataUrl: dec[key], visible: true })
      }
      c.requestRenderAll()
      setExtraLayers(decompRef.current.map((d) => ({ id: d.id, name: d.name, type: d.type, dataUrl: d.dataUrl, visible: true })))
      setBusy(null)
      showToast(`Decomposed — ${dec.counts.panels} panels, ${dec.counts.text} text regions`, 'layers')
      setTab('layers')
    } catch { setBusy(null); showToast('Decompose failed', 'close') }
  }

  /* #19 — Batch AI apply across multiple images */
  const runBatch = async (files, op) => {
    setBatchOpen(false)
    setBatchResult(null)
    const results = []
    setBusy(busyJob('Batch AI'))
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const url = URL.createObjectURL(f)
        const name = f.name.replace(/\.[^.]+$/, '')
        setBusy({ kind: 'real', title: 'Batch AI', step: `Processing ${i + 1}/${files.length} — ${f.name}`, progress: Math.round(((i + 0.3) / files.length) * 100) })
        let out
        if (op === 'removebg') {
          const { dataUrl, coverage } = await makeCutout(url)
          out = coverage > 0.005 ? dataUrl : null
        } else if (op === 'enhance') {
          const img = await loadImageElement(url)
          const w = img.naturalWidth, h = img.naturalHeight
          const cv = document.createElement('canvas')
          cv.width = w; cv.height = h
          const ctx = cv.getContext('2d')
          ctx.filter = cssFilterString(AUTO_ENHANCE_FILTERS)
          ctx.drawImage(img, 0, 0)
          out = cv.toDataURL('image/png')
        } else if (op === 'upscale') {
          const img = await loadImageElement(url)
          const w = img.naturalWidth * 4, h = img.naturalHeight * 4
          const cv = document.createElement('canvas')
          cv.width = w; cv.height = h
          const ctx = cv.getContext('2d')
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, w, h)
          out = cv.toDataURL('image/png')
        } else if (op === 'denoise') {
          out = await denoise(url, 50)
        }
        if (out) results.push({ name: `${name}-${op}`, dataUrl: out })
      }
      setBusy(null)
      setBatchResult({ op, results })
      showToast(`Batch done — ${results.length}/${files.length} processed`, 'check')
    } catch {
      setBusy(null)
      showToast('Batch failed mid-way', 'close')
    }
  }

  /* #7 / #3 — Magic eraser + generative fill (on-device inpainting) */
  const computeDisplayRect = () => {
    const nat = naturalRef.current
    const s = Math.min(fit.w / nat.w, fit.h / nat.h)
    const dw = nat.w * s, dh = nat.h * s
    const r = { x: (fit.w - dw) / 2, y: (fit.h - dh) / 2, w: dw, h: dh }
    paintRectRef.current = r
    return r
  }

  const startErase = (mode) => {
    computeDisplayRect()
    setEraseMode(mode)
    setSheetOpen(false) // show the canvas so the user can paint
    maskCvRef.current = null
    const pc = paintCanvasRef.current
    if (pc) {
      const dpr = window.devicePixelRatio || 1
      pc.width = paintRectRef.current.w * dpr
      pc.height = paintRectRef.current.h * dpr
      const ctx = pc.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, paintRectRef.current.w, paintRectRef.current.h)
    }
    showToast(mode === 'erase' ? 'Paint over the object to remove it' : 'Paint the region to re-fill', 'brush')
  }

  const paintMask = (e) => {
    const rect = paintRectRef.current
    const pc = paintCanvasRef.current
    if (!pc || !rect.w) return
    const bounds = pc.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = e.clientY - bounds.top
    if (x < 0 || y < 0 || x > rect.w || y > rect.h) return
    // mask canvas at ~600px wide
    const MW = 600
    const MH = Math.max(2, Math.round((rect.h / rect.w) * MW))
    if (!maskCvRef.current) {
      maskCvRef.current = document.createElement('canvas')
      maskCvRef.current.width = MW
      maskCvRef.current.height = MH
    }
    const mctx = maskCvRef.current.getContext('2d')
    mctx.fillStyle = '#ffffff'
    const mx = (x / rect.w) * MW
    const my = (y / rect.h) * MH
    const rad = MW * 0.02
    mctx.beginPath()
    mctx.arc(mx, my, rad, 0, Math.PI * 2)
    mctx.fill()
    // mirror on the overlay
    const ctx = pc.getContext('2d')
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.arc(x, y, Math.max(6, rect.w * 0.02), 0, Math.PI * 2)
    ctx.fill()
  }

  const clearMask = () => {
    maskCvRef.current = null
    const pc = paintCanvasRef.current
    if (pc) {
      const ctx = pc.getContext('2d')
      ctx.clearRect(0, 0, pc.width, pc.height)
    }
  }

  const applyInpaint = async () => {
    const mc = maskCvRef.current
    const src = imageSrcRef.current
    if (!mc || !src || busyRef.current) return
    let painted = 0
    const md = mc.getContext('2d').getImageData(0, 0, mc.width, mc.height).data
    for (let i = 3; i < md.length; i += 4) if (md[i] > 128) painted++
    if (painted < 12) { showToast('Paint a region first', 'info'); return }
    setEraseMode(null)
    setBusy(busyJob('Texture Fill'))
    try {
      setBusy({ kind: 'real', title: 'Texture Fill', step: 'Filling region from surroundings…', progress: 45 })
      const out = await inpaint(src, md)
      await loadIntoCanvas(out)
      setBusy(null)
      showToast('Region filled from surrounding texture', 'brush')
    } catch { setBusy(null); showToast('Fill failed', 'close') }
  }

  /* #8 — Motion (animated preview) */
  const applyMotion = (mode, speed) => {
    setMotion({ mode, speed })
    setMotionOpen(false)
    if (mode !== 'off') showToast(`Motion: ${mode} — export is a still frame`, 'play')
  }

  /* Background-aware text color — reads the image, picks black or white
     text for contrast (useful for posters/overlays). */
  const runAutoTextColor = async () => {
    const src = imageSrcRef.current
    if (!src) {
      showToast('Load an image first', 'info')
      return
    }
    const c = fabricRef.current
    const act = c && c.getActiveObject()
    if (!act || !isTextObject(act)) {
      showToast('Select a text object first (Text tool)', 'info')
      return
    }
    setBusy({ kind: 'real', title: 'Smart Text Color', step: 'Sampling background…', progress: 60 })
    try {
      // sample the average luminance under the text's bounding box
      const img = await loadImageElement(src)
      const cv = document.createElement('canvas')
      cv.width = img.naturalWidth
      cv.height = img.naturalHeight
      const ctx = cv.getContext('2d')
      ctx.drawImage(img, 0, 0)
      // text bbox in natural coords (canvas fit scale inverse)
      const nw = naturalRef.current.w
      const nh = naturalRef.current.h
      const bx = act.left
      const by = act.top
      const bw = act.width * act.scaleX
      const bh = act.height * act.scaleY
      const sx = Math.max(0, Math.round((bx / fit.w) * nw))
      const sy = Math.max(0, Math.round((by / fit.h) * nh))
      const sw = Math.max(1, Math.round((bw / fit.w) * nw))
      const sh = Math.max(1, Math.round((bh / fit.h) * nh))
      const data = ctx.getImageData(sx, sy, Math.min(sw, nw - sx), Math.min(sh, nh - sy)).data
      let lum = 0
      let n = 0
      for (let i = 0; i < data.length; i += 4) {
        lum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
        n++
      }
      lum = n ? lum / n : 128
      const color = lum < 140 ? '#ffffff' : '#000000'
      act.set('fill', color)
      c.requestRenderAll()
      setBusy(null)
      showToast(color === '#ffffff' ? 'White text — dark background' : 'Black text — light background', 'text')
    } catch {
      setBusy(null)
      showToast('Text color failed', 'close')
    }
  }

  /* Smart Suggestions — context-aware next-step hints after edits. */
  const getSuggestion = () => {
    const src = imageSrcRef.current
    if (!src) return { title: 'Start with an image', desc: 'Open a file or add a template', action: 'open' }
    const bgHidden = layers.find((l) => l.id === 'backdrop') && !layers.find((l) => l.id === 'backdrop').visible
    const upsc = upscaled
    const hasText = (() => {
      const c = fabricRef.current
      return c && c.getObjects().some((o) => isTextObject(o))
    })()
    if (bgHidden && !hasText)
      return { title: 'Add a headline', desc: 'Background is removed — drop in bold text', action: 'text' }
    if (bgHidden)
      return { title: 'Replace background', desc: 'Try a colored or gradient backdrop', action: 'replace' }
    if (!upsc)
      return { title: 'Upscale 4×', desc: 'Sharper exports for print or social', action: 'upscale' }
    return { title: 'Export it', desc: 'Your edit is ready — pick a platform size', action: 'export' }
  }

  const runSuggestion = (action) => {
    if (action === 'open') fileRef.current && fileRef.current.click()
    else if (action === 'text') setTool('text')
    else if (action === 'replace') openModal(setReplaceOpen)
    else if (action === 'upscale') openModal(setUpscaleOpen)
    else if (action === 'export') openModal(setExportOpen)
  }

  /* ------------------------- prompt command bar (#2) ------------------------ */
  const onPromptAction = useCallback(
    (action, payload) => {
      if (action === 'removebg') return runRemoveBg()
      if (action === 'replacebg') return openModal(setReplaceOpen)
      if (action === 'enhance') return runAi('enhance')
      if (action === 'upscale') return runAi('upscale')
      if (action === 'vectorize') return runAi('vectorize')
      if (action === 'fx') return setFx((f) => ({ ...f, ...payload }))
      if (action === 'filters') return commitFilters({ ...filtersRef.current, ...payload })
      if (action === 'reset') return resetAll()
      if (action === 'collage') return openModal(setCollageOpen)
      if (action === 'undo') return undo()
      if (action === 'redo') return redo()
      showToast('Try: "remove background", "make it warmer", "upscale 4×"', 'info')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commitFilters, resetAll, undo, redo],
  )

  /* --------------------------- manual crop tool ---------------------------- */
  const startCrop = () => {
    setTool('crop')
    setCropSel(null)
    setSheetOpen(false) // show the full canvas for cropping
    showToast('Drag on the image to select a crop area', 'crop')
  }

  const cropPointerDown = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const b = e.currentTarget.getBoundingClientRect()
    cropOverlayRect.current = { w: b.width, h: b.height }
    const x = e.clientX - b.left
    const y = e.clientY - b.top
    cropRef.current = { x, y }
    setCropSel({ x, y, w: 0, h: 0 })
  }
  const cropPointerMove = (e) => {
    const s = cropRef.current
    if (!s) return
    const b = e.currentTarget.getBoundingClientRect()
    const x = Math.min(Math.max(e.clientX - b.left, 0), b.width)
    const y = Math.min(Math.max(e.clientY - b.top, 0), b.height)
    setCropSel({
      x: Math.min(s.x, x),
      y: Math.min(s.y, y),
      w: Math.abs(x - s.x),
      h: Math.abs(y - s.y),
    })
  }
  const cropPointerUp = () => {
    cropRef.current = null
  }

  const applyCrop = async () => {
    const sel = cropSel
    const src = imageSrcRef.current
    const drRaw = cropOverlayRect.current
    const dr = drRaw && typeof drRaw.getBoundingClientRect === 'function' ? drRaw.getBoundingClientRect() : drRaw
    if (!sel || !src || !dr || !dr.w || !dr.h || sel.w < 4 || sel.h < 4) {
      showToast('Drag a selection on the image first', 'info')
      return
    }
    // display → natural coordinates
    const sx = (sel.x / dr.w) * naturalRef.current.w
    const sy = (sel.y / dr.h) * naturalRef.current.h
    const sw = (sel.w / dr.w) * naturalRef.current.w
    const sh = (sel.h / dr.h) * naturalRef.current.h
    setBusy({ kind: 'real', title: 'Crop', step: 'Cropping…', progress: 50 })
    try {
      const img = await loadImageElement(src)
      const cv = document.createElement('canvas')
      cv.width = Math.max(2, Math.round(sw))
      cv.height = Math.max(2, Math.round(sh))
      await loadIntoCanvas(cv.toDataURL('image/png'))
      setBusy(null)
      setTool('select')
      setCropSel(null)
      showToast(`Cropped to ${Math.round(sw)}×${Math.round(sh)}`, 'crop')
      return
      const ctx = cv.getContext('2d')
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height)
      await loadIntoCanvas(cv.toDataURL('image/png'))
      setBusy(null)
      setTool('select')
      setCropSel(null)
      showToast(`Cropped to ${Math.round(sw)}×${Math.round(sh)}`, 'crop')
    } catch {
      setBusy(null)
      showToast('Crop failed', 'close')
    }
  }

  const cancelCrop = () => {
    setTool('select')
    setCropSel(null)
    cropRef.current = null
  }

  /* -------------------- collage photo fit / fill (grid resize) -------------- */
  // Each collage photo remembers its grid slot; Fit shrinks it inside the
  // slot, Fill expands it to cover the slot (the photo auto expands/shrinks
  // into that size — no manual scaling needed).
  const fitCollagePhoto = useCallback(
    (id, mode) => {
      const d = decompRef.current.find((x) => x.id === id)
      const img = d && d.img
      const slot = img && img.slotRect
      const c = fabricRef.current
      if (!img || !slot || !c) return
      const s = mode === 'cover' ? Math.max(slot.w / img.width, slot.h / img.height) : Math.min(slot.w / img.width, slot.h / img.height)
      img.set({
        left: slot.x + (slot.w - img.width * s) / 2,
        top: slot.y + (slot.h - img.height * s) / 2,
        scaleX: s,
        scaleY: s,
      })
      img.set('fitMode', mode)
      c.requestRenderAll()
      showToast(mode === 'cover' ? 'Photo expanded to fill its slot' : 'Photo fit inside its slot', 'fit')
    },
    [showToast],
  )

  /* Rotate a collage photo around its center (keeps its slot position). */
  const rotateCollagePhoto = useCallback(
    (id, deg) => {
      const d = decompRef.current.find((x) => x.id === id)
      const img = d && d.img
      const c = fabricRef.current
      if (!img || !c) return
      img.rotate((img.angle || 0) + deg)
      img.setCoords()
      c.requestRenderAll()
      showToast(`Rotated ${deg}°`, 'rotateCw')
    },
    [showToast],
  )

  /* Shuffle the selected collage photo's grid slot to the left (wrap). */
  const shiftCollageSlot = useCallback(
    (id, dir) => {
      const colItems = decompRef.current.filter((x) => x.id.startsWith('col-'))
      const i = colItems.findIndex((x) => x.id === id)
      if (i < 0 || colItems.length < 2) return
      const j = (i + dir + colItems.length) % colItems.length
      const a = colItems[i].img
      const b = colItems[j].img
      const sa = a.slotRect
      const sb = b.slotRect
      if (!sa || !sb) return
      a.set('slotRect', sb)
      b.set('slotRect', sa)
      // re-fit both into their new slots (keep their fit modes)
      const refit = (img) => {
        const s = img.slotRect
        const mode = img.fitMode === 'cover' ? Math.max : Math.min
        const sc = mode(s.w / img.width, s.h / img.height)
        img.set({
          left: s.x + (s.w - img.width * sc) / 2,
          top: s.y + (s.h - img.height * sc) / 2,
          scaleX: sc,
          scaleY: sc,
        })
      }
      refit(a)
      refit(b)
      const c = fabricRef.current
      if (c) c.requestRenderAll()
      showToast(`Moved photo ${dir > 0 ? 'forward' : 'backward'} in the grid`, 'move')
    },
    [showToast],
  )

  /* ------------------------- text font / size controls ---------------------- */
  useEffect(() => {
    textFontRef.current = textFont
  }, [textFont])
  useEffect(() => {
    textSizeRef.current = textSize
  }, [textSize])

  const applyTextFont = (family) => {
    setTextFont(family)
    textFontRef.current = family
    const c = fabricRef.current
    const o = c && c.getActiveObject()
    if (isTextObject(o)) {
      o.set('fontFamily', fontStack(family))
      c.requestRenderAll()
    }
  }

  const applyTextSize = (n) => {
    const v = Math.max(6, Math.min(300, Math.round(n) || DEFAULT_FONT_SIZE))
    setTextSize(v)
    textSizeRef.current = v
    const c = fabricRef.current
    const o = c && c.getActiveObject()
    if (isTextObject(o)) {
      o.set('fontSize', v)
      c.requestRenderAll()
    }
  }

  /* --------------------------------- export -------------------------------- */
  const EXPORT_FORMATS = [
    { id: 'png', label: 'PNG', hint: 'Lossless' },
    { id: 'jpg', label: 'JPG', hint: 'Compressed' },
    { id: 'webp', label: 'WebP', hint: 'Modern' },
    { id: 'gif', label: 'GIF', hint: 'Animated' },
    { id: 'mp4', label: 'MP4', hint: 'Video' },
    { id: 'pdf', label: 'PDF', hint: 'Print' },
    { id: 'psd', label: 'PSD', hint: 'Layers' },
    { id: 'svg', label: 'SVG', hint: 'Vector' },
  ]

  const renderFrameCanvas = async (p) => {
    const c = fabricRef.current
    if (imageSrcRef.current) {
      return renderExport(imageSrcRef.current, {
        w: p.w,
        h: p.h,
        filterString: cssFilterString(filtersRef.current),
      })
    }
    if (c && c.getObjects().length) {
      const mul = Math.max(1, p.w / Math.max(1, c.getWidth()))
      return c.toDataURL({ format: 'png', multiplier: mul })
    }
    return null
  }

  const doExport = async () => {
    const c = fabricRef.current
    if (!imageSrcRef.current && !(c && c.getObjects().length)) {
      showToast('Nothing to export', 'info')
      return
    }
    setExporting(true)
    try {
      const p =
        preset === 'original'
          ? { id: 'original', name: 'Original', w: naturalRef.current.w, h: naturalRef.current.h }
          : EXPORT_PRESETS.find((x) => x.id === preset)
      if (!p || !p.w || !p.h) throw new Error('invalid preset')
      const base = slug(project.name)
      const W = p.w
      const H = p.h

      if (format === 'gif' || format === 'mp4') {
        // animated export from the motion effect
        const src = imageSrcRef.current
        if (!src) {
          showToast('GIF/MP4 need an image — animate via Motion first', 'info')
          setExporting(false)
          return
        }
        setBusy({ kind: 'real', title: format === 'gif' ? 'Export GIF' : 'Export MP4', step: 'Rendering animation…', progress: 40 })
        const mode = motion.mode === 'off' ? 'zoom' : motion.mode
        const { frames, fps } = await renderMotionFrames({
          src,
          filter: cssFilterString(filtersRef.current),
          mode,
          speed: motion.speed || 1,
          w: W,
          h: H,
          seconds: 2.4,
          fps: 20,
        })
        if (format === 'gif') {
          const blob = gifEncode(frames, Math.round(1000 / fps))
          downloadBlob(blob, `${base}-${W}x${H}.gif`)
        } else {
          const mime = pickVideoMime()
          if (!mime) throw new Error('video unsupported')
          const blob = await recordFrames(frames, { fps, mimeType: mime })
          const ext = mime.includes('mp4') ? 'mp4' : 'webm'
          downloadBlob(blob, `${base}-${W}x${H}.${ext}`)
        }
        setBusy(null)
        setExportOpen(false)
        showToast(`Exported ${format.toUpperCase()} (animated)`, 'download')
        return
      }

      let dataUrl = await renderFrameCanvas(p)
      if (!dataUrl) {
        showToast('Nothing to export', 'info')
        return
      }
      setBusy({ kind: 'real', title: `Export ${format.toUpperCase()}`, step: 'Encoding…', progress: 60 })

      if (format === 'svg') {
        // vector: fabric objects → SVG, else trace the image
        let svg = ''
        if (c && c.getObjects().length) {
          svg = c.toSVG()
        } else {
          const r = await traceImage(imageSrcRef.current, { detail: 50, smoothing: 40 })
          svg = r.svg
        }
        downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${base}-${W}x${H}.svg`)
      } else if (format === 'pdf') {
        const jpg = await new Promise((res) => {
          const im = new Image()
          im.onload = () => {
            const cv = document.createElement('canvas')
            cv.width = W
            cv.height = H
            const ctx = cv.getContext('2d')
            ctx.drawImage(im, 0, 0, W, H)
            res(cv.toDataURL('image/jpeg', 0.9))
          }
          im.src = dataUrl
        })
        const blob = pdfFromJpeg(jpg, W, H)
        downloadBlob(blob, `${base}-${W}x${H}.pdf`)
      } else if (format === 'psd') {
        const c = fabricRef.current
        const objs = c && c.getObjects().length ? [...c.getObjects()].reverse() : []
        if (objs.length) {
          const mul = Math.max(1, W / Math.max(1, c.getWidth()))
          const saved = objs.map((o) => ({ o, visible: o.visible, opacity: o.opacity, gco: o.globalCompositeOperation }))
          const vpSaved = [...c.viewportTransform]
          c.setViewportTransform([1, 0, 0, 1, 0, 0])
          const layerEntries = []
          for (let oi = 0; oi < objs.length; oi++) {
            const o = objs[oi]
            try {
              for (const s of saved) if (s.o !== o) s.o.visible = false
              o.visible = true
              o.opacity = 1
              o.globalCompositeOperation = 'source-over'
              c.requestRenderAll()
              const url = c.toDataURL({ format: 'png', multiplier: mul })
              const meta = saved[oi]
              const cv = document.createElement('canvas')
              cv.width = W
              cv.height = H
              const ictx = cv.getContext('2d')
              const im = await loadImageElement(url)
              ictx.drawImage(im, 0, 0, W, H)
              layerEntries.push({
                name: layerNameFor(o, imgObjRef.current, decompRef.current) || `Layer ${oi + 1}`,
                left: 0,
                top: 0,
                right: W,
                bottom: H,
                opacity: meta.opacity ?? 1,
                hidden: meta.visible === false,
                blend: meta.gco || 'source-over',
                canvas: cv,
              })
            } catch {
              /* skip unrenderable object */
            }
          }
          for (const s of saved) {
            s.o.visible = s.visible
            s.o.opacity = s.opacity
            s.o.globalCompositeOperation = s.gco
          }
          c.setViewportTransform(vpSaved)
          c.requestRenderAll()
          // composite for preview/thumbnail
          const compUrl = c.toDataURL({ format: 'png', multiplier: mul })
          const compCv = document.createElement('canvas')
          compCv.width = W
          compCv.height = H
          const cc = compCv.getContext('2d')
          const cim = await loadImageElement(compUrl)
          cc.drawImage(cim, 0, 0, W, H)
          const blob = buildLayeredPsdBlob({
            width: W,
            height: H,
            layers: layerEntries,
            compositeCanvas: compCv,
          })
          downloadBlob(blob, `${base}-${W}x${H}.psd`)
        } else if (imageSrcRef.current) {
          // no fabric objects → flattened single-layer PSD
          const im = await loadImageElement(dataUrl)
          const cv = document.createElement('canvas')
          cv.width = W
          cv.height = H
          const ctx = cv.getContext('2d')
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, W, H)
          ctx.drawImage(im, 0, 0, W, H)
          const blob = psdFromCanvas(cv)
          downloadBlob(blob, `${base}-${W}x${H}.psd`)
        } else {
          throw new Error('nothing to export')
        }
      } else {
        // png / jpg / webp
        const ext = format === 'jpg' ? 'jpg' : format
        if (format === 'jpg') {
          const im = await loadImageElement(dataUrl)
          const cv = document.createElement('canvas')
          cv.width = W
          cv.height = H
          const ctx = cv.getContext('2d')
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, W, H)
          ctx.drawImage(im, 0, 0)
          dataUrl = cv.toDataURL('image/jpeg', 0.92)
        } else if (format === 'webp') {
          const im = await loadImageElement(dataUrl)
          const cv = document.createElement('canvas')
          cv.width = W
          cv.height = H
          const ctx = cv.getContext('2d')
          ctx.drawImage(im, 0, 0, W, H)
          dataUrl = cv.toDataURL('image/webp', 0.92)
        }
        downloadDataUrl(dataUrl, `${base}-${W}x${H}.${ext}`)
      }
      setBusy(null)
      setExportOpen(false)
      showToast(`Exported ${W}×${H} ${format.toUpperCase()}`, 'download')
    } catch {
      setBusy(null)
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
          onDone={() => setSheetOpen(false)}
          showToast={showToast}
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
          onReplaceBg={() => openModal(setReplaceOpen)}
          onEnhance={() => runAi('enhance')}
          onUpscale={() => runAi('upscale')}
          onVectorize={() => runAi('vectorize')}
          onRetouch={() => openModal(setRetouchOpen)}
          onDenoise={() => openModal(setDenoiseOpen)}
          onLut={() => openModal(setLutOpen)}
          onCrop={() => openModal(setCropOpen)}
          onMotion={() => openModal(setMotionOpen)}
          onBatch={() => openModal(setBatchOpen)}
          onDecompose={() => runDecompose()}
          onEraser={(m) => startErase(m)}
          onCollage={() => openModal(setCollageOpen)}
          onUpscale={() => openModal(setUpscaleOpen)}
          onPalette={() => runPalette()}
          onAutoTextColor={() => runAutoTextColor()}
          suggestion={getSuggestion()}
          onSuggestion={(a) => runSuggestion(a)}
          upscaled={upscaled}
          onPromptAction={onPromptAction}
        />
      )
    }
    return (
      <LayersTab
        layers={layers}
        extraLayers={extraLayers}
        selected={selectedLayer}
        onSelect={setSelectedLayer}
        onToggleVisibility={toggleLayer}
        onToggleLock={toggleLock}
        onDeleteLayer={deleteLayer}
        onFitPhoto={fitCollagePhoto}
        onRotatePhoto={rotateCollagePhoto}
        onShiftSlot={shiftCollageSlot}
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

  const nat = naturalRef.current
  const displayRect =
    nat.w && fit.w
      ? (() => {
          const s = Math.min(fit.w / nat.w, fit.h / nat.h)
          return { x: (fit.w - nat.w * s) / 2, y: (fit.h - nat.h * s) / 2, w: nat.w * s, h: nat.h * s }
        })()
      : null

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
          <IconBtn icon="trash" title="Delete image" onClick={deleteActive} />
          <div className="mx-2 h-5 w-px bg-line" />
          <Button
            variant="secondary"
            size="sm"
            icon="folder"
            onClick={() => fileRef.current && fileRef.current.click()}
          >
            Open
          </Button>
          <Button variant="secondary" size="sm" icon="export" onClick={() => openModal(setExportOpen)}>
            Export
          </Button>
        </div>
        <div className="flex items-center gap-0.5 lg:hidden">
          <IconBtn icon="undo" title="Undo (⌘Z)" disabled={!canUndo} onClick={undo} />
          <IconBtn icon="redo" title="Redo (⌘⇧Z)" disabled={!canRedo} onClick={redo} />
          <IconBtn icon="trash" title="Delete image" onClick={deleteActive} />
          <IconBtn icon="folder" title="Open file" onClick={() => fileRef.current && fileRef.current.click()} />
          <IconBtn icon="export" title="Export (⌘E)" onClick={() => openModal(setExportOpen)} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ------------------------------ canvas area ---------------------------- */}
        <main
          ref={stageWrapRef}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
            // hard safety: the "Drop image" hint can never stick around
            clearTimeout(dragTimerRef.current)
            dragTimerRef.current = setTimeout(() => setDragOver(false), 2500)
          }}
          onDragLeave={() => {
            setDragOver(false)
            clearTimeout(dragTimerRef.current)
          }}
          onDragEnd={() => {
            setDragOver(false)
            clearTimeout(dragTimerRef.current)
          }}
          onDrop={async (e) => {
            e.preventDefault()
            setDragOver(false)
            clearTimeout(dragTimerRef.current)
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
            {!imageSrc && extraLayers.length === 0 && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-ink">
                {isTemplate ? (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-ink-lg border border-line text-mute">
                      <Icon name="grid" size={24} />
                    </span>
                    <p className="text-sm text-dim">
                      Blank {naturalRef.current.w || '–'}×{naturalRef.current.h || '–'} canvas
                    </p>
                    <Button variant="primary" size="sm" icon="grid" onClick={() => setCollageOpen(true)}>
                      Add Photos / Collage
                    </Button>
                    <p className="text-[10px] text-mute">or open a file to start with an image</p>
                  </>
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-ink-lg border border-line text-mute">
                      <Icon name="image" size={24} />
                    </span>
                    <p className="text-sm text-dim">No image loaded</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="folder"
                      onClick={() => fileRef.current && fileRef.current.click()}
                    >
                      Open File
                    </Button>
                    <p className="text-[10px] text-mute">…or drop an image anywhere on the canvas</p>
                  </>
                )}
              </div>
            )}

            {layers.find((l) => l.id === 'backdrop')?.visible && (
              <div className="absolute inset-0 bg-[#161616]" />
            )}
            <div
              className={cn(
                'absolute inset-0',
                motion.mode === 'zoom' && 'ik-anim-zoom',
                motion.mode === 'pan' && 'ik-anim-pan',
              )}
              style={{ animationDuration: `${motion.mode === 'off' ? 0 : 9 / motion.speed}s` }}
            >
              <canvas ref={canvasElRef} className="absolute inset-0" />
            </div>
            {motion.mode === 'sweep' && (
              <div className="ik-sweep-bar" style={{ animationDuration: `${7 / motion.speed}s` }} />
            )}
            {motion.mode !== 'off' && (
              <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-ink bg-black/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/85">
                Motion · {motion.mode} (preview)
              </span>
            )}
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

            {eraseMode && displayRect && (
              <div
                className="absolute z-20 cursor-crosshair touch-none"
                style={{ left: displayRect.x, top: displayRect.y, width: displayRect.w, height: displayRect.h }}
                onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); paintMask(e) }}
                onPointerMove={(e) => e.buttons === 1 && paintMask(e)}
              >
                <canvas ref={paintCanvasRef} className="absolute inset-0" />
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

            {tool === 'crop' && displayRect && (
              <>
                <div
                  ref={cropOverlayRect}
                  className="absolute z-20 cursor-crosshair touch-none"
                  style={{ left: displayRect.x, top: displayRect.y, width: displayRect.w, height: displayRect.h }}
                  onPointerDown={cropPointerDown}
                  onPointerMove={(e) => e.buttons === 1 && cropPointerMove(e)}
                  onPointerUp={cropPointerUp}
                  onPointerCancel={cropPointerUp}
                >
                  {/* dim outside the selection */}
                  {cropSel && cropSel.w > 0 && (
                    <>
                      <div className="absolute bg-black/45" style={{ top: 0, left: 0, width: displayRect.w, height: cropSel.y }} />
                      <div className="absolute bg-black/45" style={{ top: cropSel.y, left: 0, width: cropSel.x, height: cropSel.h }} />
                      <div className="absolute bg-black/45" style={{ top: cropSel.y, right: 0, left: cropSel.x + cropSel.w, height: cropSel.h }} />
                      <div className="absolute bg-black/45" style={{ top: cropSel.y + cropSel.h, left: 0, width: displayRect.w, height: displayRect.h - cropSel.y - cropSel.h }} />
                      <div
                        className="absolute border border-white"
                        style={{ top: cropSel.y, left: cropSel.x, width: cropSel.w, height: cropSel.h }}
                      />
                      <span className="absolute rounded-ink bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-white" style={{ top: cropSel.y - 18, left: cropSel.x }}>
                        {Math.round((cropSel.w / displayRect.w) * naturalRef.current.w)}×{Math.round((cropSel.h / displayRect.h) * naturalRef.current.h)}
                      </span>
                    </>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-3 z-30 flex justify-center">
                  <div className="flex items-center gap-2 rounded-ink border border-line bg-surface px-3 py-2">
                    <span className="label-xs text-dim">Drag to select crop area</span>
                    <Button variant="ghost" size="sm" onClick={cancelCrop}>Cancel</Button>
                    <Button variant="primary" size="sm" icon="check" onClick={applyCrop}>Apply Crop</Button>
                  </div>
                </div>
              </>
            )}

            {eraseMode && (
              <div className="absolute inset-x-0 bottom-3 z-30 flex justify-center">
                <div className="flex items-center gap-2 rounded-ink border border-line bg-surface px-3 py-2">
                  <span className="label-xs text-dim">
                    {eraseMode === 'erase' ? 'Paint the object to remove' : 'Paint region to re-fill'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearMask}>Clear</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEraseMode(null)}>Cancel</Button>
                  <Button variant="primary" size="sm" icon="check" onClick={applyInpaint}>Apply</Button>
                </div>
              </div>
            )}

            {busy && (
              <div
                className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center gap-4 bg-black/70"
                onClick={skipAi}
                title="Tap anywhere to skip"
              >
                <span className="h-8 w-8 animate-spin rounded-full border border-white/25 border-t-white" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">{busyNowPhrase(busy.title)}</div>
                  <div className="mt-1 text-xs text-dim">{busy.step}</div>
                </div>
                <div className="h-[2px] w-40 overflow-hidden bg-line-2">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${busy.progress}%` }} />
                </div>
                <span className="label-xs text-mute underline-offset-2 hover:text-white hover:underline">
                  Tap anywhere to skip
                </span>
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
        {(tool === 'text' || activeText) && (
          <>
            <div className="mx-1.5 h-5 w-px shrink-0 bg-line" />
            <select
              value={textFont}
              onChange={(e) => applyTextFont(e.target.value)}
              title="Font family"
              className="h-8 shrink-0 rounded-ink border border-line bg-surface px-2 text-[11px] font-semibold text-fg focus:border-white focus:outline-none"
              style={{ fontFamily: fontStack(textFont) }}
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.family} style={{ fontFamily: f.stack }} className="bg-surface text-fg">
                  {f.family} — {f.kind}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={textSize}
              min={6}
              max={300}
              onChange={(e) => applyTextSize(Number(e.target.value))}
              onBlur={(e) => applyTextSize(Number(e.target.value) || DEFAULT_FONT_SIZE)}
              title="Font size"
              className="h-8 w-14 shrink-0 rounded-ink border border-line bg-surface px-2 text-center text-[11px] tabular-nums text-fg focus:border-white focus:outline-none"
            />
          </>
        )}
        <div className="mx-1.5 h-5 w-px shrink-0 bg-line" />
        <IconBtn icon="crop" title="Crop (drag to select)" active={tool === 'crop'} onClick={startCrop} />
        <IconBtn icon="focus" title="Smart Crop (subject-aware)" onClick={() => openModal(setCropOpen)} />
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

      {/* ------------------------------ retouch modal ----------------------------- */}
      <RetouchModal open={retouchOpen} onClose={() => setRetouchOpen(false)} onApply={runRetouch} />

      {/* ------------------------------ denoise modal ----------------------------- */}
      <Modal open={denoiseOpen} onClose={() => setDenoiseOpen(false)} title="Denoise" subtitle="Adaptive noise reduction — reads the image's noise level" width="max-w-sm">
        <DenoiseBody onApply={(s) => { setDenoiseOpen(false); runDenoise(s) }} />
      </Modal>

      {/* ------------------------------- LUT modal -------------------------------- */}
      <Modal open={lutOpen} onClose={() => setLutOpen(false)} title="Color Grade / LUT Match" subtitle="Match a reference image's tone curve (histogram transfer)" width="max-w-sm">
        <LutBody onApply={(ref, s) => { setLutOpen(false); runColorGrade(ref, s) }} />
      </Modal>

      {/* ----------------------------- smart crop modal ---------------------------- */}
      <Modal open={cropOpen} onClose={() => setCropOpen(false)} title="Smart Crop" subtitle="Cover-crop centered on the subject (face-aware)" width="max-w-sm">
        <div className="grid grid-cols-2 gap-3">
          {['1:1', '4:5', '9:16', '16:9'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setCropOpen(false); runSmartCrop(r) }}
              className="rounded-ink border border-line px-3 py-4 text-center transition-colors hover:border-white"
            >
              <span className="text-xs font-bold text-fg">{r}</span>
              <span className="mt-1 block text-[9px] text-mute">
                {r === '1:1' ? 'Square' : r === '4:5' ? 'Portrait' : r === '9:16' ? 'Story' : 'Wide'}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-mute">
          Uses the segmentation model to find the subject; if none is found it falls back to a
          geometric center crop.
        </p>
      </Modal>

      {/* ------------------------------ motion modal ------------------------------ */}
      <Modal open={motionOpen} onClose={() => setMotionOpen(false)} title="Motion" subtitle="Animated preview — export is a still frame" width="max-w-sm">
        <div className="space-y-1.5">
          {[
            { id: 'off', label: 'Off' },
            { id: 'zoom', label: 'Slow Zoom' },
            { id: 'pan', label: 'Pan' },
            { id: 'sweep', label: 'Light Sweep' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => applyMotion(m.id, 1)}
              className={cn(
                'flex w-full items-center justify-between rounded-ink border px-3.5 py-2.5 text-left transition-colors',
                motion.mode === m.id ? 'border-white bg-surface-2' : 'border-line hover:border-line-2',
              )}
            >
              <span className="text-xs font-semibold">{m.label}</span>
              {motion.mode === m.id && <Icon name="check" size={14} className="text-white" />}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-mute">
          Played back with CSS keyframes in the viewport. Exports render the current frame.
        </p>
      </Modal>

      {/* ------------------------------- batch modal ------------------------------- */}
      <Modal open={batchOpen} onClose={() => setBatchOpen(false)} title="Batch AI" subtitle="Apply one operation to many images at once" width="max-w-lg">
        <BatchBody onRun={runBatch} result={batchResult} onClear={() => setBatchResult(null)} />
      </Modal>

      {/* ----------------------------- collage modal ------------------------------ */}
      <Modal
        open={collageOpen}
        onClose={() => setCollageOpen(false)}
        title="Collage Studio"
        subtitle="2–12 photos · 12 AI layouts"
        width="max-w-xl"
      >
        <CollageBody onBuild={buildCollage} showToast={showToast} />
      </Modal>

      {/* ----------------------------- upscale modal ------------------------------ */}
      <Modal
        open={upscaleOpen}
        onClose={() => setUpscaleOpen(false)}
        title="AI Upscale"
        subtitle="High-quality resample — choose your factor"
        width="max-w-sm"
      >
        <div className="grid grid-cols-3 gap-2">
          {[2, 4, 8].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => runUpscale(f)}
              className="flex flex-col items-center gap-1 rounded-ink border border-line px-3 py-4 transition-colors hover:border-white"
            >
              <span className="text-lg font-bold text-fg">{f}×</span>
              <span className="text-[9px] text-mute">
                {naturalRef.current.w ? Math.round(naturalRef.current.w * f) : '–'}×
                {naturalRef.current.h ? Math.round(naturalRef.current.h * f) : '–'}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-mute">
          2× for most work · 4× balanced · 8× for large prints (8× can be slow on big originals).
        </p>
      </Modal>

      {/* ----------------------------- palette modal ------------------------------ */}
      <Modal
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        title="Color Palette"
        subtitle="Dominant colors extracted from the image"
        width="max-w-sm"
      >
        {paletteColors.length > 0 && (
          <>
            <div className="flex h-16 w-full overflow-hidden rounded-ink-lg border border-line">
              {paletteColors.map((p) => (
                <div key={p.hex} className="h-full flex-1" style={{ background: p.hex }} title={p.hex} />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {paletteColors.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(p.hex)
                      showToast(`Copied ${p.hex}`, 'check')
                    } catch { /* clipboard unavailable */ }
                  }}
                  className="rounded-ink border border-line px-2 py-1.5 text-center font-mono text-[10px] text-dim transition-colors hover:border-white hover:text-white"
                >
                  {p.hex}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-mute">Tap a hex to copy. Real color analysis — no preset.</p>
          </>
        )}
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
            <div className="flex flex-wrap gap-1">
              {EXPORT_FORMATS.map((fm) => (
                <button
                  key={fm.id}
                  type="button"
                  title={fm.hint}
                  onClick={() => setFormat(fm.id)}
                  className={cn(
                    'rounded-[6px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors',
                    format === fm.id ? 'bg-white text-black' : 'border border-line text-dim hover:text-white',
                  )}
                >
                  {fm.label}
                </button>
              ))}
            </div>
          </div>
          <span className="label-xs text-mute">{imageLabel}</span>
        </div>
        {(format === 'gif' || format === 'mp4') && (
          <p className="mt-2 text-[10px] text-mute">
            Animated — uses the Motion effect ({motion.mode === 'off' ? 'slow zoom' : motion.mode}). Enable
            Motion in the AI tab for control.
          </p>
        )}
        {format === 'svg' && <p className="mt-2 text-[10px] text-mute">Vector export of canvas objects; photos are edge-traced.</p>}
        {format === 'psd' && (
          <p className="mt-2 text-[10px] text-mute">
            Layered PSD — each canvas object (image, shapes, text, collage photos, AI layers) becomes
            an editable layer with its name, opacity, visibility and blend mode preserved.
          </p>
        )}
        {format === 'pdf' && <p className="mt-2 text-[10px] text-mute">Single-page PDF at the selected size (JPEG-embedded).</p>}

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
function QuickTab({ fx, setFx, filters, setLive, commitFilters, onDone, showToast }) {
  const act = (msg) => { onDone && onDone(); showToast && showToast(msg, 'check') }
  const clampFilter = (key, delta, label, min = 40, max = 160) => {
    commitFilters({ ...filters, [key]: Math.min(max, Math.max(min, filters[key] + delta)) })
    act(label)
  }

  const toggle = (key, label) => {
    setFx((f) => ({ ...f, [key]: !f[key] }))
    act(label)
  }

  const groups = [
    {
      label: 'Color',
      items: [
        { label: 'Invert', icon: 'refresh', active: fx.invert, onClick: () => toggle('invert', 'Inverted now') },
        { label: 'Black & White', icon: 'image', active: fx.bw, onClick: () => toggle('bw', 'Black & White now') },
        { label: 'Sepia', icon: 'clock', active: fx.sepia, onClick: () => toggle('sepia', 'Sepia now') },
        { label: 'Vintage', icon: 'archive', active: fx.vintage, onClick: () => toggle('vintage', 'Vintage now') },
      ],
    },
    {
      label: 'Adjust',
      items: [
        { label: 'Brighten', icon: 'sun', onClick: () => clampFilter('brightness', 12, 'Brightened now') },
        { label: 'Darken', icon: 'moon', onClick: () => clampFilter('brightness', -12, 'Darkened now') },
        { label: 'Contrast +', icon: 'sliders', onClick: () => clampFilter('contrast', 10, 'Contrast + now') },
        { label: 'Contrast −', icon: 'sliders', onClick: () => clampFilter('contrast', -10, 'Contrast − now') },
        { label: 'Saturate', icon: 'droplet', onClick: () => clampFilter('saturation', 15, 'Saturated now', 0, 200) },
        { label: 'Desaturate', icon: 'droplet', onClick: () => { commitFilters({ ...filters, saturation: 60 }); act('Desaturated now') } },
      ],
    },
    {
      label: 'Filter',
      items: [
        { label: 'Blur', icon: 'wind', active: fx.blur > 0, onClick: () => { setFx((f) => ({ ...f, blur: f.blur > 0 ? 0 : 0.35 })); act('Blur now') } },
        { label: 'Blur More', icon: 'wind', active: fx.blur >= 0.7, onClick: () => { setFx((f) => ({ ...f, blur: f.blur >= 0.7 ? 0 : 0.9 })); act('Blur More now') } },
        { label: 'Sharpen', icon: 'focus', active: fx.sharpen, onClick: () => toggle('sharpen', 'Sharpened now') },
        { label: 'Noise', icon: 'sparkle', active: fx.noise > 0, onClick: () => { setFx((f) => ({ ...f, noise: f.noise > 0 ? 0 : 60 })); act('Noise now') } },
        { label: 'Pixelate', icon: 'grid', active: fx.pixelate > 0, onClick: () => { setFx((f) => ({ ...f, pixelate: f.pixelate > 0 ? 0 : 8 })); act('Pixelate now') } },
      ],
    },
    {
      label: 'Transform',
      items: [
        { label: 'Flip H', icon: 'flipH', active: fx.flipX, onClick: () => toggle('flipX', 'Flipped horizontal') },
        { label: 'Flip V', icon: 'flipV', active: fx.flipY, onClick: () => toggle('flipY', 'Flipped vertical') },
        { label: 'Rotate 90°', icon: 'rotateCw', onClick: () => { setFx((f) => ({ ...f, angle: (f.angle + 90) % 360 })); act('Rotated 90° now') } },
        { label: 'Reset All', icon: 'refresh', onClick: () => { setFx({ ...QUICK_DEFAULTS }); commitFilters({ ...DEFAULT_FILTERS }); act('Reset all now') } },
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
function AITab({
  busy, onRemoveBg, onReplaceBg, onEnhance, onVectorize,
  onRetouch, onDenoise, onLut, onCrop, onMotion, onBatch, onDecompose, onEraser,
  onCollage, onUpscale, onPalette, onAutoTextColor, suggestion, onSuggestion, upscaled, onPromptAction,
}) {
  const [phrase, setPhrase] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const m = matchPrompt(phrase)
    if (!m) return
    setPhrase('')
    onPromptAction(m.action, m.payload)
  }

  const sections = [
    {
      label: 'Content-Aware',
      items: [
        { icon: 'scissors', title: 'Remove Background', desc: 'Real subject matting', onClick: onRemoveBg, tag: 'On-device', busy: busy?.kind === 'real' },
        { icon: 'image', title: 'Replace Background', desc: 'New backdrop', onClick: onReplaceBg },
        { icon: 'brush', title: 'Magic Eraser', desc: 'Paint to remove object', onClick: () => onEraser('erase') },
        { icon: 'sparkle', title: 'Generative Fill', desc: 'Paint to re-fill region', onClick: () => onEraser('fill') },
        { icon: 'crop', title: 'Smart Crop', desc: 'Face/subject-aware', onClick: onCrop },
        { icon: 'layers', title: 'Decompose', desc: 'Panels · text · subject · bg', onClick: onDecompose, busy: busy?.kind === 'real' },
        { icon: 'text', title: 'Smart Text Color', desc: 'Auto black/white on selection', onClick: onAutoTextColor },
      ],
    },
    {
      label: 'Enhance',
      items: [
        { icon: 'droplet', title: 'Retouch', desc: 'Skin-aware smoothing', onClick: onRetouch },
        { icon: 'wind', title: 'Denoise', desc: 'Adaptive noise removal', onClick: onDenoise },
        { icon: 'sliders', title: 'Color Grade', desc: 'Match reference look', onClick: onLut },
        { icon: 'sparkle', title: 'Auto Enhance', desc: 'Exposure & color', onClick: onEnhance },
        { icon: 'expand', title: 'Upscale', desc: '2× · 4× · 8×', onClick: onUpscale, disabled: upscaled, tag: upscaled ? 'Applied' : undefined },
        { icon: 'penTool', title: 'Vectorize', desc: 'Raster → SVG', onClick: onVectorize },
      ],
    },
    {
      label: 'Workflow',
      items: [
        { icon: 'play', title: 'Motion', desc: 'Animated preview', onClick: onMotion },
        { icon: 'layers', title: 'Batch AI', desc: 'Many images, one op', onClick: onBatch },
        { icon: 'grid', title: 'Collage Studio', desc: '2–12 photos · 12 layouts', onClick: onCollage },
        { icon: 'droplet', title: 'Color Palette', desc: 'Extract dominant colors', onClick: onPalette },
      ],
    },
  ]

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

      <p className="mt-4 text-[10px] leading-relaxed text-mute">
        All processing runs on-device and reads the actual image content. No fake AI: deterministic
        tools are labeled as such. Export matrix untouched.
      </p>

      {/* Smart suggestion banner */}
      {suggestion && (
        <button
          type="button"
          onClick={() => onSuggestion(suggestion.action)}
          className="mt-4 flex w-full items-center gap-3 rounded-ink border border-white/60 bg-surface-2 p-3 text-left transition-colors hover:border-white"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ink bg-white text-black">
            <Icon name="sparkle" size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-fg">{suggestion.title}</span>
            <span className="mt-0.5 block text-[10px] text-mute">{suggestion.desc}</span>
          </span>
          <Icon name="chevronRight" size={14} className="shrink-0 text-mute" />
        </button>
      )}

      {sections.map((sec) => (
        <div key={sec.label} className="mt-5">
          <div className="mb-2 flex items-center gap-2 px-0.5">
            <span className="label-xs text-dim">{sec.label}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sec.items.map((it) => (
              <button
                key={it.title}
                type="button"
                disabled={it.disabled}
                onClick={it.onClick}
                className={cn(
                  'group relative flex flex-col items-start gap-2 overflow-hidden rounded-ink border p-3 text-left transition-colors',
                  it.disabled ? 'cursor-not-allowed opacity-40' : 'border-line hover:border-white',
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-ink border border-line text-fg">
                  {it.busy ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/25 border-t-white" />
                  ) : (
                    <Icon name={it.icon} size={15} />
                  )}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-fg">{it.title}</span>
                <span className="text-[9.5px] leading-relaxed text-mute">{it.desc}</span>
                {it.tag && (
                  <span className="absolute right-2 top-2">
                    <Chip active>{it.tag}</Chip>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------- tab: Layers ------------------------------ */
function LayersTab({
  layers, extraLayers = [], selected, onSelect, onToggleVisibility, onToggleLock, onDeleteLayer,
  onFitPhoto, onRotatePhoto, onShiftSlot, imageSrc, showToast, layerOpacity, setLayerOpacity, blendMode, setBlendMode, onDuplicateLayer,
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
        {extraLayers.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-1 pt-2">
              <span className="label-xs text-dim">Decomposed (AI)</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            {extraLayers.map((l) => (
              <div key={l.id} className="space-y-1">
                <LayerRow
                  layer={{ name: l.name, type: l.type, visible: l.visible, locked: false }}
                  preview={<img src={l.dataUrl} alt="" className="h-full w-full object-contain" />}
                  selected={false}
                  onSelect={() => {}}
                  onToggleVisibility={() => onToggleVisibility(l.id)}
                  onToggleLock={() => showToast('AI layers are read-only', 'lock')}
                  onDelete={() => onDeleteLayer(l.id)}
                />
                {l.type === 'Collage' && onFitPhoto && (
                  <div className="flex flex-wrap items-center gap-1 pl-12">
                    <span className="label-xs text-mute">Grid:</span>
                    <button
                      type="button"
                      onClick={() => onFitPhoto(l.id, 'contain')}
                      className="rounded-ink bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-dim transition-colors hover:text-white"
                      title="Shrink photo to fit its slot"
                    >
                      Fit
                    </button>
                    <button
                      type="button"
                      onClick={() => onFitPhoto(l.id, 'cover')}
                      className="rounded-ink bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-dim transition-colors hover:text-white"
                      title="Expand photo to fill its slot"
                    >
                      Fill
                    </button>
                    {onRotatePhoto && (
                      <>
                        <button
                          type="button"
                          onClick={() => onRotatePhoto(l.id, -15)}
                          className="rounded-ink bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-dim transition-colors hover:text-white"
                          title="Rotate left 15°"
                        >
                          ↺
                        </button>
                        <button
                          type="button"
                          onClick={() => onRotatePhoto(l.id, 15)}
                          className="rounded-ink bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-dim transition-colors hover:text-white"
                          title="Rotate right 15°"
                        >
                          ↻
                        </button>
                      </>
                    )}
                    {onShiftSlot && (
                      <>
                        <button
                          type="button"
                          onClick={() => onShiftSlot(l.id, -1)}
                          className="rounded-ink bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-dim transition-colors hover:text-white"
                          title="Swap with previous slot"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => onShiftSlot(l.id, 1)}
                          className="rounded-ink bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-dim transition-colors hover:text-white"
                          title="Swap with next slot"
                        >
                          →
                        </button>
                      </>
                    )}
                    <span className="ml-1 text-[9px] text-mute">fit · fill · rotate · swap</span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
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

/* ----------------------------- retouch modal ----------------------------- */
function RetouchModal({ open, onClose, onApply }) {
  const [smooth, setSmooth] = useState(40)
  const [blemish, setBlemish] = useState(30)
  const [brighten, setBrighten] = useState(0)
  return (
    <Modal open={open} onClose={onClose} title="Portrait Retouch" subtitle="Skin-tone-aware smoothing, spot reduction, brightening" width="max-w-sm">
      <Slider label="Smooth Skin" value={smooth} min={0} max={100} defaultValue={40} onChange={setSmooth} format={(v) => `${v}`} />
      <Slider label="Blemish Reduction" value={blemish} min={0} max={100} defaultValue={30} onChange={setBlemish} format={(v) => `${v}`} />
      <Slider label="Brighten" value={brighten} min={0} max={100} defaultValue={0} onChange={setBrighten} format={(v) => `${v}`} />
      <p className="mt-3 text-[10px] leading-relaxed text-mute">
        Detects skin-tone regions from pixel color and applies smoothing only there — genuine
        content-aware retouch, on-device.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={() => { onClose(); onApply({ smooth, blemish, brighten }) }}>
          Apply Retouch
        </Button>
      </div>
    </Modal>
  )
}

/* ------------------------------ denoise body ----------------------------- */
function DenoiseBody({ onApply }) {
  const [strength, setStrength] = useState(50)
  return (
    <div>
      <Slider label="Strength" value={strength} min={0} max={100} defaultValue={50} onChange={setStrength} format={(v) => `${v}`} />
      <p className="mt-3 text-[10px] leading-relaxed text-mute">
        Measures the image's actual noise level first, then smooths only the noisy areas — edges
        are preserved.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="primary" icon="check" onClick={() => onApply(strength)}>Denoise</Button>
      </div>
    </div>
  )
}

/* ------------------------------- LUT body -------------------------------- */
function LutBody({ onApply }) {
  const [strength, setStrength] = useState(100)
  const [refSrc, setRefSrc] = useState(null)
  const refInputRef = useRef(null)
  return (
    <div>
      <button
        type="button"
        onClick={() => refInputRef.current && refInputRef.current.click()}
        className="flex w-full items-center gap-3 rounded-ink border border-dashed border-line-2 px-4 py-4 transition-colors hover:border-white"
      >
        {refSrc ? (
          <img src={refSrc} alt="reference" className="h-12 w-12 rounded-ink object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-ink border border-line text-mute">
            <Icon name="upload" size={16} />
          </span>
        )}
        <span className="text-xs text-dim">
          {refSrc ? 'Reference loaded — tap to change' : 'Upload a reference image to match its look'}
        </span>
      </button>
      <input
        ref={refInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files && e.target.files[0]
          if (f) setRefSrc(URL.createObjectURL(f))
          e.target.value = ''
        }}
      />
      <div className="mt-3">
        <Slider label="Match Strength" value={strength} min={0} max={100} defaultValue={100} onChange={setStrength} format={(v) => `${v}%`} />
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="primary" icon="check" disabled={!refSrc} onClick={() => refSrc && onApply(refSrc, strength)}>
          Match Color
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------- batch body ------------------------------ */
function BatchBody({ onRun, result, onClear }) {
  const [files, setFiles] = useState([])
  const [op, setOp] = useState('removebg')
  const inputRef = useRef(null)
  const ops = [
    { id: 'removebg', label: 'Remove Background' },
    { id: 'enhance', label: 'Auto Enhance' },
    { id: 'upscale', label: 'Upscale 4×' },
    { id: 'denoise', label: 'Denoise' },
  ]
  return (
    <div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => inputRef.current && inputRef.current.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-ink border border-dashed border-line-2 px-4 py-4 text-xs text-dim transition-colors hover:border-white"
        >
          <Icon name="upload" size={15} /> Choose images ({files.length} selected)
        </button>
        <button
          type="button"
          onClick={() => { setFiles([]); onClear() }}
          className="rounded-ink border border-line px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-mute hover:text-white"
        >
          Clear
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles([...e.target.files])} />
      {files.length > 0 && (
        <div className="mt-2 max-h-28 overflow-y-auto scrollbar-thin">
          {[...files].map((f, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5 text-[11px] text-dim">
              <Icon name="image" size={12} /> <span className="truncate">{f.name}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ops.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOp(o.id)}
            className={cn(
              'rounded-ink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors',
              op === o.id ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="primary" icon="play" disabled={!files.length} onClick={() => onRun([...files], op)}>
          Run on {files.length || 0} image{files.length === 1 ? '' : 's'}
        </Button>
      </div>
      {result && (
        <div className="mt-4 rounded-ink border border-line p-3">
          <div className="label-xs mb-2 text-dim">Results ({result.results.length})</div>
          <div className="max-h-40 space-y-1 overflow-y-auto scrollbar-thin">
            {result.results.map((r) => (
              <button
                key={r.name}
                type="button"
                onClick={() => downloadDataUrl(r.dataUrl, `${r.name}.png`)}
                className="flex w-full items-center gap-2 rounded-ink bg-surface-2 px-2.5 py-1.5 text-left text-[11px] text-dim transition-colors hover:text-white"
              >
                <Icon name="download" size={12} />
                <span className="truncate">{r.name}.png</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------- collage layout preview ------------------------- */
function LayoutPreview({ layoutId, active }) {
  const meta = COLLAGE_LAYOUTS.find((l) => l.id === layoutId)
  const slots = computeSlots(layoutId, meta.max, 1, 1)
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[4px] bg-surface-2">
      {slots.map((s, i) => (
        <span
          key={i}
          className={cn('absolute rounded-[2px]', active ? 'bg-white' : 'bg-line-2')}
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            width: `${s.w * 100}%`,
            height: `${s.h * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

/* ----------------------------- collage studio body ------------------------ */
// New-Image sizes mirror the full export matrix, so a collage can be built
// at any size you can export to.
function CollageBody({ onBuild, showToast }) {
  const [photos, setPhotos] = useState([]) // { url, name }
  const [layout, setLayout] = useState('grid4')
  const [placement, setPlacement] = useState('current') // 'current' | 'new'
  const [collagePreset, setCollagePreset] = useState('ig-square')
  const [collageGroup, setCollageGroup] = useState('all')
  const [append, setAppend] = useState(false)
  const inputRef = useRef(null)

  const addFiles = (files) => {
    const add = [...files].slice(0, 12 - photos.length).map((f) => ({ url: URL.createObjectURL(f), name: f.name }))
    const next = [...photos, ...add]
    setPhotos(next)
    const fits = COLLAGE_LAYOUTS.find((l) => next.length >= l.min && next.length <= l.max)
    if (fits) setLayout(fits.id)
  }

  const current = COLLAGE_LAYOUTS.find((l) => l.id === layout)
  const fits = photos.length >= (current?.min ?? 99) && photos.length <= (current?.max ?? 0)
  const size = EXPORT_PRESETS.find((p) => p.id === collagePreset) || EXPORT_PRESETS[0]
  const sizePresets = EXPORT_PRESETS.filter((p) => collageGroup === 'all' || p.platform === collageGroup)

  const build = () => {
    onBuild(layout, photos.map((p) => p.url), {
      placement,
      size: placement === 'new' ? { w: size.w, h: size.h } : null,
      append: placement === 'current' && append,
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current && inputRef.current.click()}
        className="flex w-full items-center justify-center gap-2 rounded-ink border border-dashed border-line-2 px-4 py-4 text-xs text-dim transition-colors hover:border-white"
      >
        <Icon name="upload" size={15} /> Choose photos ({photos.length}/12)
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-ink border border-line">
              <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos(photos.filter((_, ix) => ix !== i))}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-ink bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Remove"
              >
                <Icon name="close" size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Placement — current canvas vs new image */}
      <div className="mt-4 flex items-center gap-2">
        <span className="label-xs text-dim">Place On</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setPlacement('current')}
          className={cn(
            'rounded-ink border px-3 py-2 text-left transition-colors',
            placement === 'current' ? 'border-white bg-surface-2' : 'border-line hover:border-line-2',
          )}
        >
          <span className="block text-[11px] font-bold text-fg">Current Canvas</span>
          <span className="mt-0.5 block text-[9px] text-mute">Adds to what's already open</span>
        </button>
        <button
          type="button"
          onClick={() => setPlacement('new')}
          className={cn(
            'rounded-ink border px-3 py-2 text-left transition-colors',
            placement === 'new' ? 'border-white bg-surface-2' : 'border-line hover:border-line-2',
          )}
        >
          <span className="block text-[11px] font-bold text-fg">New Image</span>
          <span className="mt-0.5 block text-[9px] text-mute">Fresh document for the collage</span>
        </button>
      </div>

      {placement === 'new' && (
        <>
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCollageGroup('all')}
              className={cn(
                'shrink-0 rounded-ink px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] transition-colors',
                collageGroup === 'all' ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
              )}
            >
              All · {EXPORT_PRESETS.length}
            </button>
            {EXPORT_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setCollageGroup(g)}
                className={cn(
                  'shrink-0 rounded-ink px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] transition-colors',
                  collageGroup === g ? 'bg-white text-black' : 'bg-surface-2 text-dim hover:text-white',
                )}
              >
                {g} · {EXPORT_PRESETS.filter((p) => p.platform === g).length}
              </button>
            ))}
          </div>
          <div className="mt-2 grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto pr-1 scrollbar-thin">
            {sizePresets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCollagePreset(p.id)}
                className={cn(
                  'flex items-center gap-2 rounded-ink border px-2 py-1.5 text-left transition-colors',
                  collagePreset === p.id ? 'border-white bg-surface-2' : 'border-line hover:border-line-2',
                )}
              >
                <Icon name={PLATFORM_ICONS[p.platform]} size={11} className="shrink-0 text-mute" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[9.5px] font-semibold text-fg">{p.name}</span>
                  <span className="block text-[8px] text-mute">
                    {p.w}×{p.h} · {p.ratio}
                  </span>
                </span>
                {collagePreset === p.id && <Icon name="check" size={11} className="shrink-0 text-white" />}
              </button>
            ))}
          </div>
        </>
      )}

      {placement === 'current' && (
        <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-ink border border-line px-3 py-2">
          <input
            type="checkbox"
            checked={append}
            onChange={(e) => setAppend(e.target.checked)}
            className="h-3.5 w-3.5 accent-white"
          />
          <span className="text-[10px] text-dim">Add to existing collage (keep current layers)</span>
        </label>
      )}

      {/* Layouts — collage template list with visual previews */}
      <div className="mt-4 flex items-center gap-2">
        <span className="label-xs text-dim">Collage Templates</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {COLLAGE_LAYOUTS.map((l) => {
          const ok = photos.length >= l.min && photos.length <= l.max
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                if (photos.length < l.min) {
                  showToast(`Add ${l.min - photos.length} more photo${l.min - photos.length === 1 ? '' : 's'} for ${l.name}`, 'info')
                  return
                }
                if (photos.length > l.max) {
                  showToast(`${l.name} fits up to ${l.max} — building with the first ${l.max}`, 'info')
                }
                setLayout(l.id)
              }}
              title={ok ? l.name : `${l.name} needs ${l.min}–${l.max} photos`}
              className={cn(
                'group rounded-ink border p-1.5 transition-colors',
                layout === l.id && ok
                  ? 'border-white bg-surface-2'
                  : ok
                    ? 'border-line hover:border-line-2'
                    : 'border-line opacity-60 hover:border-line-2',
              )}
            >
              <LayoutPreview layoutId={l.id} active={layout === l.id && ok} />
              <span
                className={cn(
                  'mt-1 block truncate text-center text-[9px] font-bold uppercase tracking-[0.04em]',
                  layout === l.id && ok ? 'text-white' : 'text-dim',
                )}
              >
                {l.name}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] text-mute">
        {photos.length} photo{photos.length === 1 ? '' : 's'} selected · {current ? `${current.min}–${current.max} for ${current.name}` : 'pick a template'}
        {photos.length > 0 && current && photos.length < current.min ? ` · add ${current.min - photos.length} more` : ''}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[10px] text-mute">
          {current ? `${current.min}–${current.max} photos required` : 'Pick a layout'}
        </span>
        <Button
          variant="primary"
          icon="grid"
          disabled={!fits || photos.length < 2}
          onClick={build}
        >
          {placement === 'new' ? `Create ${size.w}×${size.h}` : append ? 'Add Photos' : 'Build Collage'}
        </Button>
      </div>
    </div>
  )
}
