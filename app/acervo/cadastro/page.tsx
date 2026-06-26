'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { CatalogingWorkspace } from '@/components/cataloging/cataloging-workspace'

export default function CadastroAcervoPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Catalogação', 'Identifique a obra e registre exemplares')
  }, [setPageInfo])

  return <CatalogingWorkspace />
}
