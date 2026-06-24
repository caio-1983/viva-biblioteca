'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { ReportsView } from '@/components/reports/reports-view'

export default function ReportsPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Relatórios', 'Indicadores, histórico e exportação de dados')
  }, [setPageInfo])

  return (
    <div className="space-y-8">
      <ReportsView />
    </div>
  )
}
