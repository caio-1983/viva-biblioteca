'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

interface KpiCard {
  title: string
  value: number
  icon: string
  color: string
  bgColor: string
  textColor: string
  unit?: string
}

const kpiCards: KpiCard[] = [
  {
    title: 'Livros Disponíveis',
    value: 413,
    icon: 'BookOpen',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    unit: 'de 540 no total',
  },
  {
    title: 'Livros Emprestados',
    value: 27,
    icon: 'BookMarked',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    unit: 'em circulação',
  },
  {
    title: 'Em Atraso',
    value: 4,
    icon: 'Clock',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    unit: 'devoluções pendentes',
  },
  {
    title: 'Membros Cadastrados',
    value: 128,
    icon: 'Users',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    unit: 'membros ativos',
  },
]

export function KpiCards() {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((kpi, index) => {
        const Icon = Icons[kpi.icon as keyof typeof Icons]

        return (
          <Card
            key={index}
            className={cn('overflow-hidden border border-slate-200 hover:shadow-md transition-shadow', kpi.bgColor)}
          >
            <div className="p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="label-small">
                    {kpi.title}
                  </p>
                  <p className={cn('mt-3 text-4xl font-bold', kpi.textColor)}>
                    {kpi.value.toLocaleString('pt-BR')}
                  </p>
                  {kpi.unit && (
                    <p className="mt-2 text-xs text-slate-500">{kpi.unit}</p>
                  )}
                </div>
                <div
                  className={cn(
                    'p-3 rounded-lg bg-linear-to-br',
                    kpi.color
                  )}
                >
                  {/* @ts-expect-error lucide-react dynamic icon */}
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
