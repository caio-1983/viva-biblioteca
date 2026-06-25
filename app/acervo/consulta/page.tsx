'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'

interface Acervo {
  id: number
  codigoExemplar: string
  titulo: string
  autor: string | null
  classificacao: string | null
  status: string
  ativo: boolean
}

interface AcervoDetalhado {
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
  createdAt: string
  updatedAt: string
}

interface ListResponse {
  data: Acervo[]
  total: number
  pages: number
}

function ConsultaContent() {
  const searchParams = useSearchParams()
  const [acervos, setAcervos] = useState<Acervo[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    titulo: searchParams.get('titulo') || '',
    autor: searchParams.get('autor') || '',
    assunto: searchParams.get('assunto') || '',
  })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [selectedAcervo, setSelectedAcervo] = useState<AcervoDetalhado | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const fetchAcervos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(filters.titulo && { titulo: filters.titulo }),
        ...(filters.autor && { autor: filters.autor }),
        ...(filters.assunto && { assunto: filters.assunto }),
        page: page.toString(),
        limit: '20',
      })

      const response = await fetch(`/api/acervo?${params}`)
      const data: ListResponse = await response.json()
      setAcervos(data.data)
      setTotal(data.total)
      setPages(data.pages)
    } catch (error) {
      console.error('Erro ao buscar acervos:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAcervos()
  }, [fetchAcervos])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este exemplar?')) return

    try {
      const response = await fetch(`/api/acervo/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setAcervos((prev) => prev.filter((a) => a.id !== id))
      }
    } catch (error) {
      console.error('Erro ao deletar:', error)
    }
  }

  const openModal = async (id: number) => {
    setModalLoading(true)
    setSelectedAcervo(null)
    try {
      const response = await fetch(`/api/acervo/${id}`)
      const data: AcervoDetalhado = await response.json()
      setSelectedAcervo(data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => setSelectedAcervo(null)

  const statusLabel: Record<string, string> = {
    DISPONIVEL: 'Disponível',
    EMPRESTADO: 'Emprestado',
    RESERVADO: 'Reservado',
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Consulta de Acervo</h1>
            <p className="text-sm text-muted-foreground">
              Total de exemplares: <span className="font-semibold">{total}</span>
            </p>
          </div>
          <Link href="/acervo/cadastro">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Exemplar
            </Button>
          </Link>
        </div>

        {/* Success Message */}
        {searchParams.get('success') && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✓ Exemplar cadastrado com sucesso!
            </p>
          </div>
        )}

        {/* Filters */}
        <Card className="border-0 bg-card shadow-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Título
                </label>
                <Input
                  name="titulo"
                  placeholder="Buscar por título..."
                  value={filters.titulo}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Autor
                </label>
                <Input
                  name="autor"
                  placeholder="Buscar por autor..."
                  value={filters.autor}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Assunto
                </label>
                <Input
                  name="assunto"
                  placeholder="Buscar por assunto..."
                  value={filters.assunto}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="border-0 bg-card shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Exemplar
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Título
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Autor
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Classificação
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Carregando exemplares...
                    </td>
                  </tr>
                ) : acervos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Nenhum exemplar encontrado
                    </td>
                  </tr>
                ) : (
                  acervos.map((acervo) => (
                    <tr
                      key={acervo.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">
                        {acervo.codigoExemplar}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">
                        <button
                          onClick={() => openModal(acervo.id)}
                          className="text-primary hover:underline text-left truncate block w-full font-medium"
                        >
                          {acervo.titulo}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {acervo.autor || '—'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {acervo.classificacao || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            acervo.status === 'DISPONIVEL'
                              ? 'bg-green-100 text-green-800'
                              : acervo.status === 'EMPRESTADO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {acervo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Visualizar"
                            onClick={() => openModal(acervo.id)}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Deletar"
                            onClick={() => handleDelete(acervo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Detalhes */}
      {(selectedAcervo || modalLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {modalLoading ? (
              <div className="p-10 text-center text-muted-foreground">
                Carregando detalhes...
              </div>
            ) : selectedAcervo && (
              <>
                {/* Modal Header */}
                <div className="flex items-start justify-between p-6 border-b border-border">
                  <div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {selectedAcervo.titulo}
                    </h2>
                    {selectedAcervo.subtitulo && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedAcervo.subtitulo}</p>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="ml-4 p-1 hover:bg-muted rounded-lg transition-colors shrink-0"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Status badge */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedAcervo.status === 'DISPONIVEL'
                          ? 'bg-green-100 text-green-800'
                          : selectedAcervo.status === 'EMPRESTADO'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {statusLabel[selectedAcervo.status] ?? selectedAcervo.status}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Nº {selectedAcervo.codigoExemplar}
                    </span>
                    {selectedAcervo.tombo && (
                      <span className="text-xs text-muted-foreground">
                        Tombo: {selectedAcervo.tombo}
                      </span>
                    )}
                  </div>

                  {/* Identificação */}
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Identificação
                    </h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <Field label="Tipo de Publicação" value={selectedAcervo.tipoPublicacao} />
                      <Field label="ISBN" value={selectedAcervo.isbn} />
                      <Field label="Classificação" value={selectedAcervo.classificacao} />
                      <Field label="Coleção" value={selectedAcervo.colecao} />
                    </div>
                  </section>

                  {/* Publicação */}
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Publicação
                    </h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <Field label="Autor" value={selectedAcervo.autor} />
                      <Field label="Editora" value={selectedAcervo.editora} />
                      <Field label="Edição" value={selectedAcervo.edicao} />
                      <Field
                        label="Ano de Publicação"
                        value={
                          selectedAcervo.anoPublicacao?.toString() ?? null
                        }
                      />
                    </div>
                  </section>

                  {/* Assuntos */}
                  {(selectedAcervo.assunto1 || selectedAcervo.assunto2 || selectedAcervo.assunto3) && (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Assuntos
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {[selectedAcervo.assunto1, selectedAcervo.assunto2, selectedAcervo.assunto3]
                          .filter(Boolean)
                          .map((assunto, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-muted rounded-full text-xs text-foreground"
                            >
                              {assunto}
                            </span>
                          ))}
                      </div>
                    </section>
                  )}

                  {/* Observação */}
                  {selectedAcervo.observacao && (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Observação
                      </h3>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {selectedAcervo.observacao}
                      </p>
                    </section>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={closeModal}>
                    Fechar
                  </Button>
                  <Link href={`/acervo/cadastro?edit=${selectedAcervo.id}`}>
                    <Button size="sm" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground mt-0.5">{value || '—'}</dd>
    </div>
  )
}

export default function ConsultaAcervoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <ConsultaContent />
    </Suspense>
  )
}
