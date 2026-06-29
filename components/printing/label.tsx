import type { CSSProperties, ReactNode } from 'react'
import type { LabelModel } from '@/lib/printing/types'
import { getLabelStyles } from '@/lib/printing/engine'
import { cn } from '@/lib/utils'

interface LabelProps {
  model: LabelModel
  /** Show a subtle dashed border — useful in preview and calibration mode. */
  outlined?: boolean
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * A single label cell sized to the model's physical dimensions.
 *
 * The component is intentionally thin: it applies physical sizing from the
 * engine and delegates all content to children. This keeps it reusable for
 * calibration numbers, book spine labels, barcode prints, etc.
 */
export function Label({ model, outlined, children, className, style }: LabelProps) {
  return (
    <div
      style={{ ...getLabelStyles(model), ...style }}
      className={cn(
        outlined && 'outline outline-[0.3mm] outline-dashed outline-slate-300 -outline-offset-[0.3mm]',
        className,
      )}
    >
      {children}
    </div>
  )
}
