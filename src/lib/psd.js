// src/lib/psd.js
// Layered PSD export via ag-psd (PSD spec) — per the
// PSD_EXPORT_FIX plan. Walks Fabric.js objects and writes each as a real
// PSD layer with name / opacity / visibility / blend mode, plus the
// flattened composite for preview.

import { writePsdBuffer } from 'ag-psd'
import 'ag-psd/initialize-canvas'

// Fabric blend mode → PSD blend mode (matches requirements.md §5 list).
const BLEND_MAP = {
  'source-over': 'normal',
  normal: 'normal',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'color dodge',
  'color-burn': 'color burn',
  'hard-light': 'hard light',
  'soft-light': 'soft light',
  difference: 'difference',
  exclusion: 'exclusion',
}

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)))

/**
 * @param {{
 *   width:number, height:number,
 *   layers:Array<{
 *     name?:string, left:number, top:number, right:number, bottom:number,
 *     opacity?:number, /* 0..1 *-/
 *     hidden?:boolean, blend?:string, canvas:HTMLCanvasElement
 *   }>,
 *   compositeCanvas?:HTMLCanvasElement
 * }} input
 */
export function buildLayeredPsdBlob({ width, height, layers, compositeCanvas }) {
  const children = layers.map((l) => ({
    name: String(l.name || 'Layer').slice(0, 31),
    left: Math.round(l.left),
    top: Math.round(l.top),
    right: Math.round(l.right),
    bottom: Math.round(l.bottom),
    opacity: clamp255(l.opacity ?? 1),
    hidden: !!l.hidden,
    blendMode: BLEND_MAP[l.blend] || 'normal',
    canvas: l.canvas,
  }))
  const psd = {
    width: Math.round(width),
    height: Math.round(height),
    children,
    ...(compositeCanvas ? { canvas: compositeCanvas } : {}),
  }
  const buffer = writePsdBuffer(psd)
  return new Blob([buffer], { type: 'image/vnd.adobe.photoshop' })
}
