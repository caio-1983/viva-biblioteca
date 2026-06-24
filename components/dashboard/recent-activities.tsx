'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

interface Activity {
  title: string
  description: string
  timestamp: string
  type: 'return' | 'loan' | 'member' | 'book'
  icon: string
}

const activities: Activity[] = [
  {
    title: 'Devolução registrada',
    description: 'O Peregrino devolvido por João da Silva',
    timestamp: 'Hoje, 09:15',
    type: 'return',
    icon: 'RotateCcw',
  },
  {
    title: 'Novo empréstimo',
    description: 'Cristianismo Puro e Simples para Maria Oliveira',
    timestamp: 'Hoje, 08:45',
    type: 'loan',
    icon: 'BookMarked',
  },
  {
    title: 'Novo membro cadastrado',
    description: 'Lucas Ferreira adicionado ao sistema',
    timestamp: 'Ontem, 16:30',
    type: 'member',
    icon: 'UserPlus',
  },
  {
    title: 'Livro cadastrado',
    description: 'A Revolução dos Bichos adicionado ao acervo',
    timestamp: 'Ontem, 14:20',
    type: 'book',
    icon: 'BookOpen',
  },
]

const typeStyles = {
  return: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  loan: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  member: {
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  book: {
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
}

export function RecentActivities() {
  return (
    <Card className="border border-slate-200 p-6">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-900">Atividades Recentes</h3>
          <p className="mt-1 text-sm text-slate-600">
            Últimas ações do sistema
          </p>
        </div>

        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = Icons[activity.icon as keyof typeof Icons]
            const style = typeStyles[activity.type]

            return (
              <div
                key={index}
                className={cn(
                  'flex gap-4 border-l-2 pl-4 pb-4 last:pb-0 last:border-l-0',
                  style.borderColor
                )}
              >
                <div className={cn('mt-1 flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0', style.bgColor)}>
                  {/* @ts-expect-error lucide-react dynamic icon */}
                  <Icon className={cn('h-5 w-5', style.textColor)} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{activity.title}</p>
                  <p className="text-sm text-slate-600">{activity.description}</p>
                  <p className="mt-1 text-xs text-slate-500">{activity.timestamp}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
