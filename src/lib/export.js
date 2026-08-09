import { loadImageElement } from './utils'
import { cssFilterString } from './filters'

/** Render the current image + filter stack into an offscreen canvas at a target size (cover-crop). */
export async function renderExport(src, { w, h, filterString }) {
  const img = await loadImageElement(src)
  const cv = document.createElement('canvas')
  cv.width = Math.round(w)
  cv.height = Math.round(h)
  const ctx = cv.getContext('2d')
  if (filterString) {
    try {
      ctx.filter = filterString
    } catch {
      /* filter unsupported — render unfiltered */
    }
  }
  const s = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  ctx.drawImage(img, (cv.width - dw) / 2, (cv.height - dh) / 2, dw, dh)
  try {
    ctx.filter = 'none'
  } catch {
    /* noop */
  }
  return cv.toDataURL('image/png')
}

/** Platform presets — matches the blueprint export spec. */
export const EXPORT_PRESETS = [
  { id: 'ig-feed', name: 'Instagram Feed', w: 1080, h: 1080, icon: 'grid', tag: 'Square' },
  { id: 'ig-reel', name: 'Instagram Reel / Story', w: 1080, h: 1920, icon: 'expand', tag: '9:16' },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', w: 1280, h: 720, icon: 'image', tag: '16:9' },
  { id: 'tiktok', name: 'TikTok Video', w: 1080, h: 1920, icon: 'play', tag: '9:16' },
]
