'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { X, RotateCcw, BookOpen, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Emprestimo {
  id: number
  exemplarId: number
  dataEmprestimo: string
  dataPrevistaDevolucao: string
  dataDevolucao: string | null
  status: string
  titulo: string
  autor: string | null
  codigoExemplar: string
}

interface QuickReturnModalProps {
  userId: number
  userName: string
  numeroCadastro: string
  onClose: () => void
}

function formatDate(str: string): string {
  return new Date(str + (str.includes('T') ? '' : 'T12:00:00'))
    .toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function calcDiasAtraso(dataPrevista: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const prevista = new Date(dataPrevista + 'T12:00:00')
  return Math.max(0, Math.ceil((hoje.getTime() - prevista.getTime()) / 86_400_000))
}

export function QuickReturnModal({ userId, userName, numeroCadastro, onClose }: QuickReturnModalProps) {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([])
  const [loading, setLoading] = useState(true)
  const [returning, setReturning] = useState<number | null>(null)
  const [returned, setReturned] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch(`/api/usuarios/${userId}/emprestimos`)
      .then((r) => r.json())
      .then((data: Emprestimo[]) =>
        setEmprestimos(Array.isArray(data) ? data.filter((e) => e.status === 'ATIVO') : [])
      )
      .catch(() => setEmprestimos([]))
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleDevolver = async (emprestimo: Emprestimo) => {
    setReturning(emprestimo.id)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emprestimoId: emprestimo.id,
          exemplarId: emprestimo.exemplarId,
        }),
      })

      if (res.ok) {
        setReturned((prev) => new Set([...prev, emprestimo.id]))
      }
    } finally {
      setReturning(null)
    }
  }

  const ativos = emprestimos.filter((e) => !returned.has(e.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-lg flex-col rounded-2xl border border-border bg-background shadow-2xl max-h-[80vh]">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
              <RotateCcw className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground leading-tight">Devolução Rápida</h2>
              <p className="text-xs text-muted-foreground">
                {userName} · <span className="font-mono">{numeroCadastro}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : ativos.length === 0 && returned.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum empréstimo ativo</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Este usuário não possui livros para devolver
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Itens já devolvidos nesta sessão */}
              {emprestimos.filter((e) => returned.has(e.id)).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/50 dark:bg-green-900/20"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-green-700 dark:text-green-300">{e.titulo}</p>
                    <p className="font-mono text-xs text-green-600/70 dark:text-green-400/60">{e.codigoExemplar} · Devolvido</p>
                  </div>
                </div>
              ))}

              {/* Itens ainda ativos */}
              {ativos.map((e) => {
                const diasAtraso = calcDiasAtraso(e.dataPrevistaDevolucao)
                const atrasado = diasAtraso > 0
                const isReturning = returning === e.id

                return (
                  <div
                    key={e.id}
                    className={cn(
                      'flex items-start gap-4 rounded-xl border p-4',
                      atrasado
                        ? 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-900/10'
                        : 'border-border bg-card'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm text-foreground">{e.titulo}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{e.codigoExemplar}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>Empréstimo: {formatDate(e.dataEmprestimo)}</span>
                        <span>Previsto: {formatDate(e.dataPrevistaDevolucao)}</span>
                      </div>
                      <div className={cn(
                        'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        atrasado
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      )}>
                        {atrasado
                          ? <><AlertTriangle className="h-3 w-3" />{diasAtraso} dia{diasAtraso !== 1 ? 's' : ''} de atraso</>
                          : <><Clock className="h-3 w-3" />No prazo</>
                        }
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isReturning}
                      onClick={() => handleDevolver(e)}
                      className="shrink-0 gap-1.5 bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                      <RotateCcw className={cn('h-3.5 w-3.5', isReturning && 'animate-spin')} />
                      {isReturning ? 'Devolvendo...' : 'Devolver'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex justify-end">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}
