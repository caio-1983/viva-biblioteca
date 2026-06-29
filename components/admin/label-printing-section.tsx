'use client'

import { useState } from 'react'
import { Printer, Tag } from 'lucide-react'
import { Button }            from '@/components/ui/button'
import { LabelSheet }        from '@/components/printing/label-sheet'
import { PrintPreview }      from '@/components/printing/print-preview'
import { PositionSelector }  from '@/components/printing/position-selector'
import { AVAILABLE_MODELS }  from '@/lib/printing/models/index'
import { totalSlots }        from '@/lib/printing/engine'
import type { LabelSlot, LabelModel } from '@/lib/printing/types'

// ─── Calibration content ──────────────────────────────────────────────────────

/**
 * Renders the sequential number inside a calibration label.
 * Font size is derived from the model's label height so it scales
 * correctly with any model — no physical value is hardcoded.
 */
function CalibrationNumber({ n, model }: { n: number; model: LabelModel }) {
  // ~33 % of label height gives a readable number without overflowing.
  const fontSize = `${(model.label.height * 0.335).toFixed(2)}mm`

  return (
    <span
      style={{
        fontSize,
        fontWeight: 700,
        fontFamily: 'monospace',
        color:      '#64748b',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {n}
    </span>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

/**
 * Admin section for label printing.
 *
 * Responsibilities:
 *   • Display the active model's physical specs (sourced from the registry).
 *   • Let the user choose a start position (for partially-used sheets).
 *   • Show a live scaled preview of the calibration sheet.
 *   • Trigger window.print() — the hidden print target renders the sheet at
 *     its true mm dimensions, isolated by the @media print CSS in globals.css.
 *
 * Model selection uses AVAILABLE_MODELS from the central registry.
 * Components never import individual model files directly.
 */
export function LabelPrintingSection() {
  const [startAt, setStartAt] = useState(0)

  // Only TR6580 is available today.  The first entry in the registry is used
  // as the default; adding new models to the registry requires no changes here.
  const model = AVAILABLE_MODELS[0]
  const total = totalSlots(model)

  // Build calibration slots: fill from startAt to end of sheet, numbered.
  const slots: LabelSlot[] = Array.from({ length: total - startAt }, (_, i) => ({
    index:   startAt + i,
    content: <CalibrationNumber n={startAt + i + 1} model={model} />,
  }))

  return (
    <div className="space-y-5">

      {/* ── Model display ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-border/60 rounded-lg">
        <Tag className="size-4 text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700">{model.name}</p>
          <p className="text-xs text-slate-400 truncate">{model.description}</p>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-xs font-medium text-slate-500">{model.paper.name}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            {model.grid.columns}&thinsp;×&thinsp;{model.grid.rows}&thinsp;=&thinsp;{total} etiq.
          </p>
        </div>
      </div>

      {/* ── Controls + preview ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* Left column: position selector + print button */}
        <div className="space-y-5 lg:w-44 shrink-0">

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
              Posição inicial
            </p>
            <PositionSelector model={model} value={startAt} onChange={setStartAt} />
          </div>

          <div className="pt-3 border-t border-border/40 space-y-2">
            <Button
              onClick={() => window.print()}
              className="w-full gap-2"
              size="sm"
            >
              <Printer className="size-3.5" />
              Imprimir calibração
            </Button>
            <p className="text-[10px] text-slate-400 leading-snug">
              Imprime os números {startAt + 1}–{total} para verificar o alinhamento
              com a folha física de etiquetas.
            </p>
          </div>

          {/* Spec summary — values read from model, never hardcoded */}
          <div className="pt-3 border-t border-border/40 space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Especificações
            </p>
            {[
              ['Papel',      `${model.paper.name} (${model.paper.width}×${model.paper.height} mm)`],
              ['Etiqueta',   `${model.label.width}×${model.label.height} mm`],
              ['Grade',      `${model.grid.columns} col × ${model.grid.rows} lin`],
              ['Margem H',   `${model.margins.left} mm`],
              ['Margem V',   `${model.margins.top} mm`],
              ['Espaç. col', `${model.gap.x} mm`],
              ['Versão',     `v${model.version}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-[10px] text-slate-400">{label}</span>
                <span className="text-[10px] text-slate-600 font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: live preview */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide text-center mb-2">
            Pré-visualização — {model.paper.name} · Calibração
          </p>
          <div className="border border-border/60 rounded-lg overflow-hidden bg-slate-100 p-2">
            <PrintPreview model={model}>
              <LabelSheet model={model} slots={slots} startAt={startAt} outlined />
            </PrintPreview>
          </div>
        </div>
      </div>

      {/*
        ── Print target ──────────────────────────────────────────────────────
        Hidden on screen.  The @media print block in globals.css makes this
        the only visible element when window.print() is called, positioned
        at the top-left corner of the page at its true mm dimensions.
      */}
      <div
        className="hidden"
        aria-hidden="true"
        data-print-target="label-calibration"
      >
        <LabelSheet model={model} slots={slots} startAt={startAt} />
      </div>
    </div>
  )
}
