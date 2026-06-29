'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'
import type { DashboardOverdueLoan } from '@/lib/dashboard/dashboard.types'

interface OverdueLoansProps {
  data?: DashboardOverdueLoan[]
  loading?: boolean
}

function daysBadgeClass(days: number) {
  if (days >= 3) return 'bg-red-100 text-red-700 ring-1 ring-red-300'
  if (days === 2) return 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
  return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300'
}

export function OverdueLoans({ data, loading }: OverdueLoansProps) {
  return (
    <Card className="border border-slate-200 p-5 bg-white h-full transition-all duration-200 hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Empréstimos em Atraso</h3>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))
          ) : !data || data.length === 0 ? (
            <p className="py-2 text-center text-xs text-slate-400">
              Nenhum empréstimo em atraso.
            </p>
          ) : (
            data.map((loan, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{loan.titulo}</p>
                  <p className="text-xs text-slate-500">{loan.nomeCompleto}</p>
                </div>
                <span
                  className={cn(
                    'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold',
                    daysBadgeClass(loan.diasAtraso)
                  )}
                >
                  {loan.diasAtraso} {loan.diasAtraso === 1 ? 'dia' : 'dias'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}
