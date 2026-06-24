'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NewBookForm } from '@/components/books/new-book-form'

interface Book {
  id: number
  numeroExemplar: string
  titulo: string
  autor: string | null
  classificacao: string | null
  assunto1: string | null
  status: string
}

export function BooksInventory() {
  const [books, setBooks] = useState<Book[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadBooks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/books')
      if (response.ok) {
        const data = await response.json()
        setBooks(data)
      }
    } catch (error) {
      console.error('Erro ao carregar livros:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const filteredBooks = books.filter(
    (book) =>
      book.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.autor?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  const availableBooks = filteredBooks.filter(b => b.status === 'DISPONIVEL').length

  if (showForm) {
    return (
      <NewBookForm
        onSuccess={() => {
          setShowForm(false)
          loadBooks()
        }}
        onCancel={() => setShowForm(false)}
      />
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando livros...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search + action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Pesquisar Livro</CardTitle>
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Novo Título
            </Button>
          </div>
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
          {filteredBooks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? 'Nenhum livro encontrado com esse critério' : 'Nenhum livro cadastrado'}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="bg-muted/50">
                      <th className="text-left py-3 px-4 font-semibold">Número</th>
                      <th className="text-left py-3 px-4 font-semibold">Título</th>
                      <th className="text-left py-3 px-4 font-semibold">Autor</th>
                      <th className="text-left py-3 px-4 font-semibold">Assunto</th>
                      <th className="text-center py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => (
                      <tr key={book.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-xs">{book.numeroExemplar}</td>
                        <td className="py-3 px-4 font-semibold">{book.titulo}</td>
                        <td className="py-3 px-4">{book.autor || '-'}</td>
                        <td className="py-3 px-4 text-xs">{book.assunto1 || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              book.status === 'DISPONIVEL'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {book.status}
                          </span>
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
                  <p className="text-xs text-muted-foreground">Disponíveis:</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">{availableBooks}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
