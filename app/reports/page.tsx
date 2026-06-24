'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'

export default function ReportsPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Relatórios', 'Visualizar relatórios e estatísticas')
  }, [setPageInfo])

  return <div />
}
