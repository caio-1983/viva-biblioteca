import type { CSSProperties } from 'react'
import type { LabelData, LabelModel } from '@/lib/printing/types'

/**
 * Content for a single spine label (etiqueta de lombada).
 *
 * Layout (4 lines in the TR6580's 66.7 × 25.4 mm cell):
 *   Line 1 — CDD
 *   Line 2 — Cutter
 *   Line 3 — Ano
 *   Line 4 — Edição
 *
 * All four lines are left-aligned, sharing the same font size and weight
 * (no bold). A fixed left indent of ~⅓ of the label width keeps the typical
 * short spine content (≈5–7 chars) looking roughly centered without risking
 * overflow on longer CDD values. Sizes derive from the model so the component
 * scales with any registered model.
 */
export function LombadaLabel({ data, model }: { data: LabelData; model: LabelModel }) {
  const h = model.label.height
  const w = model.label.width
  const size = `${(h * 0.155).toFixed(2)}mm`
  const paddingV = `${(h * 0.06).toFixed(2)}mm`
  const indent = `${(w * 0.42).toFixed(2)}mm`

  const base: CSSProperties = {
    fontFamily: 'Arial, sans-serif',
    fontSize:   size,
    fontWeight: 400,
    lineHeight: 1.25,
    color:      '#1e293b',
    textAlign:  'left',
  }

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        width:          '100%',
        height:         '100%',
        padding:        `${paddingV} 0 ${paddingV} ${indent}`,
        boxSizing:      'border-box',
      }}
    >
      <span style={base}>{data.cdd}</span>
      <span style={base}>{data.cutter}</span>
      <span style={base}>{data.ano}</span>
      <span style={base}>{data.edicao}</span>
    </div>
  )
}
