'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, X, BookOpen } from 'lucide-react'
import { NewBookForm } from '@/components/books/new-book-form'

interface Book {
  id: number
  codigoExemplar: string
  titulo: string
  autor: string | null
  classificacao: string | null
  assunto1: string | null
  status: string
}

interface BookDetalhado {
  id: number
  codigoExemplar: string
  tipoPublicacao: string | null
  isbn: string | null
  classificacao: string | null
  titulo: string
  subtitulo: string | null
  autor: string | null
  edicao: string | null
  editora: string | null
  anoPublicacao: number | null
  tombo: string | null
  assunto1: string | null
  assunto2: string | null
  assunto3: string | null
  colecao: string | null
  observacao: string | null
  status: string
  ativo: boolean
}

const STATUS_OPTIONS = [
  { value: 'DISPONIVEL',   label: 'Disponível' },
  { value: 'EMPRESTADO',   label: 'Emprestado' },
  { value: 'EXTRAVIADO',   label: 'Extraviado' },
  { value: 'INDISPONIVEL', label: 'Indisponível' },
]

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map(({ value, label }) => [value, label])
)

const STATUS_COLORS: Record<string, { band: string; dot: string; badge: string }> = {
  DISPONIVEL:   { band: 'linear-gradient(135deg,#14532d 0%,#166534 55%,#15803d 100%)', dot: '#4ade80', badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  EMPRESTADO:   { band: 'linear-gradient(135deg,#78350f 0%,#92400e 55%,#b45309 100%)', dot: '#fbbf24', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  EXTRAVIADO:   { band: 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 55%,#b91c1c 100%)', dot: '#f87171', badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  INDISPONIVEL: { band: 'linear-gradient(135deg,#1e293b 0%,#334155 100%)',              dot: '#94a3b8', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
}

const DEFAULT_COLORS = STATUS_COLORS.INDISPONIVEL

const TIPO_OPTIONS = ['Livro', 'Periódico', 'Material Didático', 'Audiovisual', 'Outros']

interface EditFields {
  tipoPublicacao: string
  isbn: string
  classificacao: string
  titulo: string
  subtitulo: string
  autor: string
  edicao: string
  editora: string
  anoPublicacao: string
  tombo: string
  assunto1: string
  assunto2: string
  assunto3: string
  colecao: string
  observacao: string
  status: string
}

export function BooksInventory() {
  const [books, setBooks] = useState<Book[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedBook, setSelectedBook] = useState<BookDetalhado | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<EditFields | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const openModal = async (id: number) => {
    setModalLoading(true)
    setSelectedBook(null)
    setEditing(false)
    setSaveError(null)
    try {
      const res = await fetch(`/api/acervo/${id}`)
      const data: BookDetalhado = await res.json()
      setSelectedBook(data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedBook(null)
    setModalLoading(false)
    setEditing(false)
    setSaveError(null)
  }

  const startEditing = () => {
    if (!selectedBook) return
    setEditData({
      tipoPublicacao: selectedBook.tipoPublicacao || '',
      isbn: selectedBook.isbn || '',
      classificacao: selectedBook.classificacao || '',
      titulo: selectedBook.titulo || '',
      subtitulo: selectedBook.subtitulo || '',
      autor: selectedBook.autor || '',
      edicao: selectedBook.edicao || '',
      editora: selectedBook.editora || '',
      anoPublicacao: selectedBook.anoPublicacao?.toString() ?? '',
      tombo: selectedBook.tombo || '',
      assunto1: selectedBook.assunto1 || '',
      assunto2: selectedBook.assunto2 || '',
      assunto3: selectedBook.assunto3 || '',
      colecao: selectedBook.colecao || '',
      observacao: selectedBook.observacao || '',
      status: selectedBook.status || 'DISPONIVEL',
    })
    setSaveError(null)
    setEditing(true)
  }

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setEditData((prev) => prev ? { ...prev, [name]: value } : prev)
  }

  const handleEditSave = async () => {
    if (!selectedBook || !editData) return
    if (!editData.titulo.trim()) {
      setSaveError('Título é obrigatório.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/acervo/${selectedBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPublicacao: editData.tipoPublicacao || null,
          isbn: editData.isbn || null,
          classificacao: editData.classificacao || null,
          titulo: editData.titulo.trim(),
          subtitulo: editData.subtitulo || null,
          autor: editData.autor || null,
          edicao: editData.edicao || null,
          editora: editData.editora || null,
          anoPublicacao: editData.anoPublicacao ? Number(editData.anoPublicacao) : null,
          tombo: editData.tombo || null,
          assunto1: editData.assunto1 || null,
          assunto2: editData.assunto2 || null,
          assunto3: editData.assunto3 || null,
          colecao: editData.colecao || null,
          observacao: editData.observacao || null,
          status: editData.status || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }
      const updated: BookDetalhado = await res.json()
      setSelectedBook(updated)
      setEditing(false)
      loadBooks()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

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
                      <th className="text-left py-3 px-4 font-semibold">Nº Exemplar</th>
                      <th className="text-left py-3 px-4 font-semibold">Título</th>
                      <th className="text-left py-3 px-4 font-semibold">Autor</th>
                      <th className="text-left py-3 px-4 font-semibold">Assunto</th>
                      <th className="text-center py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => (
                      <tr key={book.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-xs">{book.codigoExemplar}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openModal(book.id)}
                            className="font-semibold text-primary hover:underline text-left"
                          >
                            {book.titulo}
                          </button>
                        </td>
                        <td className="py-3 px-4">{book.autor || '-'}</td>
                        <td className="py-3 px-4 text-xs">{book.assunto1 || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${(STATUS_COLORS[book.status] ?? DEFAULT_COLORS).badge}`}
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
      {/* Modal de Detalhes */}
      {(selectedBook || modalLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-background"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {modalLoading ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                Carregando…
              </div>
            ) : selectedBook && (
              <>
                {/* Colored header band — changes by status */}
                <div
                  className="relative px-6 pt-5 pb-7 shrink-0"
                  style={{
                    background: (STATUS_COLORS[selectedBook.status] ?? DEFAULT_COLORS).band,
                  }}
                >
                  {/* Eyebrow + close */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-md"
                        style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
                      >
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <span
                        className="text-xs font-semibold tracking-widest uppercase"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                      >
                        {selectedBook.tipoPublicacao || 'Acervo'}
                      </span>
                    </div>
                    <button
                      onClick={closeModal}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                      style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  {/* Title */}
                  <h2 className="text-[1.4rem] font-bold text-white leading-snug">
                    {selectedBook.titulo}
                  </h2>
                  {selectedBook.subtitulo && (
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {selectedBook.subtitulo}
                    </p>
                  )}

                  {/* Status pill + identifiers */}
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: 'white' }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: (STATUS_COLORS[selectedBook.status] ?? DEFAULT_COLORS).dot,
                        }}
                      />
                      {STATUS_LABEL[selectedBook.status] ?? selectedBook.status}
                    </span>
                    <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Nº {selectedBook.codigoExemplar}
                    </span>
                    {selectedBook.tombo && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        · Tombo {selectedBook.tombo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body — view or edit mode */}
                {editing && editData ? (
                  <div className="overflow-y-auto flex-1 px-6 py-5">
                    {/* Número do exemplar — read-only */}
                    <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
                      <span className="text-xs text-muted-foreground">Nº Exemplar</span>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {selectedBook.codigoExemplar}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">não editável</span>
                    </div>

                    <div className="space-y-4">
                      {/* Status */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUS_OPTIONS.map(({ value, label }) => {
                            const active = editData.status === value
                            const colors = STATUS_COLORS[value] ?? DEFAULT_COLORS
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setEditData((p) => p ? { ...p, status: value } : p)}
                                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                                  active
                                    ? 'border-transparent text-white'
                                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                }`}
                                style={active ? { background: colors.band } : undefined}
                              >
                                {active && (
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: colors.dot }}
                                  />
                                )}
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Tipo */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Tipo de Publicação</p>
                        <div className="flex flex-wrap gap-1.5">
                          {TIPO_OPTIONS.map((tipo) => (
                            <button
                              key={tipo}
                              type="button"
                              onClick={() => setEditData((p) => p ? { ...p, tipoPublicacao: tipo } : p)}
                              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                                editData.tipoPublicacao === tipo
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                              }`}
                            >
                              {tipo}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Título + Subtítulo */}
                      <div className="grid grid-cols-1 gap-3">
                        <EditField label="Título *" name="titulo" value={editData.titulo} onChange={handleEditChange} />
                        <EditField label="Subtítulo" name="subtitulo" value={editData.subtitulo} onChange={handleEditChange} />
                      </div>

                      {/* Autor + Editora */}
                      <div className="grid grid-cols-2 gap-3">
                        <EditField label="Autor" name="autor" value={editData.autor} onChange={handleEditChange} />
                        <EditField label="Editora" name="editora" value={editData.editora} onChange={handleEditChange} />
                      </div>

                      {/* ISBN + Classificação + Edição + Ano */}
                      <div className="grid grid-cols-2 gap-3">
                        <EditField label="ISBN" name="isbn" value={editData.isbn} onChange={handleEditChange} mono />
                        <EditField label="Classificação" name="classificacao" value={editData.classificacao} onChange={handleEditChange} mono />
                        <EditField label="Edição" name="edicao" value={editData.edicao} onChange={handleEditChange} />
                        <EditField label="Ano" name="anoPublicacao" value={editData.anoPublicacao} onChange={handleEditChange} maxLength={4} placeholder="Ex: 2024" />
                      </div>

                      {/* Tombo + Coleção */}
                      <div className="grid grid-cols-2 gap-3">
                        <EditField label="Tombo" name="tombo" value={editData.tombo} onChange={handleEditChange} mono />
                        <EditField label="Coleção" name="colecao" value={editData.colecao} onChange={handleEditChange} />
                      </div>

                      {/* Assuntos */}
                      <div className="grid grid-cols-1 gap-3">
                        <EditField label="Assunto 1" name="assunto1" value={editData.assunto1} onChange={handleEditChange} />
                        <EditField label="Assunto 2" name="assunto2" value={editData.assunto2} onChange={handleEditChange} />
                        <EditField label="Assunto 3" name="assunto3" value={editData.assunto3} onChange={handleEditChange} />
                      </div>

                      {/* Observação */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Observação</p>
                        <textarea
                          name="observacao"
                          value={editData.observacao}
                          onChange={handleEditChange}
                          rows={3}
                          placeholder="Observações sobre o exemplar..."
                          className="flex w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>

                    {saveError && (
                      <p className="mt-4 text-xs text-red-600 dark:text-red-400">{saveError}</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {/* Author + Publisher — prominent */}
                    {(selectedBook.autor || selectedBook.editora) && (
                      <div className="grid grid-cols-2 gap-6">
                        {selectedBook.autor && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Autor</p>
                            <p className="text-base font-semibold text-foreground leading-tight">
                              {selectedBook.autor}
                            </p>
                          </div>
                        )}
                        {selectedBook.editora && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Editora</p>
                            <p className="text-base font-semibold text-foreground leading-tight">
                              {selectedBook.editora}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Secondary metadata — inline, only populated fields */}
                    {(() => {
                      const ano = selectedBook.anoPublicacao?.toString() ?? null
                      const secondary = [
                        selectedBook.isbn && { label: 'ISBN', value: selectedBook.isbn },
                        selectedBook.edicao && { label: 'Edição', value: selectedBook.edicao },
                        ano && { label: 'Ano', value: ano },
                        selectedBook.classificacao && { label: 'Classificação', value: selectedBook.classificacao },
                        selectedBook.colecao && { label: 'Coleção', value: selectedBook.colecao },
                      ].filter(Boolean) as { label: string; value: string }[]

                      return secondary.length > 0 ? (
                        <div className="border-t border-border pt-5 flex flex-wrap gap-x-6 gap-y-3">
                          {secondary.map((item) => (
                            <div key={item.label}>
                              <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                              <p className="text-sm font-medium text-foreground">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : null
                    })()}

                    {/* Subjects */}
                    {(selectedBook.assunto1 || selectedBook.assunto2 || selectedBook.assunto3) && (
                      <div className="border-t border-border pt-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                          Assuntos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[selectedBook.assunto1, selectedBook.assunto2, selectedBook.assunto3]
                            .filter(Boolean)
                            .map((a, i) => (
                              <span
                                key={i}
                                className="rounded-md border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
                              >
                                {a}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Observação */}
                    {selectedBook.observacao && (
                      <div className="border-t border-border pt-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Observação
                        </p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {selectedBook.observacao}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-between bg-muted/30">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEditing(false); setSaveError(null) }}
                        disabled={saving}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                      >
                        Cancelar
                      </button>
                      <Button
                        size="sm"
                        onClick={handleEditSave}
                        disabled={saving}
                        className="gap-2"
                      >
                        {saving ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Salvando…
                          </>
                        ) : 'Salvar alterações'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {selectedBook.ativo ? 'Ativo no acervo' : 'Inativo'}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={closeModal}>
                          Fechar
                        </Button>
                        <Button size="sm" onClick={startEditing}>
                          Editar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EditField({
  label,
  name,
  value,
  onChange,
  mono,
  maxLength,
  placeholder,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  mono?: boolean
  maxLength?: number
  placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <Input
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        className={mono ? 'font-mono text-sm' : 'text-sm'}
      />
    </div>
  )
}
