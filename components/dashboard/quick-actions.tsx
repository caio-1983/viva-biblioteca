'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { ArrowRight } from 'lucide-react'

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
    title: 'Nova Obra',
    description: 'Catalogar um novo título',
    icon: 'BookPlus',
    href: '/acervo/cadastro',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
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
    title: 'Leitores',
    description: 'Perfil e histórico dos leitores',
    icon: 'Users',
    href: '/members',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    title: 'Relatórios',
    description: 'Visualizar estatísticas do sistema',
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
    <div className="space-y-4">
      <h2>Ações Rápidas</h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((action) => {
          const Icon = Icons[action.icon as keyof typeof Icons]

          return (
            <Link key={action.href} href={action.href}>
              <Card className="group cursor-pointer overflow-hidden border border-slate-200 transition-all hover:shadow-lg hover:border-slate-300 bg-white">
                <div className="p-7 flex flex-col gap-4">
                  <div className={cn('inline-flex p-3 rounded-lg w-fit', action.bgColor)}>
                    {/* @ts-expect-error lucide-react dynamic icon */}
                    <Icon className={cn('h-6 w-6', action.color)} />
                  </div>

                  <div className="flex-1">
                    <h3 className="card-title">
                      {action.title}
                    </h3>
                    <p className="card-description mt-1">
                      {action.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 group-hover:text-slate-600 transition-colors">
                    <span className="text-xs font-medium text-slate-500">Acessar</span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
