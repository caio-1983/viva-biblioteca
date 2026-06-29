'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

interface QuickAction {
  title: string
  description: string
  icon: string
  href: string
  color: string
  bgColor: string
}

const quickActions: QuickAction[] = [
  {
    title: 'Circulação',
    description: 'Empréstimos e devoluções',
    icon: 'ArrowLeftRight',
    href: '/circulacao',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Catálogo',
    description: 'Consultar obras e exemplares',
    icon: 'BookOpen',
    href: '/acervo/consulta',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Nova Obra',
    description: 'Catalogar um novo título',
    icon: 'BookPlus',
    href: '/acervo/cadastro',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    title: 'Leitores',
    description: 'Perfil e histórico dos leitores',
    icon: 'Users',
    href: '/members',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    title: 'Relatórios',
    description: 'Visualizar estatísticas',
    icon: 'BarChart3',
    href: '/reports',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  {
    title: 'Administração',
    description: 'Configurações e importações',
    icon: 'Cog',
    href: '/settings',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
]

export function QuickActions() {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
      {quickActions.map((action) => {
        const Icon = Icons[action.icon as keyof typeof Icons]

        return (
          <Link key={action.href} href={action.href} className="group">
            <Card className={cn(
              'cursor-pointer border border-slate-200 bg-white h-full',
              'transition-all duration-200',
              'hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300'
            )}>
              <div className="p-4 flex flex-col gap-3">
                <div className={cn('inline-flex items-center justify-center p-2.5 rounded-xl w-fit', action.bgColor)}>
                  {/* @ts-expect-error lucide-react dynamic icon */}
                  <Icon className={cn('h-6 w-6', action.color)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{action.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
