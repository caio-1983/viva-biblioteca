"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  /** Slot direito: botões de ação primária da página */
  actions?: React.ReactNode
  /** Slot esquerdo: breadcrumb ou navegação */
  breadcrumb?: React.ReactNode
  /** Slot abaixo do título: filtros, tabs ou secondary actions */
  toolbar?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, breadcrumb, toolbar, ...props }, ref) => (
    <div ref={ref} className={cn("mb-6 space-y-1", className)} {...props}>
      {breadcrumb && (
        <div className="mb-2">{breadcrumb}</div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <h1 className="ds-page-title truncate">{title}</h1>
          {description && (
            <p className="mt-1 ds-body text-slate-500">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {toolbar && (
        <div className="pt-3 border-t border-border/60">
          {toolbar}
        </div>
      )}
    </div>
  )
)
PageHeader.displayName = "PageHeader"

export { PageHeader }
