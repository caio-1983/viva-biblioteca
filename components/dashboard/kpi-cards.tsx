'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import type { DashboardMetrics } from '@/lib/dashboard/dashboard.types'

interface KpiCardsProps {
  data?: DashboardMetrics
  loading?: boolean
}

interface KpiCardDef {
  title: string
  key: keyof DashboardMetrics
  icon: string
  iconBg: string
  iconColor: string
  valueColor: string
  subtitle?: string
}

const kpiCardDefs: KpiCardDef[] = [
  {
    title: 'Livros Disponíveis',
    key: 'livrosDisponiveis',
    icon: 'BookOpen',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    valueColor: 'text-blue-700',
  },
  {
    title: 'Livros Emprestados',
    key: 'livrosEmprestados',
    icon: 'BookMarked',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    valueColor: 'text-green-700',
    subtitle: 'em circulação',
  },
  {
    title: 'Em Atraso',
    key: 'emAtraso',
    icon: 'Clock',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    valueColor: 'text-orange-700',
  },
  {
    title: 'Membros Cadastrados',
    key: 'membrosCadastrados',
    icon: 'Users',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    valueColor: 'text-purple-700',
  },
]

export function KpiCards({ data, loading }: KpiCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {kpiCardDefs.map((kpi, index) => {
        const Icon = Icons[kpi.icon as keyof typeof Icons]
        const value = data?.[kpi.key]

        return (
          <Card
            key={index}
            className={cn(
              'bg-white border border-slate-200',
              'transition-all duration-200 hover:shadow-md'
            )}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {kpi.title}
                  </p>
                  {loading ? (
                    <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-100" />
                  ) : (
                    <p className={cn('mt-1 text-2xl font-bold', kpi.valueColor)}>
                      {value !== undefined ? value.toLocaleString('pt-BR') : '--'}
                    </p>
                  )}
                  {kpi.subtitle && (
                    <p className="mt-0.5 text-xs text-slate-400">{kpi.subtitle}</p>
                  )}
                </div>
                <div className={cn('p-2.5 rounded-lg flex-shrink-0', kpi.iconBg)}>
                  {/* @ts-expect-error lucide-react dynamic icon */}
                  <Icon className={cn('h-5 w-5', kpi.iconColor)} />
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
