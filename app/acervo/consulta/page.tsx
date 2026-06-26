'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { CatalogView } from '@/components/catalog/catalog-view'

export default function CatalogoPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Catálogo', 'Acervo de obras e exemplares')
  }, [setPageInfo])

  return <CatalogView />
}
