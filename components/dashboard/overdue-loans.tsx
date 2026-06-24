'use client'

import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface OverdueLoan {
  book: string
  member: string
  daysOverdue: number
}

const overdueLoans: OverdueLoan[] = [
  {
    book: 'O Peregrino',
    member: 'João da Silva',
    daysOverdue: 3,
  },
  {
    book: 'Cristianismo Puro e Simples',
    member: 'Maria Oliveira',
    daysOverdue: 2,
  },
  {
    book: 'Até que nada mais importe',
    member: 'Pedro Santos',
    daysOverdue: 1,
  },
  {
    book: 'A Revolução dos Bichos',
    member: 'Ana Clara',
    daysOverdue: 1,
  },
]

export function OverdueLoans() {
  return (
    <Card className="border border-slate-200 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Empréstimos em Atraso
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {overdueLoans.length} devoluções pendentes
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </div>
        </div>

        <div className="space-y-3">
          {overdueLoans.map((loan, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0"
            >
              <div>
                <p className="font-medium text-slate-900">{loan.book}</p>
                <p className="text-sm text-slate-600">{loan.member}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">
                  {loan.daysOverdue} {loan.daysOverdue === 1 ? 'dia' : 'dias'}
                </p>
                <p className="text-xs text-slate-500">atraso</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
