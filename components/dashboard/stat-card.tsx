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
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-md transition-all hover:shadow-lg hover:scale-105 duration-300">
      <div className="p-6">
        {/* Icon Background */}
        <div className={cn('mb-4 inline-flex rounded-lg p-3', lightColor)}>
          {/* @ts-expect-error lucide-react dynamic icon */}
          <Icon className={cn('h-6 w-6', textColor)} />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value.toLocaleString('pt-BR')}</p>
        </div>

        {/* Gradient Bottom Border */}
        <div className={cn(
          'mt-4 h-1 w-12 rounded-full bg-gradient-to-r',
          color
        )} />
      </div>
    </Card>
  )
}
