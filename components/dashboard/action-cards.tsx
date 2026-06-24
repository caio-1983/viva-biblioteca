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
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
  },
  {
    title: 'Devoluções',
    description: 'Registrar a devolução de livros',
    icon: 'RotateCcw',
    href: '/returns',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-950',
  },
  {
    title: 'Acervo',
    description: 'Consultar livros disponíveis',
    icon: 'BookOpen',
    href: '/books',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-950',
  },
  {
    title: 'Membros',
    description: 'Cadastrar e consultar membros',
    icon: 'Users',
    href: '/members',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-950',
  },
  {
    title: 'Relatórios',
    description: 'Visualizar relatórios e estatísticas',
    icon: 'BarChart3',
    href: '/reports',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100 dark:bg-cyan-950',
  },
  {
    title: 'Configurações',
    description: 'Configurar o sistema',
    icon: 'Cog',
    href: '/settings',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-950',
  },
]

export function ActionCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {actionCards.map((card) => {
        const Icon = Icons[card.icon as keyof typeof Icons] as React.ComponentType<any>

        return (
          <Link key={card.href} href={card.href}>
            <Card className="group cursor-pointer overflow-hidden border-0 transition-all hover:shadow-lg hover:scale-105 duration-300 h-full">
              <div className="p-8">
                <div className={cn('mb-4 inline-flex rounded-lg p-4', card.bgColor)}>
                  <Icon className={cn('h-8 w-8', card.color)} />
                </div>

                <h3 className="text-lg font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
