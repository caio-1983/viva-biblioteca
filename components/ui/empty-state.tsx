"use client"

import * as React from "react"
import { InboxIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  /** Tamanho da área vazia */
  size?: "sm" | "md" | "lg"
}

const SIZE_CLASS = {
  sm: "py-8",
  md: "py-14",
  lg: "py-20",
}

const ICON_SIZE = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        SIZE_CLASS[size],
        className
      )}
      {...props}
    >
      <div className={cn(
        "mb-4 flex items-center justify-center rounded-full bg-slate-100 p-4 text-slate-400",
        size === "lg" && "p-5"
      )}>
        {icon ?? <InboxIcon className={ICON_SIZE[size]} />}
      </div>

      <p className="ds-card-title text-slate-700">{title}</p>

      {description && (
        <p className="mt-1 ds-body text-slate-400 max-w-xs">{description}</p>
      )}

      {action && (
        <div className="mt-5">{action}</div>
      )}
    </div>
  )
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
