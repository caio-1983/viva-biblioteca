'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function NewLoanForm() {
  const [formData, setFormData] = useState({
    memberName: '',
    memberBirthDate: '',
    memberPhone: '',
    bookTitle: '',
    loanDate: new Date().toISOString().split('T')[0],
    returnDate: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Empréstimo registrado:', formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Empréstimo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Member Data */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Dados do Membro</h3>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Nome do Membro
                </label>
                <Input
                  name="memberName"
                  value={formData.memberName}
                  onChange={handleChange}
                  placeholder="João da Silva"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Data de Nascimento
                </label>
                <Input
                  name="memberBirthDate"
                  type="date"
                  value={formData.memberBirthDate}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Telefone (opcional)
                </label>
                <Input
                  name="memberPhone"
                  value={formData.memberPhone}
                  onChange={handleChange}
                  placeholder="(11) 99999-1234"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Book Data */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Dados do Livro</h3>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Pesquisar Livro
                </label>
                <Input
                  name="bookTitle"
                  value={formData.bookTitle}
                  onChange={handleChange}
                  placeholder="Digite o título do livro"
                  className="mt-1"
                />
              </div>

              {formData.bookTitle && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex gap-4">
                    <div className="h-24 w-16 rounded bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">{formData.bookTitle}</p>
                      <p className="text-sm text-muted-foreground">Autor: John Doe</p>
                      <p className="text-sm text-muted-foreground">Categoria: Ficção</p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Disponíveis: 2 exemplar(es)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4 border-t border-border pt-6">
            <h3 className="font-semibold text-foreground">Datas</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Data de Empréstimo
                </label>
                <Input
                  name="loanDate"
                  type="date"
                  value={formData.loanDate}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Data para Devolução
                </label>
                <Input
                  name="returnDate"
                  type="date"
                  value={formData.returnDate}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end border-t border-border pt-6">
            <Button type="submit" size="lg" className="w-full md:w-auto">
              Registrar Empréstimo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
