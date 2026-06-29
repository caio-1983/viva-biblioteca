import type { LabelModel, LabelSlot } from '@/lib/printing/types'
import { getSheetStyles, totalSlots } from '@/lib/printing/engine'
import { cn } from '@/lib/utils'
import { Label } from './label'

interface LabelSheetProps {
  model: LabelModel
  /**
   * Label slots to render.  Each slot carries a 0-based `index` and `content`.
   * Slots are placed at their index; positions without a matching slot render empty.
   */
  slots?: LabelSlot[]
  /**
   * 0-based sheet position where filling should start.
   * Positions 0…(startAt-1) are left blank, then slots fill sequentially.
   */
  startAt?: number
  /** Show dashed borders around every cell (preview / calibration). */
  outlined?: boolean
  className?: string
}

/**
 * Renders a full label sheet using CSS Grid.
 *
 * All measurements come from the model via the engine — nothing is hardcoded
 * in this component.  The same markup is used for the scaled screen preview
 * and the physical print output; only the surrounding wrapper differs.
 */
export function LabelSheet({
  model,
  slots = [],
  startAt = 0,
  outlined,
  className,
}: LabelSheetProps) {
  const total = totalSlots(model)

  // Map each slot to its absolute position on the sheet.
  const slotMap = new Map<number, LabelSlot>()
  slots.forEach((slot, i) => {
    const position = startAt + i
    if (position < total) slotMap.set(position, slot)
  })

  return (
    <div style={getSheetStyles(model)} className={cn('viva-label-sheet', className)}>
      {Array.from({ length: total }, (_, i) => {
        const slot = slotMap.get(i)
        return (
          <Label key={i} model={model} outlined={outlined}>
            {slot?.content ?? null}
          </Label>
        )
      })}
    </div>
  )
}
