'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { AdminWorkspace } from '@/components/admin/admin-workspace'

export default function SettingsPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Administração', 'Configurações, importações e controle do sistema')
  }, [setPageInfo])

  return <AdminWorkspace />
}
