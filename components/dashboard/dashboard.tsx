'use client'

import { StatsCards } from './stats-cards'
import { ActionCards } from './action-cards'

export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bem-vindo!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sistema de Gerenciamento da Biblioteca
        </p>
      </div>

      {/* Action Cards */}
      <ActionCards />

      {/* Stats Summary */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Resumo</h2>
        <StatsCards />
      </div>
    </div>
  )
}
