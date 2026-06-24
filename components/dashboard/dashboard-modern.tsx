'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { QuickActions } from './quick-actions'
import { KpiCards } from './kpi-cards'
import { LoansChart } from './loans-chart'
import { OverdueLoans } from './overdue-loans'
import { CategoriesChart } from './categories-chart'
import { NewMembers } from './new-members'
import { RecentActivities } from './recent-activities'

export function DashboardModern() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Dashboard', 'Sistema de Gerenciamento da Biblioteca')
  }, [setPageInfo])

  return (
    <div className="space-y-12 pb-12">
      {/* Quick Actions */}
      <section className="space-y-4">
        <QuickActions />
      </section>

      {/* KPI Cards */}
      <section className="space-y-4">
        <h2 className="text-slate-900">Indicadores Principais</h2>
        <KpiCards />
      </section>

      {/* Charts Section */}
      <section className="grid gap-8 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <h3>Empréstimos nos Últimos 7 Dias</h3>
          <LoansChart />
        </div>
        <div className="md:col-span-1 space-y-3">
          <h3>Empréstimos em Atraso</h3>
          <OverdueLoans />
        </div>
      </section>

      {/* Additional Info */}
      <section className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <h3>Distribuição por Categoria</h3>
          <CategoriesChart />
        </div>
        <div className="lg:col-span-1 space-y-3">
          <h3>Novos Membros</h3>
          <NewMembers />
        </div>
        <div className="lg:col-span-1 space-y-3">
          <h3>Atividades Recentes</h3>
          <RecentActivities />
        </div>
      </section>
    </div>
  )
}
