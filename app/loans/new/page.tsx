'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { NewLoanForm } from '@/components/loans/new-loan-form'

export default function NewLoanPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Novo Empréstimo', 'Registrar um novo empréstimo de livro')
  }, [setPageInfo])

  return (
    <div className="space-y-8">
      <NewLoanForm />
    </div>
  )
}
