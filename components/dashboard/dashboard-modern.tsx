'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { useDashboard } from '@/hooks/useDashboard'
import { QuickActions } from './quick-actions'
import { KpiCards } from './kpi-cards'
import { LoansChart } from './loans-chart'
import { OverdueLoans } from './overdue-loans'
import { CategoriesChart } from './categories-chart'
import { RecentActivities } from './recent-activities'
import { TodayPending } from './today-pending'

export function DashboardModern() {
  const { setPageInfo } = usePageTitle()
  const { data, loading } = useDashboard()

  useEffect(() => {
    setPageInfo('Dashboard', 'Sistema de Gerenciamento da Biblioteca')
  }, [setPageInfo])

  return (
    <div className="space-y-8 pb-8">

      {/* Ações Rápidas */}
      <section>
        <QuickActions />
      </section>

      {/* Indicadores */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Indicadores
        </p>
        <KpiCards data={data?.metrics} loading={loading} />
      </section>

      {/* Gráfico (70%) + Pendências de Hoje / Empréstimos em Atraso (30%) */}
      <section className="grid gap-6 grid-cols-1 md:grid-cols-[7fr_3fr] items-stretch">
        <div className="flex flex-col">
          <LoansChart data={data?.loanChart} loading={loading} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col">
            <TodayPending data={data?.todayPending} loading={loading} />
          </div>
          <div className="flex-1 flex flex-col">
            <OverdueLoans data={data?.overdueLoans} loading={loading} />
          </div>
        </div>
      </section>

      {/* Linha inferior: Categorias (60%) + Atividades Recentes (40%) */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-5 items-stretch">
        <div className="lg:col-span-3 flex flex-col">
          <CategoriesChart data={data?.categories} loading={loading} />
        </div>
        <div className="lg:col-span-2 flex flex-col">
          <RecentActivities data={data?.activities} loading={loading} />
        </div>
      </section>

    </div>
  )
}
