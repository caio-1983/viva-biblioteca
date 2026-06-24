'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const mockLoans = [
  {
    id: 1,
    memberName: 'João da Silva',
    bookTitle: 'O Peregrino',
    loanDate: '2026-06-23',
    dueDate: '2026-07-23',
    status: 'active',
  },
  {
    id: 2,
    memberName: 'Maria Santos',
    bookTitle: 'Clean Code',
    loanDate: '2026-05-15',
    dueDate: '2026-06-15',
    status: 'overdue',
  },
]

export function ReturnsForm() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLoan, setSelectedLoan] = useState<(typeof mockLoans)[0] | null>(null)
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0])

  const filteredLoans = mockLoans.filter(
    (loan) =>
      loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedLoan) {
      console.log('Devolução registrada:', { loanId: selectedLoan.id, returnDate })
      setSelectedLoan(null)
      setSearchTerm('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Empréstimo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Pesquisar por membro ou livro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* List of Loans */}
      {filteredLoans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Empréstimos Encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold">Membro</th>
                    <th className="text-left py-2 px-3 font-semibold">Livro</th>
                    <th className="text-left py-2 px-3 font-semibold">Data Empréstimo</th>
                    <th className="text-left py-2 px-3 font-semibold">Data Devolução Prevista</th>
                    <th className="text-left py-2 px-3 font-semibold">Status</th>
                    <th className="text-left py-2 px-3 font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-3">{loan.memberName}</td>
                      <td className="py-3 px-3">{loan.bookTitle}</td>
                      <td className="py-3 px-3">{loan.loanDate}</td>
                      <td className="py-3 px-3">{loan.dueDate}</td>
                      <td className="py-3 px-3">
                        <Badge
                          className={cn(
                            loan.status === 'overdue'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                          )}
                        >
                          {loan.status === 'overdue' ? 'Atrasado' : 'Ativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLoan(loan)}
                        >
                          Devolver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Return Form */}
      {selectedLoan && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-300">
              Registrar Devolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Membro:</p>
                <p className="font-semibold">{selectedLoan.memberName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Livro:</p>
                <p className="font-semibold">{selectedLoan.bookTitle}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Data de Devolução
                </label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  Confirmar Devolução
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedLoan(null)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {!selectedLoan && searchTerm === '' && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6 flex items-center gap-2 text-green-700 dark:text-green-300">
            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
              ✓
            </div>
            <p className="font-medium">Devolução registrada com sucesso! Obrigado!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
