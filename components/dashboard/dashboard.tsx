'use client'

import { StatsCards } from './stats-cards'
import { ActionCards } from './action-cards'

export function Dashboard() {
  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="pt-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground bg-linear-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Bem-vindo!
        </h1>
        <p className="mt-3 text-lg text-muted-foreground font-medium">
          Sistema de Gerenciamento da Biblioteca
        </p>
      </div>

      {/* Action Cards */}
      <div>
        <h2 className="mb-6 text-foreground">Módulos Principais</h2>
        <ActionCards />
      </div>

      {/* Stats Summary */}
      <div>
        <h2 className="mb-6 text-foreground">Resumo Geral</h2>
        <StatsCards />
      </div>
    </div>
  )
}
