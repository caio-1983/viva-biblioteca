'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertCircle, Clock, Calendar } from 'lucide-react'
import type { DashboardTodayPending } from '@/lib/dashboard/dashboard.types'

interface TodayPendingProps {
  data?: DashboardTodayPending
  loading?: boolean
}

export function TodayPending({ data, loading }: TodayPendingProps) {
  const pendencias = [
    {
      label: 'Devoluções em atraso',
      value: data?.emAtraso,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      hoverBg: 'hover:bg-red-100',
      badge: 'bg-red-100 text-red-700',
      placeholder: false,
    },
    {
      label: 'Reservas aguardando retirada',
      value: data?.reservasAguardando,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      hoverBg: 'hover:bg-amber-100',
      badge: 'bg-amber-100 text-amber-700',
      placeholder: data?.reservasAguardando === null || data?.reservasAguardando === undefined,
    },
    {
      label: 'Empréstimos previstos hoje',
      value: data?.emprestimosHoje,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-50',
      hoverBg: 'hover:bg-green-100',
      badge: 'bg-green-100 text-green-700',
      placeholder: false,
    },
  ]

  return (
    <Card className="bg-white border border-slate-200 h-full transition-all duration-200 hover:shadow-md">
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Pendências de Hoje</h3>
          <p className="text-xs text-slate-500 mt-0.5">Ações que requerem atenção</p>
        </div>

        <div className="space-y-2">
          {pendencias.map((item, index) => {
            const Icon = item.icon

            let displayValue: string
            if (loading) {
              displayValue = '...'
            } else if (item.placeholder) {
              displayValue = '—'
            } else if (item.value === undefined) {
              displayValue = '--'
            } else {
              displayValue = String(item.value)
            }

            return (
              <div
                key={index}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5',
                  'cursor-pointer transition-all duration-200',
                  item.bg,
                  item.hoverBg
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('h-4 w-4 flex-shrink-0', item.color)} />
                  <span className="text-xs text-slate-700 leading-tight">{item.label}</span>
                </div>
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2',
                    item.badge
                  )}
                >
                  {displayValue}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
