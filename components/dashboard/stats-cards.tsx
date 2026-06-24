'use client'

import { dashboardStats } from '@/lib/mock-data'
import { StatCard } from './stat-card'

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {dashboardStats.map((stat) => (
        <StatCard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          lightColor={stat.lightColor}
          textColor={stat.textColor}
        />
      ))}
    </div>
  )
}
