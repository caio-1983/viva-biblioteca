'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  BookMarked,
  PenLine,
  Tag,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface NewBookFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormFields {
  tipoPublicacao: string
  isbn: string
  classificacao: string
  titulo: string
  subtitulo: string
  autor: string
  edicao: string
  editora: string
  dataPublicacao: string
  tombo: string
  assunto1: string
  assunto2: string
  assunto3: string
  colecao: string
  observacao: string
}

const TIPO_OPTIONS = [
  'Livro',
  'Periódico',
  'Material Didático',
  'Audiovisual',
  'Outros',
]

const EMPTY_FORM: FormFields = {
  tipoPublicacao: 'Livro',
  isbn: '',
  classificacao: '',
  titulo: '',
  subtitulo: '',
  autor: '',
  edicao: '',
  editora: '',
  dataPublicacao: '',
  tombo: '',
  assunto1: '',
  assunto2: '',
  assunto3: '',
  colecao: '',
  observacao: '',
}

export function NewBookForm({ onSuccess, onCancel }: NewBookFormProps) {
  const [formData, setFormData] = useState<FormFields>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFormData(EMPTY_FORM)
    setError(null)
    onCancel?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.titulo.trim()) {
      setError('Título é obrigatório.')
      return
    }
    if (!formData.assunto1.trim()) {
      setError('Assunto 1 é obrigatório.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPublicacao: formData.tipoPublicacao || null,
          isbn: formData.isbn || null,
          classificacao: formData.classificacao || null,
          titulo: formData.titulo.trim(),
          subtitulo: formData.subtitulo || null,
          autor: formData.autor || null,
          edicao: formData.edicao || null,
          editora: formData.editora || null,
          dataPublicacao: formData.dataPublicacao || null,
          tombo: formData.tombo || null,
          assunto1: formData.assunto1.trim(),
          assunto2: formData.assunto2 || null,
          assunto3: formData.assunto3 || null,
          colecao: formData.colecao || null,
          observacao: formData.observacao || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao cadastrar título')
      }

      setSuccess(true)
      setFormData(EMPTY_FORM)

      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
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

        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Título cadastrado com sucesso!</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">
              Cadastro de Novo Título
            </h2>
            <p className="text-sm text-muted-foreground">
              Preencha os dados do exemplar para incluir no acervo
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleReset}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Cadastrando...' : 'Cadastrar Título'}
            </Button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

          {/* Card 1: Identificação */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <BookMarked className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Identificação</CardTitle>
                  <CardDescription>Dados principais do título</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Tipo de Publicação */}
              <div className="space-y-1.5">
                <label htmlFor="tipoPublicacao" className="text-sm font-medium text-foreground">
                  Tipo de Publicação
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TIPO_OPTIONS.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      disabled={loading}
                      onClick={() => setFormData((p) => ({ ...p, tipoPublicacao: tipo }))}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap',
                        formData.tipoPublicacao === tipo
                          ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'border-border bg-background text-muted-foreground hover:border-amber-300 hover:text-foreground'
                      )}
                      aria-pressed={formData.tipoPublicacao === tipo}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* ISBN */}
              <div className="space-y-1.5">
                <label htmlFor="isbn" className="text-sm font-medium text-foreground">
                  ISBN
                </label>
                <Input
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="978-85-00000-00-0"
                  disabled={loading}
                />
              </div>

              {/* Classificação */}
              <div className="space-y-1.5">
                <label htmlFor="classificacao" className="text-sm font-medium text-foreground">
                  Classificação{' '}
                  <span className="text-red-500" aria-label="obrigatório">*</span>
                </label>
                <Input
                  id="classificacao"
                  name="classificacao"
                  value={formData.classificacao}
                  onChange={handleChange}
                  placeholder="Ex: 500, BIO, 700.5"
                  disabled={loading}
                />
              </div>

              {/* Título */}
              <div className="space-y-1.5">
                <label htmlFor="titulo" className="text-sm font-medium text-foreground">
                  Título{' '}
                  <span className="text-red-500" aria-label="obrigatório">*</span>
                </label>
                <Input
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Título do livro"
                  required
                  disabled={loading}
                />
              </div>

              {/* Subtítulo */}
              <div className="space-y-1.5">
                <label htmlFor="subtitulo" className="text-sm font-medium text-foreground">
                  Subtítulo
                </label>
                <Input
                  id="subtitulo"
                  name="subtitulo"
                  value={formData.subtitulo}
                  onChange={handleChange}
                  placeholder="Subtítulo (opcional)"
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Autoria e Edição */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <PenLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Autoria e Edição</CardTitle>
                  <CardDescription>Informações de publicação</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Autor */}
              <div className="space-y-1.5">
                <label htmlFor="autor" className="text-sm font-medium text-foreground">
                  Autor
                </label>
                <Input
                  id="autor"
                  name="autor"
                  value={formData.autor}
                  onChange={handleChange}
                  placeholder="Nome do autor"
                  disabled={loading}
                />
              </div>

              {/* Edição */}
              <div className="space-y-1.5">
                <label htmlFor="edicao" className="text-sm font-medium text-foreground">
                  Edição
                </label>
                <Input
                  id="edicao"
                  name="edicao"
                  value={formData.edicao}
                  onChange={handleChange}
                  placeholder="Ex: 3ª edição"
                  disabled={loading}
                />
              </div>

              {/* Editora */}
              <div className="space-y-1.5">
                <label htmlFor="editora" className="text-sm font-medium text-foreground">
                  Editora
                </label>
                <Input
                  id="editora"
                  name="editora"
                  value={formData.editora}
                  onChange={handleChange}
                  placeholder="Nome da editora"
                  disabled={loading}
                />
              </div>

              {/* Data de Publicação */}
              <div className="space-y-1.5">
                <label htmlFor="dataPublicacao" className="text-sm font-medium text-foreground">
                  Data de Publicação
                </label>
                <Input
                  id="dataPublicacao"
                  name="dataPublicacao"
                  type="date"
                  value={formData.dataPublicacao}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Tombo */}
              <div className="space-y-1.5">
                <label htmlFor="tombo" className="text-sm font-medium text-foreground">
                  Tombo
                </label>
                <Input
                  id="tombo"
                  name="tombo"
                  value={formData.tombo}
                  onChange={handleChange}
                  placeholder="Número de tombo"
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Classificação e Observações */}
          <Card className="md:col-span-2 xl:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                  <Tag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Assuntos e Observações</CardTitle>
                  <CardDescription>Indexação e informações extras</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Assunto 1 */}
              <div className="space-y-1.5">
                <label htmlFor="assunto1" className="text-sm font-medium text-foreground">
                  Assunto 1{' '}
                  <span className="text-red-500" aria-label="obrigatório">*</span>
                </label>
                <Input
                  id="assunto1"
                  name="assunto1"
                  value={formData.assunto1}
                  onChange={handleChange}
                  placeholder="Assunto principal"
                  required
                  disabled={loading}
                />
              </div>

              {/* Assunto 2 */}
              <div className="space-y-1.5">
                <label htmlFor="assunto2" className="text-sm font-medium text-foreground">
                  Assunto 2
                </label>
                <Input
                  id="assunto2"
                  name="assunto2"
                  value={formData.assunto2}
                  onChange={handleChange}
                  placeholder="Assunto secundário"
                  disabled={loading}
                />
              </div>

              {/* Assunto 3 */}
              <div className="space-y-1.5">
                <label htmlFor="assunto3" className="text-sm font-medium text-foreground">
                  Assunto 3
                </label>
                <Input
                  id="assunto3"
                  name="assunto3"
                  value={formData.assunto3}
                  onChange={handleChange}
                  placeholder="Assunto terciário"
                  disabled={loading}
                />
              </div>

              {/* Coleção */}
              <div className="space-y-1.5">
                <label htmlFor="colecao" className="text-sm font-medium text-foreground">
                  Coleção
                </label>
                <Input
                  id="colecao"
                  name="colecao"
                  value={formData.colecao}
                  onChange={handleChange}
                  placeholder="Nome da coleção"
                  disabled={loading}
                />
              </div>

              {/* Observação */}
              <div className="space-y-1.5">
                <label htmlFor="observacao" className="text-sm font-medium text-foreground">
                  Observação
                </label>
                <textarea
                  id="observacao"
                  name="observacao"
                  value={formData.observacao}
                  onChange={handleChange}
                  placeholder="Observações sobre o exemplar..."
                  disabled={loading}
                  rows={3}
                  className="flex min-h-20 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Campos automáticos — informativo */}
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Campos automáticos: </span>
          Número do Exemplar (EX000001) e Status (DISPONÍVEL) são gerados automaticamente pelo sistema.
        </div>

      </div>
    </form>
  )
}
