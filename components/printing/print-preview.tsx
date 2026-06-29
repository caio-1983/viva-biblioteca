'use client'

import { useRef, useState, useEffect, type ReactNode } from 'react'
import type { LabelModel } from '@/lib/printing/types'
import { getSheetPx } from '@/lib/printing/engine'

interface PrintPreviewProps {
  model: LabelModel
  /** Label sheet to display — typically a <LabelSheet> with outlined={true}. */
  children: ReactNode
  /**
   * Upper bound for the scale factor (0–1).
   * Prevents the preview from growing too large on wide screens.
   * Default: 0.75.
   */
  maxScale?: number
}

/**
 * Scales the label sheet to fit the container without altering the DOM nodes
 * that the sheet uses for print.
 *
 * Strategy:
 *   1. The inner sheet uses physical `mm` units from the engine — identical for
 *      screen and print.
 *   2. A ResizeObserver computes a scale factor each time the container resizes.
 *   3. `transform: scale()` is applied to the sheet; the outer wrapper is sized
 *      to the *scaled* dimensions so the rest of the layout is not disturbed.
 *   4. On `@media print` the transform is neutralised in globals.css so the
 *      sheet lands on paper at its true physical size.
 */
export function PrintPreview({ model, children, maxScale = 0.75 }: PrintPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.38)

  const { width: sheetW, height: sheetH } = getSheetPx(model)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const recalc = () => {
      const available = el.clientWidth
      setScale(Math.min(maxScale, available / sheetW))
    }

    recalc()
    const obs = new ResizeObserver(recalc)
    obs.observe(el)
    return () => obs.disconnect()
  }, [sheetW, maxScale])

  const scaledW = Math.round(sheetW * scale)
  const scaledH = Math.round(sheetH * scale)

  return (
    <div ref={wrapperRef} className="w-full flex justify-center">
      {/*
        Outer: sized to the *scaled* sheet so it doesn't overlap neighbours.
        Inner: positioned absolute, transformed to scale — no layout impact.
      */}
      <div style={{ width: scaledW, height: scaledH, position: 'relative', overflow: 'hidden' }}>
        <div
          className="viva-print-preview-scaler"
          style={{
            width: sheetW,
            height: sheetH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
