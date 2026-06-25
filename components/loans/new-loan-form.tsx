'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  User,
  BookMarked,
  CalendarDays,
  Save,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react'

interface BookResult {
  id: number
  codigoExemplar: string
  titulo: string
  autor: string | null
  assunto1: string | null
  status: string
}

interface UserResult {
  id: number
  numeroCadastro: string
  nomeCompleto: string
}

interface BookSlot {
  search: string
  selectedBookId: string
  selectedBook: BookResult | null
  results: BookResult[]
  searching: boolean
}

const MAX_BOOKS = 3
const PRAZO_DIAS = 20

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function emptySlot(): BookSlot {
  return { search: '', selectedBookId: '', selectedBook: null, results: [], searching: false }
}

export function NewLoanForm() {
  const router = useRouter()
  const params = useSearchParams()

  const preUserId = params.get('userId') ?? ''
  const preNome = params.get('nome') ?? ''
  const preCadastro = params.get('cadastro') ?? ''

  const [formData, setFormData] = useState({
    userId: preUserId,
    memberName: preNome,
    memberCadastro: preCadastro,
    loanDate: new Date().toISOString().split('T')[0],
    returnDate: addDays(new Date().toISOString().split('T')[0], PRAZO_DIAS),
  })

  const [books, setBooks] = useState<BookSlot[]>([emptySlot()])
  const searchTimers = useRef<(ReturnType<typeof setTimeout> | undefined)[]>([])

  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserResult[]>([])
  const [searchingUser, setSearchingUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successBooks, setSuccessBooks] = useState<BookResult[]>([])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      userId: preUserId,
      memberName: preNome,
      memberCadastro: preCadastro,
    }))
  }, [preUserId, preNome, preCadastro])

  // Debounced user search
  useEffect(() => {
    if (formData.userId) return
    if (userSearch.trim().length < 2) { setUserResults([]); return }
    const timer = setTimeout(async () => {
      setSearchingUser(true)
      try {
        const res = await fetch('/api/usuarios')
        if (res.ok) {
          const all: UserResult[] = await res.json()
          const q = userSearch.toLowerCase()
          setUserResults(all.filter((u) => u.nomeCompleto.toLowerCase().includes(q)).slice(0, 8))
        }
      } finally { setSearchingUser(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch, formData.userId])

  const selectUser = (user: UserResult) => {
    setFormData((p) => ({
      ...p,
      userId: String(user.id),
      memberName: user.nomeCompleto,
      memberCadastro: user.numeroCadastro,
    }))
    setUserSearch(user.nomeCompleto)
    setUserResults([])
  }

  const clearUser = () => {
    setFormData((p) => ({ ...p, userId: '', memberName: '', memberCadastro: '' }))
    setUserSearch('')
    setUserResults([])
  }

  const handleBookSearch = (idx: number, value: string) => {
    setBooks((prev) =>
      prev.map((b, i) =>
        i === idx ? { ...b, search: value, selectedBookId: '', selectedBook: null, results: [] } : b
      )
    )

    if (searchTimers.current[idx]) clearTimeout(searchTimers.current[idx])
    if (value.trim().length < 2) return

    searchTimers.current[idx] = setTimeout(async () => {
      setBooks((prev) => prev.map((b, i) => (i === idx ? { ...b, searching: true } : b)))
      try {
        const res = await fetch('/api/books')
        if (res.ok) {
          const all: BookResult[] = await res.json()
          const q = value.toLowerCase()
          setBooks((prev) => {
            const alreadySelected = new Set(
              prev.filter((b, i) => i !== idx && b.selectedBookId).map((b) => b.selectedBookId)
            )
            const filtered = all
              .filter(
                (b) =>
                  b.status === 'DISPONIVEL' &&
                  !alreadySelected.has(String(b.id)) &&
                  (b.titulo.toLowerCase().includes(q) || (b.autor?.toLowerCase().includes(q) ?? false))
              )
              .slice(0, 8)
            return prev.map((b, i) => (i === idx ? { ...b, results: filtered, searching: false } : b))
          })
        }
      } catch {
        setBooks((prev) => prev.map((b, i) => (i === idx ? { ...b, searching: false } : b)))
      }
    }, 300)
  }

  const selectBook = (idx: number, book: BookResult) => {
    setBooks((prev) =>
      prev.map((b, i) =>
        i === idx
          ? { ...b, selectedBookId: String(book.id), selectedBook: book, search: book.titulo, results: [] }
          : b
      )
    )
  }

  const addBookSlot = () => {
    if (books.length < MAX_BOOKS) {
      setBooks((prev) => [...prev, emptySlot()])
    }
  }

  const removeBookSlot = (idx: number) => {
    if (searchTimers.current[idx]) clearTimeout(searchTimers.current[idx])
    if (books.length === 1) {
      setBooks([emptySlot()])
    } else {
      setBooks((prev) => prev.filter((_, i) => i !== idx))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.userId) {
      setError('Selecione um usuário.')
      return
    }

    const selected = books.filter((b) => b.selectedBookId)
    if (selected.length === 0) {
      setError('Selecione pelo menos um livro disponível.')
      return
    }

    if (!formData.returnDate) {
      setError('Informe a data prevista de devolução.')
      return
    }

    setLoading(true)
    try {
      for (const slot of selected) {
        const res = await fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuarioId: Number(formData.userId),
            exemplarId: Number(slot.selectedBookId),
            dataEmprestimo: formData.loanDate,
            dataPrevistaDevolucao: formData.returnDate,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao registrar empréstimo')
        }
      }

      setSuccessBooks(selected.map((s) => s.selectedBook!))
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-green-200 bg-green-50 py-16 text-center dark:border-green-800/50 dark:bg-green-900/20">
        <CheckCircle2 className="mb-3 h-10 w-10 text-green-600 dark:text-green-400" />
        <p className="text-base font-semibold text-green-700 dark:text-green-300">
          {successBooks.length === 1 ? 'Empréstimo registrado' : `${successBooks.length} empréstimos registrados`} com sucesso!
        </p>
        <div className="mt-2 space-y-0.5">
          {successBooks.map((b, i) => (
            <p key={i} className="text-sm text-green-600/80 dark:text-green-400/70">
              {b.titulo} · {formData.memberName}
            </p>
          ))}
        </div>
        <Button
          className="mt-6 gap-2"
          onClick={() => {
            setSuccess(false)
            setSuccessBooks([])
            setBooks([emptySlot()])
          }}
        >
          Registrar outro empréstimo
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <BookMarked className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">Novo Empréstimo</h2>
            <p className="text-sm text-muted-foreground">
              Registre a saída de um exemplar para um usuário
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Registrando...' : 'Registrar Empréstimo'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

          {/* Card: Usuário */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Usuário</CardTitle>
                  <CardDescription>Leitor que receberá o empréstimo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Nome do usuário <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9"
                    placeholder="Digite o nome..."
                    value={userSearch || formData.memberName}
                    onChange={(e) => {
                      setUserSearch(e.target.value)
                      if (formData.userId) clearUser()
                    }}
                    disabled={loading}
                  />
                </div>

                {userResults.length > 0 && (
                  <div className="rounded-lg border border-border bg-popover shadow-md overflow-hidden">
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                      >
                        <span className="font-medium text-foreground truncate">{u.nomeCompleto}</span>
                        <span className="font-mono text-xs text-muted-foreground">{u.numeroCadastro}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchingUser && (
                  <p className="text-xs text-muted-foreground">Buscando...</p>
                )}
              </div>

              {formData.userId && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/50 dark:bg-blue-900/20">
                  <p className="font-semibold text-foreground">{formData.memberName}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{formData.memberCadastro}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Livros */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <BookMarked className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold">Livros</CardTitle>
                  <CardDescription>Até {MAX_BOOKS} títulos por empréstimo</CardDescription>
                </div>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {books.filter((b) => b.selectedBookId).length}/{MAX_BOOKS}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {books.map((slot, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Título {books.length > 1 ? idx + 1 : ''}{' '}
                      {idx === 0 && <span className="text-red-500">*</span>}
                    </label>
                    {(books.length > 1 || slot.selectedBookId) && (
                      <button
                        type="button"
                        onClick={() => removeBookSlot(idx)}
                        disabled={loading}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                        aria-label="Remover título"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      className="pl-9"
                      placeholder="Digite o título ou autor..."
                      value={slot.search}
                      onChange={(e) => handleBookSearch(idx, e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {slot.results.length > 0 && (
                    <div className="rounded-lg border border-border bg-popover shadow-md overflow-hidden">
                      {slot.results.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => selectBook(idx, book)}
                          className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                        >
                          <span className="font-medium text-foreground truncate">{book.titulo}</span>
                          <span className="text-xs text-muted-foreground">
                            {book.autor ?? '—'} · {book.codigoExemplar}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {slot.searching && (
                    <p className="text-xs text-muted-foreground">Buscando...</p>
                  )}

                  {slot.selectedBook && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-900/20">
                      <p className="font-semibold text-foreground truncate">
                        {slot.selectedBook.titulo}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {slot.selectedBook.autor ?? '—'} · {slot.selectedBook.codigoExemplar}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {books.length < MAX_BOOKS && (
                <button
                  type="button"
                  onClick={addBookSlot}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-300 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar título
                </button>
              )}
            </CardContent>
          </Card>

          {/* Card: Datas */}
          <Card className="md:col-span-2 xl:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                  <CalendarDays className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Datas</CardTitle>
                  <CardDescription>Período do empréstimo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Data do Empréstimo
                </label>
                <Input
                  type="date"
                  value={formData.loanDate}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      loanDate: e.target.value,
                      returnDate: addDays(e.target.value, PRAZO_DIAS),
                    }))
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Devolução Prevista{' '}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, returnDate: e.target.value }))
                  }
                  required
                  disabled={loading}
                />
              </div>
              {formData.returnDate && (() => {
                const diff = Math.round(
                  (new Date(formData.returnDate + 'T12:00:00').getTime() -
                    new Date(formData.loanDate + 'T12:00:00').getTime()) /
                    86_400_000
                )
                const isDefault = diff === PRAZO_DIAS
                return (
                  <div className={`rounded-md px-3 py-2 text-xs ${isDefault ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                    Prazo: <span className="font-semibold">{diff} dia{diff !== 1 ? 's' : ''} corridos</span>
                    {isDefault && <span className="ml-1 opacity-60">(padrão)</span>}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

        </div>
      </div>
    </form>
  )
}
