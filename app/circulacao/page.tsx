'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { CirculationWorkspace } from '@/components/circulacao/circulation-workspace'

export default function CirculacaoPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Circulação', 'Empréstimos, devoluções e renovações')
  }, [setPageInfo])

  return <CirculationWorkspace />
}
