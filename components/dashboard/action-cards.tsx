'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

interface ActionCard {
  title: string
  description: string
  icon: string
  href: string
  color: string
  bgColor: string
}

const actionCards: ActionCard[] = [
  {
    title: 'Novo Empréstimo',
    description: 'Registrar um novo empréstimo',
    icon: 'BookMarked',
    href: '/loans/new',
    color: 'text-white',
    bgColor: 'bg-linear-to-br from-blue-500 to-blue-600',
  },
  {
    title: 'Devoluções',
    description: 'Registrar a devolução de livros',
    icon: 'RotateCcw',
    href: '/returns',
    color: 'text-white',
    bgColor: 'bg-linear-to-br from-green-500 to-green-600',
  },
  {
    title: 'Acervo',
    description: 'Consultar livros disponíveis',
    icon: 'BookOpen',
    href: '/books',
    color: 'text-white',
    bgColor: 'bg-linear-to-br from-purple-500 to-purple-600',
  },
  {
    title: 'Membros',
    description: 'Cadastrar e consultar membros',
    icon: 'Users',
    href: '/members',
    color: 'text-white',
    bgColor: 'bg-linear-to-br from-orange-500 to-orange-600',
  },
  {
    title: 'Relatórios',
    description: 'Visualizar relatórios e estatísticas',
    icon: 'BarChart3',
    href: '/reports',
    color: 'text-white',
    bgColor: 'bg-linear-to-br from-cyan-500 to-cyan-600',
  },
  {
    title: 'Configurações',
    description: 'Configurar o sistema',
    icon: 'Cog',
    href: '/settings',
    color: 'text-white',
    bgColor: 'bg-linear-to-br from-slate-600 to-slate-700',
  },
]

export function ActionCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {actionCards.map((card) => {
        const Icon = Icons[card.icon as keyof typeof Icons]

        return (
          <Link key={card.href} href={card.href}>
            <Card className="group relative cursor-pointer overflow-hidden border-0 transition-all hover:shadow-2xl hover:scale-105 duration-300 h-full bg-white dark:bg-slate-900">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-white" />
              <div className="p-8 relative z-10">
                <div className={cn('mb-6 inline-flex rounded-full p-5', card.bgColor)}>
                  {/* @ts-expect-error lucide-react dynamic icon */}
                  <Icon className={cn('h-10 w-10', card.color)} />
                </div>

                <h3 className="text-foreground">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>
              <div className={cn('absolute -right-16 -bottom-16 h-32 w-32 rounded-full opacity-0 group-hover:opacity-5 transition-opacity duration-300', card.bgColor)} />
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
