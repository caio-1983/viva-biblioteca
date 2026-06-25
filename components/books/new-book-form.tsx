'use client'

import { useState, useEffect, useRef } from 'react'
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
  Minus,
  Plus as PlusIcon,
  X,
  BookCopy,
  ArrowRight,
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
  anoPublicacao: string
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
  anoPublicacao: '',
  tombo: '',
  assunto1: '',
  assunto2: '',
  assunto3: '',
  colecao: '',
  observacao: '',
}

function MetaField({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  if (!value) return null
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 truncate text-xs text-zinc-700 dark:text-zinc-300',
          mono && 'font-mono'
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function NewBookForm({ onSuccess, onCancel }: NewBookFormProps) {
  const [formData, setFormData] = useState<FormFields>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [quantidadeExemplares, setQuantidadeExemplares] = useState(1)
  const [nextId, setNextId] = useState<number | null>(null)

  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (type: 'error' | 'success', message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ type, message })
    setToastVisible(true)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 4500)
  }

  const dismissToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastVisible(false)
  }

  useEffect(() => {
    if (!toastVisible && toast) {
      const t = setTimeout(() => setToast(null), 350)
      return () => clearTimeout(t)
    }
  }, [toastVisible, toast])

  useEffect(() => {
    if (!showConfirmModal) return
    setNextId(null)
    fetch('/api/books/next-id')
      .then((r) => r.json())
      .then((data) => setNextId(data.nextId ?? null))
      .catch(() => setNextId(null))
  }, [showConfirmModal])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFormData(EMPTY_FORM)
    onCancel?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo.trim()) {
      showToast('error', 'Título é obrigatório.')
      return
    }
    if (!formData.assunto1.trim()) {
      showToast('error', 'Assunto 1 é obrigatório.')
      return
    }

    setQuantidadeExemplares(1)
    setShowConfirmModal(true)
  }

  const handleConfirm = async () => {
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
          anoPublicacao: formData.anoPublicacao || null,
          tombo: formData.tombo || null,
          assunto1: formData.assunto1.trim(),
          assunto2: formData.assunto2 || null,
          assunto3: formData.assunto3 || null,
          colecao: formData.colecao || null,
          observacao: formData.observacao || null,
          quantidade: quantidadeExemplares,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao cadastrar título')
      }

      setShowConfirmModal(false)
      showToast('success', 'Título cadastrado com sucesso!')
      setFormData(EMPTY_FORM)

      setTimeout(() => {
        onSuccess?.()
      }, 2500)
    } catch (err) {
      setShowConfirmModal(false)
      showToast('error', err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const hasExtraFields =
    formData.isbn ||
    formData.classificacao ||
    formData.edicao ||
    formData.editora ||
    formData.anoPublicacao ||
    formData.tombo ||
    formData.assunto1 ||
    formData.assunto2 ||
    formData.assunto3 ||
    formData.colecao ||
    formData.observacao

  const chipCount = Math.min(quantidadeExemplares, 5)
  const extraChips = quantidadeExemplares - chipCount

  return (
    <>
      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <>
          <style>{`
            @keyframes _mfade  { from{opacity:0}                                       to{opacity:1} }
            @keyframes _mslide { from{opacity:0;transform:scale(0.96) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
            ._mb { animation: _mfade  0.18s ease-out both }
            ._mp { animation: _mslide 0.24s cubic-bezier(0.16,1,0.3,1) 0.04s both }
          `}</style>

          {/* Backdrop */}
          <div
            className="_mb fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
            style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(4px)' }}
          >
            {/* Click-outside closes */}
            <div
              className="absolute inset-0"
              onClick={() => !loading && setShowConfirmModal(false)}
            />

            {/* Panel */}
            <div
              className="_mp relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] sm:max-h-[84vh] sm:max-w-[520px] sm:rounded-2xl bg-white dark:bg-zinc-900"
              style={{
                boxShadow:
                  '0 32px 72px -16px rgba(0,0,0,0.38), 0 0 0 1px rgba(0,0,0,0.07)',
              }}
            >
              {/* Mobile drag handle */}
              <div className="mx-auto mb-1 mt-3 h-1 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />

              {/* ── Header ── */}
              <div className="flex shrink-0 items-center gap-3.5 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(180,83,9,0.14)' }}
                >
                  <BookCopy className="h-[18px] w-[18px] text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                    Confirmar Cadastro de Título
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    Revise os dados e defina a quantidade de exemplares
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Scrollable body ── */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-3 p-5">

                  {/* Book identity card */}
                  <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
                    {/* Identity section */}
                    <div className="bg-zinc-50/80 px-4 py-4 dark:bg-zinc-800/50">
                      {formData.tipoPublicacao && (
                        <span
                          className="mb-2.5 inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          style={{ boxShadow: 'inset 0 0 0 1px rgba(180,83,9,0.14)' }}
                        >
                          {formData.tipoPublicacao}
                        </span>
                      )}
                      <h3 className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                        {formData.titulo}
                      </h3>
                      {formData.subtitulo && (
                        <p className="mt-0.5 text-sm leading-snug text-zinc-500 dark:text-zinc-400">
                          {formData.subtitulo}
                        </p>
                      )}
                      {formData.autor && (
                        <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                          {formData.autor}
                        </p>
                      )}
                    </div>

                    {/* Metadata grid */}
                    {hasExtraFields && (
                      <div className="border-t border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <MetaField label="ISBN" value={formData.isbn} mono />
                          <MetaField label="Classificação" value={formData.classificacao} mono />
                          <MetaField label="Edição" value={formData.edicao} />
                          <MetaField label="Editora" value={formData.editora} />
                          <MetaField label="Ano" value={formData.anoPublicacao} />
                          <MetaField label="Tombo" value={formData.tombo} mono />
                          <MetaField label="Assunto 1" value={formData.assunto1} />
                          <MetaField label="Assunto 2" value={formData.assunto2} />
                          <MetaField label="Assunto 3" value={formData.assunto3} />
                          <MetaField label="Coleção" value={formData.colecao} />
                        </div>
                        {formData.observacao && (
                          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              Observação
                            </p>
                            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                              {formData.observacao}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Quantity selector — THE HERO ── */}
                  <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="bg-zinc-50/80 px-4 pb-3 pt-3.5 dark:bg-zinc-800/50">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Número de Exemplares
                      </p>
                    </div>
                    <div className="bg-white px-6 pb-5 pt-4 dark:bg-zinc-900/60">
                      {/* Counter */}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setQuantidadeExemplares((q) => Math.max(1, q - 1))}
                          disabled={loading || quantidadeExemplares <= 1}
                          className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:border-amber-300 hover:text-amber-600 hover:shadow active:scale-95 disabled:pointer-events-none disabled:opacity-25 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          aria-label="Diminuir"
                        >
                          <Minus className="h-[18px] w-[18px]" />
                        </button>

                        <div className="select-none text-center">
                          <span className="block text-[72px] font-black tabular-nums leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
                            {quantidadeExemplares}
                          </span>
                          <span className="mt-1.5 block text-xs font-medium text-zinc-400 dark:text-zinc-500">
                            {quantidadeExemplares === 1 ? 'exemplar' : 'exemplares'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setQuantidadeExemplares((q) => Math.min(99, q + 1))}
                          disabled={loading || quantidadeExemplares >= 99}
                          className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:border-amber-300 hover:text-amber-600 hover:shadow active:scale-95 disabled:pointer-events-none disabled:opacity-25 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          aria-label="Aumentar"
                        >
                          <PlusIcon className="h-[18px] w-[18px]" />
                        </button>
                      </div>

                      {/* Exemplar chip preview */}
                      <div className="mt-5 flex flex-wrap items-center gap-1.5">
                        {Array.from({ length: chipCount }, (_, i) => {
                          const label = nextId != null
                            ? `EX${String(nextId + i).padStart(6, '0')}`
                            : 'EX······'
                          return (
                            <span
                              key={i}
                              className={cn(
                                'inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-all duration-300',
                                nextId != null
                                  ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500'
                              )}
                            >
                              {label}
                            </span>
                          )
                        })}
                        {extraChips > 0 && (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            +{extraChips} mais
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                        {nextId != null
                          ? 'Prévia dos números reservados — confirmados ao cadastrar'
                          : 'Calculando números disponíveis...'}
                      </p>

                      {quantidadeExemplares > 1 && formData.tombo && (
                        <div className="mt-3.5 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-900/20">
                          <span className="shrink-0 text-amber-500">⚠</span>
                          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                            O Tombo <span className="font-mono font-semibold">"{formData.tombo}"</span> será
                            compartilhado entre todos os {quantidadeExemplares} exemplares.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Footer ── */}
              <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-white/90 px-5 py-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="px-1 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-700 disabled:opacity-40 dark:hover:text-zinc-200"
                >
                  Voltar
                </button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="h-10 gap-2 bg-amber-600 px-5 font-semibold text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
                  style={{ boxShadow: '0 1px 3px rgba(180,83,9,0.28), 0 1px 2px rgba(180,83,9,0.18)' }}
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      Cadastrar {quantidadeExemplares} Exemplar{quantidadeExemplares !== 1 ? 'es' : ''}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Floating Toast ── */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            'fixed bottom-6 right-6 z-[300] flex w-full max-w-[22rem] items-start gap-3.5 rounded-2xl px-5 py-4 backdrop-blur-md transition-all duration-300 ease-out',
            toastVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-4 opacity-0 pointer-events-none',
            toast.type === 'error'
              ? 'border border-red-200/70 bg-white/95 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.14),0_0_0_1px_rgba(220,38,38,0.08)] dark:border-red-800/30 dark:bg-zinc-900/95'
              : 'border border-emerald-200/70 bg-white/95 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.14),0_0_0_1px_rgba(16,185,129,0.08)] dark:border-emerald-800/30 dark:bg-zinc-900/95'
          )}
        >
          <div className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
            toast.type === 'error'
              ? 'bg-red-100 dark:bg-red-950/60'
              : 'bg-emerald-100 dark:bg-emerald-950/60'
          )}>
            {toast.type === 'error'
              ? <AlertCircle className="h-[17px] w-[17px] text-red-600 dark:text-red-400" />
              : <CheckCircle2 className="h-[17px] w-[17px] text-emerald-600 dark:text-emerald-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-[10px] font-bold uppercase tracking-widest',
              toast.type === 'error' ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
            )}>
              {toast.type === 'error' ? 'Atenção' : 'Sucesso'}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-zinc-800 dark:text-zinc-200">{toast.message}</p>
          </div>
          <button
            onClick={dismissToast}
            className="mt-0.5 shrink-0 rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">

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

                <div className="space-y-1.5">
                  <label htmlFor="isbn" className="text-sm font-medium text-foreground">ISBN</label>
                  <Input id="isbn" name="isbn" value={formData.isbn} onChange={handleChange} placeholder="978-85-00000-00-0" disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="classificacao" className="text-sm font-medium text-foreground">
                    Classificação{' '}<span className="text-red-500" aria-label="obrigatório">*</span>
                  </label>
                  <Input id="classificacao" name="classificacao" value={formData.classificacao} onChange={handleChange} placeholder="Ex: 500, BIO, 700.5" disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="titulo" className="text-sm font-medium text-foreground">
                    Título{' '}<span className="text-red-500" aria-label="obrigatório">*</span>
                  </label>
                  <Input id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Título do livro" required disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subtitulo" className="text-sm font-medium text-foreground">Subtítulo</label>
                  <Input id="subtitulo" name="subtitulo" value={formData.subtitulo} onChange={handleChange} placeholder="Subtítulo (opcional)" disabled={loading} />
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
                <div className="space-y-1.5">
                  <label htmlFor="autor" className="text-sm font-medium text-foreground">Autor</label>
                  <Input id="autor" name="autor" value={formData.autor} onChange={handleChange} placeholder="Nome do autor" disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edicao" className="text-sm font-medium text-foreground">Edição</label>
                  <Input id="edicao" name="edicao" value={formData.edicao} onChange={handleChange} placeholder="Ex: 3ª edição" disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="editora" className="text-sm font-medium text-foreground">Editora</label>
                  <Input id="editora" name="editora" value={formData.editora} onChange={handleChange} placeholder="Nome da editora" disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="anoPublicacao" className="text-sm font-medium text-foreground">Ano de Publicação</label>
                  <Input id="anoPublicacao" name="anoPublicacao" type="text" inputMode="numeric" maxLength={4} value={formData.anoPublicacao} onChange={handleChange} placeholder="Ex: 2024" disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tombo" className="text-sm font-medium text-foreground">Tombo</label>
                  <Input id="tombo" name="tombo" value={formData.tombo} onChange={handleChange} placeholder="Número de tombo" disabled={loading} />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Assuntos e Observações */}
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
                <div className="space-y-1.5">
                  <label htmlFor="assunto1" className="text-sm font-medium text-foreground">
                    Assunto 1{' '}<span className="text-red-500" aria-label="obrigatório">*</span>
                  </label>
                  <Input id="assunto1" name="assunto1" value={formData.assunto1} onChange={handleChange} placeholder="Assunto principal" required disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="assunto2" className="text-sm font-medium text-foreground">Assunto 2</label>
                  <Input id="assunto2" name="assunto2" value={formData.assunto2} onChange={handleChange} placeholder="Assunto secundário" disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="assunto3" className="text-sm font-medium text-foreground">Assunto 3</label>
                  <Input id="assunto3" name="assunto3" value={formData.assunto3} onChange={handleChange} placeholder="Assunto terciário" disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="colecao" className="text-sm font-medium text-foreground">Coleção</label>
                  <Input id="colecao" name="colecao" value={formData.colecao} onChange={handleChange} placeholder="Nome da coleção" disabled={loading} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="observacao" className="text-sm font-medium text-foreground">Observação</label>
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

          {/* Info automática */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Campos automáticos: </span>
            O{' '}
            <span className="font-mono font-medium text-foreground">Número de Exemplar</span>
            {' '}(EX000001, EX000002...) e o Status (DISPONÍVEL) são gerados automaticamente pelo sistema.
          </div>

        </div>
      </form>
    </>
  )
}
