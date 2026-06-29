'use client'

import type { LabelModel } from '@/lib/printing/types'
import { totalSlots } from '@/lib/printing/engine'
import { cn } from '@/lib/utils'

interface PositionSelectorProps {
  model: LabelModel
  /** 0-based index of the first slot to fill with content. */
  value: number
  onChange: (index: number) => void
}

/**
 * A miniature replica of the label grid that lets the user click a cell
 * to choose the start position.
 *
 * Cells before `value` are visually dimmed (they will be printed blank).
 * The selected cell is highlighted; cells after it show as available.
 *
 * Layout mirrors the model's grid columns — no measurements are hardcoded.
 */
export function PositionSelector({ model, value, onChange }: PositionSelectorProps) {
  const total = totalSlots(model)
  const { columns } = model.grid

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 leading-snug">
        Etiquetas antes da posição selecionada ficam em branco.
      </p>

      <div
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        className="grid gap-[2px] w-[114px]"
      >
        {Array.from({ length: total }, (_, i) => {
          const isSkipped   = i < value
          const isSelected  = i === value
          const isAvailable = i > value

          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              title={`Posição ${i + 1}`}
              className={cn(
                'h-[17px] rounded-[2px] text-[7.5px] font-mono font-medium',
                'leading-none border transition-colors focus-visible:outline-none',
                'focus-visible:ring-1 focus-visible:ring-brand-400',
                isSkipped  && 'bg-slate-50  border-slate-200 text-slate-300 cursor-default',
                isSelected && 'bg-brand-500 border-brand-600 text-white shadow-sm',
                isAvailable && 'bg-brand-50  border-brand-200 text-brand-500 hover:bg-brand-100 cursor-pointer',
              )}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="text-[10px] text-slate-400 hover:text-brand-600 underline underline-offset-2 transition-colors"
        >
          Voltar para posição 1
        </button>
      )}
    </div>
  )
}
