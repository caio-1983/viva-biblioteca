'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { ReturnsForm } from '@/components/returns/returns-form'

export default function ReturnsPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Devoluções', 'Registrar a devolução de livros emprestados')
  }, [setPageInfo])

  return (
    <div className="space-y-8">
      <ReturnsForm />
    </div>
  )
}
