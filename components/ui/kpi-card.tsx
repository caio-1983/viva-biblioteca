"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const kpiCardVariants = cva(
  "relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
  {
    variants: {
      accent: {
        brand:    "border-brand-200",
        success:  "border-status-available/30",
        warning:  "border-status-overdue/30",
        neutral:  "border-border",
      },
    },
    defaultVariants: {
      accent: "neutral",
    },
  }
)

export type KpiTrend = "up" | "down" | "neutral"

export interface KpiCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof kpiCardVariants> {
  label: string
  value: string | number
  /** Sub-texto abaixo do valor, ex: "em relação ao mês anterior" */
  description?: string
  /** Variação percentual, ex: 12.5 */
  change?: number
  trend?: KpiTrend
  /** Ícone Lucide a ser renderizado no canto superior direito */
  icon?: React.ReactNode
  loading?: boolean
}

const TREND_ICON: Record<KpiTrend, React.ReactNode> = {
  up:      <TrendingUp  className="size-3.5" />,
  down:    <TrendingDown className="size-3.5" />,
  neutral: <Minus className="size-3.5" />,
}

const TREND_CLASS: Record<KpiTrend, string> = {
  up:      "text-status-available bg-status-available-bg",
  down:    "text-status-overdue bg-status-overdue-bg",
  neutral: "text-slate-500 bg-slate-100",
}

const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({ className, accent, label, value, description, change, trend = "neutral", icon, loading = false, ...props }, ref) => {
    const hasTrend = change !== undefined

    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(kpiCardVariants({ accent }), "animate-pulse", className)}
          {...props}
        >
          <div className="h-3 w-24 rounded bg-slate-200 mb-3" />
          <div className="h-8 w-16 rounded bg-slate-200 mb-2" />
          <div className="h-3 w-32 rounded bg-slate-200" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(kpiCardVariants({ accent }), className)}
        {...props}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="ds-caption uppercase tracking-wide font-semibold text-slate-500">
            {label}
          </p>
          {icon && (
            <span className="shrink-0 text-slate-300">{icon}</span>
          )}
        </div>

        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {hasTrend && (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", TREND_CLASS[trend])}>
              {TREND_ICON[trend]}
              {change > 0 ? "+" : ""}{change}%
            </span>
          )}
          {description && (
            <span className="ds-caption text-slate-400">{description}</span>
          )}
        </div>
      </div>
    )
  }
)
KpiCard.displayName = "KpiCard"

export { KpiCard, kpiCardVariants }
