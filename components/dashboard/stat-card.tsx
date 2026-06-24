'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  icon: string
  color: string
  lightColor: string
  textColor: string
}

export function StatCard({
  title,
  value,
  icon,
  color,
  lightColor,
  textColor,
}: StatCardProps) {
  const Icon = Icons[icon as keyof typeof Icons]

  return (
    <Card className="overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-lg transition-all hover:shadow-2xl hover:scale-105 duration-300">
      <div className="p-8">
        {/* Icon Background */}
        <div className={cn('mb-6 inline-flex rounded-full p-4', lightColor)}>
          {/* @ts-expect-error lucide-react dynamic icon */}
          <Icon className={cn('h-7 w-7', textColor)} />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-bold text-foreground">{value.toLocaleString('pt-BR')}</p>
        </div>

        {/* Gradient Bottom Border */}
        <div className={cn(
          'mt-6 h-1.5 w-16 rounded-full bg-gradient-to-r',
          color
        )} />
      </div>
    </Card>
  )
}
