"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      status: {
        disponivel:   "bg-status-available-bg text-status-available ring-status-available/30",
        emprestado:   "bg-status-borrowed-bg text-status-borrowed ring-status-borrowed/30",
        atrasado:     "bg-status-overdue-bg text-status-overdue ring-status-overdue/30",
        reservado:    "bg-status-reserved-bg text-status-reserved ring-status-reserved/30",
        inativo:      "bg-status-inactive-bg text-status-inactive ring-status-inactive/30",
        manutencao:   "bg-status-maintenance-bg text-status-maintenance ring-status-maintenance/30",
      },
    },
    defaultVariants: {
      status: "disponivel",
    },
  }
)

const STATUS_DOT: Record<string, string> = {
  disponivel: "bg-status-available",
  emprestado: "bg-status-borrowed",
  atrasado:   "bg-status-overdue",
  reservado:  "bg-status-reserved",
  inativo:    "bg-status-inactive",
  manutencao: "bg-status-maintenance",
}

const STATUS_LABEL: Record<string, string> = {
  disponivel: "Disponível",
  emprestado: "Emprestado",
  atrasado:   "Atrasado",
  reservado:  "Reservado",
  inativo:    "Inativo",
  manutencao: "Manutenção",
}

export type StatusValue = keyof typeof STATUS_LABEL

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Exibe o indicador colorido antes do label */
  dot?: boolean
  /** Sobrescreve o label padrão do status */
  label?: string
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status = "disponivel", dot = true, label, ...props }, ref) => {
    const key = status as string
    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ status }), className)}
        {...props}
      >
        {dot && (
          <span
            aria-hidden
            className={cn("size-1.5 rounded-full", STATUS_DOT[key])}
          />
        )}
        {label ?? STATUS_LABEL[key] ?? key}
      </span>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants, STATUS_LABEL }
