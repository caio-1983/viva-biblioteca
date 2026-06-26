'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { InventoryWorkspace } from '@/components/inventario/inventory-workspace'

export default function InventarioPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Inventário', 'Conferência patrimonial de exemplares')
  }, [setPageInfo])

  return <InventoryWorkspace />
}
