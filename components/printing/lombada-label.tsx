import type { LabelData, LabelModel } from '@/lib/printing/types'

/**
 * Content for a single spine label (etiqueta de lombada).
 *
 * Layout (3 lines in the TR6580's 66.7 × 25.4 mm cell):
 *   Line 1 — CDD   (bold, largest)
 *   Line 2 — Cutter (medium)
 *   Line 3 — Ano · Edição (small, muted)
 *
 * All sizes are derived from model.label.height so the component
 * scales correctly with any registered model — no mm values hardcoded.
 */
export function LombadaLabel({ data, model }: { data: LabelData; model: LabelModel }) {
  const h = model.label.height
  const sizeLg = `${(h * 0.20).toFixed(2)}mm`
  const sizeMd = `${(h * 0.17).toFixed(2)}mm`
  const sizeSm = `${(h * 0.14).toFixed(2)}mm`

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        width:          '100%',
        height:         '100%',
        padding:        `${(h * 0.06).toFixed(2)}mm ${(model.label.width * 0.04).toFixed(2)}mm`,
        boxSizing:      'border-box',
        textAlign:      'center',
        lineHeight:     1.15,
        gap:            `${(h * 0.04).toFixed(2)}mm`,
        fontFamily:     'monospace',
      }}
    >
      <span style={{ fontSize: sizeLg, fontWeight: 700, color: '#1e293b' }}>
        {data.cdd}
      </span>

      <span style={{ fontSize: sizeMd, fontWeight: 500, color: '#334155' }}>
        {data.cutter}
      </span>

      <span style={{ fontSize: sizeSm, color: '#64748b' }}>
        {data.ano}&nbsp;·&nbsp;{data.edicao}
      </span>
    </div>
  )
}
