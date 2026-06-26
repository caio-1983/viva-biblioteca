'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { ReadersWorkspace } from '@/components/readers/readers-workspace'

export default function MembersPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Leitores', 'Perfil, empréstimos e histórico de cada leitor')
  }, [setPageInfo])

  return <ReadersWorkspace />
}
