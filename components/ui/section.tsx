"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  description?: string
  /** Slot direito do cabeçalho: links, botões secundários */
  action?: React.ReactNode
  /** Remove o padding interno padrão */
  flush?: boolean
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, title, description, action, flush = false, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn("space-y-4", className)}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            {title && (
              <h2 className="ds-section-title">{title}</h2>
            )}
            {description && (
              <p className="ds-caption text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          {action && (
            <div className="shrink-0">{action}</div>
          )}
        </div>
      )}

      <div className={cn(!flush && "")}>
        {children}
      </div>
    </section>
  )
)
Section.displayName = "Section"

export { Section }
