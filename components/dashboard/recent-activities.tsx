'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { RotateCcw, BookMarked, UserPlus, BookOpen } from 'lucide-react'
import type { DashboardActivity, DashboardActivityType } from '@/lib/dashboard/dashboard.types'

interface RecentActivitiesProps {
  data?: DashboardActivity[]
  loading?: boolean
}

const typeStyles: Record<DashboardActivityType, { bg: string; color: string; Icon: React.ElementType }> = {
  return: { bg: 'bg-green-100',  color: 'text-green-700',  Icon: RotateCcw  },
  loan:   { bg: 'bg-blue-100',   color: 'text-blue-700',   Icon: BookMarked },
  member: { bg: 'bg-purple-100', color: 'text-purple-700', Icon: UserPlus   },
  book:   { bg: 'bg-orange-100', color: 'text-orange-700', Icon: BookOpen   },
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const itemStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  if (itemStart.getTime() === todayStart.getTime()) return `Hoje, ${timeStr}`
  if (itemStart.getTime() === yesterdayStart.getTime()) return `Ontem, ${timeStr}`
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${timeStr}`
}

export function RecentActivities({ data, loading }: RecentActivitiesProps) {
  return (
    <Card className="border border-slate-200 p-5 bg-white h-full transition-all duration-200 hover:shadow-md">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Atividades Recentes</h3>
          <p className="text-xs text-slate-500 mt-0.5">Últimas ações do sistema</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1 pt-0.5">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-400">Nenhuma atividade recente.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-3.5 top-4 bottom-0 w-px bg-slate-200" />
            <div className="space-y-3">
              {data.map((activity, index) => {
                const { bg, color, Icon } = typeStyles[activity.type]

                return (
                  <div key={index} className="relative flex gap-3">
                    <div
                      className={cn(
                        'z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                        bg
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', color)} />
                    </div>

                    <div className="flex-1 min-w-0 pb-1 pt-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900 leading-snug">
                          {activity.title}
                        </p>
                        <span className="flex-shrink-0 whitespace-nowrap text-xs text-slate-400">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
