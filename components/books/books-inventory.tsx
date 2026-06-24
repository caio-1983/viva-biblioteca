'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const mockBooks = [
  {
    id: '001',
    title: 'O Peregrino',
    author: 'John Bunyan',
    category: 'Clássicos',
    total: 3,
    available: 2,
  },
  {
    id: '002',
    title: 'Cristianismo Puro e Simples',
    author: 'C.S. Lewis',
    category: 'Teologia',
    total: 2,
    available: 1,
  },
  {
    id: '003',
    title: 'O Deus Pródigo',
    author: 'Timothy Keller',
    category: 'Teologia',
    total: 3,
    available: 3,
  },
  {
    id: '004',
    title: 'Até que nada mais importe',
    author: 'Luciano Subira',
    category: 'Vida Cristã',
    total: 2,
    available: 2,
  },
  {
    id: '005',
    title: 'A Revolução dos Bichos',
    author: 'George Orwell',
    category: 'Literatura',
    total: 1,
    available: 1,
  },
]

export function BooksInventory() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBooks = mockBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalBooks = filteredBooks.reduce((sum, book) => sum + book.total, 0)
  const totalCopies = filteredBooks.reduce((sum, book) => sum + book.available, 0)

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Livro</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Digite o título ou autor do livro"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Acervo Disponível</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold">Código</th>
                  <th className="text-left py-3 px-4 font-semibold">Livro</th>
                  <th className="text-left py-3 px-4 font-semibold">Autor</th>
                  <th className="text-left py-3 px-4 font-semibold">Categoria</th>
                  <th className="text-center py-3 px-4 font-semibold">Total</th>
                  <th className="text-center py-3 px-4 font-semibold">Disponíveis</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-xs">{book.id}</td>
                    <td className="py-3 px-4 font-semibold">{book.title}</td>
                    <td className="py-3 px-4">{book.author}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                        {book.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{book.total}</td>
                    <td className="py-3 px-4 text-center font-semibold text-green-600 dark:text-green-400">
                      {book.available}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="border-t border-border mt-4 pt-4 flex gap-8">
            <div>
              <p className="text-xs text-muted-foreground">Total de livros:</p>
              <p className="text-xl font-bold text-foreground">{filteredBooks.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de exemplares:</p>
              <p className="text-xl font-bold text-foreground">{totalBooks}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disponíveis:</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{totalCopies}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
