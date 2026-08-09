// Shared tiny helpers.

import { useEffect, useState } from 'react'

export const cn = (...args) => args.filter(Boolean).join(' ')

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error('image failed to load'))
    img.src = src
  })
}

/**
 * Convert a File into a persistable data URL (downscaled JPEG when large).
 * blob: URLs die after a page reload, so anything stored in localStorage
 * must be a data URL. Keeps images small enough to fit storage limits.
 */
export function fileToDataUrl(file, maxSide = 1600, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onerror = () => reject(new Error('read failed'))
    fr.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () => {
        const s = Math.min(1, maxSide / Math.max(img.width, img.height))
        // keep the original PNG if it's already small enough
        if (s >= 1 && file.type === 'image/png' && fr.result.length < 900000) {
          resolve(fr.result)
          return
        }
        const cv = document.createElement('canvas')
        cv.width = Math.max(1, Math.round(img.width * s))
        cv.height = Math.max(1, Math.round(img.height * s))
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
        resolve(cv.toDataURL('image/jpeg', quality))
      }
      img.src = fr.result
    }
    fr.readAsDataURL(file)
  })
}

export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}
