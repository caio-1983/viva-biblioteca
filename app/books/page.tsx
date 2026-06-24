'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/components/page-context'
import { BooksInventory } from '@/components/books/books-inventory'

export default function BooksPage() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Acervo', 'Consultar livros disponíveis na biblioteca')
  }, [setPageInfo])

  return (
    <div className="space-y-8">
      <BooksInventory />
    </div>
  )
}
