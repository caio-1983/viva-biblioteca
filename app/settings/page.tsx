'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'

export default function SettingsPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Configurações', 'Gerenciar configurações do sistema')
  }, [setPageInfo])

  return <div />
}
