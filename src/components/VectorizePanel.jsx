// Vectorize panel — Detail Threshold / Path Smoothing sliders, live SVG
// trace preview and real .svg export (see lib/trace.js).

import { useCallback, useEffect, useRef, useState } from 'react'
import { traceImage } from '../lib/trace'
import { downloadBlob } from '../lib/utils'
import { Icon } from './Icon'
import { Button, Chip, Slider } from './ui'

export function VectorizePanel({ src, fileName = 'inkception-vector', onBack }) {
  const [detail, setDetail] = useState(60)
  const [smoothing, setSmoothing] = useState(40)
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const runId = useRef(0)

  const run = useCallback(async () => {
    if (!src) return
    const id = ++runId.current
    setRunning(true)
    const r = await traceImage(src, { detail, smoothing })
    if (id !== runId.current) return
    setResult(r)
    setRunning(false)
  }, [src, detail, smoothing])

  useEffect(() => {
    const t = setTimeout(run, 180)
    return () => clearTimeout(t)
  }, [run])

  const exportSvg = () => {
    if (!result) return
    downloadBlob(new Blob([result.svg], { type: 'image/svg+xml' }), `${fileName}-vector.svg`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <Button variant="ghost" size="icon" icon="chevronLeft" onClick={onBack} />
        <div>
          <div className="label-sm text-fg">Vectorize</div>
          <div className="mt-0.5 text-[10px] text-mute">Raster → SVG trace</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Chip>{result ? `${result.stats.lines} paths` : '—'}</Chip>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-thin">
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-ink-lg border border-line bg-ink">
          {result ? (
            <div
              className="h-full w-full"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: result.svg }}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-mute">
              <span className="h-5 w-5 animate-spin rounded-full border border-white/20 border-t-white" />
              <span className="label-xs">Tracing</span>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <Slider
            label="Detail Threshold"
            value={detail}
            min={0}
            max={100}
            defaultValue={60}
            onChange={setDetail}
            format={(v) => `${v}`}
          />
          <Slider
            label="Path Smoothing"
            value={smoothing}
            min={0}
            max={100}
            defaultValue={40}
            onChange={setSmoothing}
            format={(v) => `${v}`}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {result && (
            <>
              <Chip>{result.stats.points} pts</Chip>
              <Chip>{result.stats.ms} ms</Chip>
            </>
          )}
          <Chip>SVG · monochrome</Chip>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-mute">
          Pipeline: Canny-style edge detection → Moore contour tracing → run-length simplification.
          The exported file is a standalone SVG.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <span className="label-xs text-mute">{running ? 'Tracing…' : 'Ready'}</span>
        <Button variant="secondary" icon="download" onClick={exportSvg} disabled={!result || running}>
          Export SVG
        </Button>
      </div>
    </div>
  )
}
