'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { X, BookOpen, CalendarDays, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Emprestimo {
  id: number
  dataEmprestimo: string
  dataPrevistaDevolucao: string
  dataDevolucao: string | null
  status: string
  titulo: string
  autor: string | null
  codigoExemplar: string
}

interface LoanHistoryModalProps {
  userId: number
  userName: string
  numeroCadastro: string
  onClose: () => void
}

function formatDate(str: string | null): string {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function statusInfo(emprestimo: Emprestimo): { label: string; className: string } {
  if (emprestimo.dataDevolucao) {
    return {
      label: 'Devolvido',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    }
  }
  const hoje = new Date()
  const prevista = new Date(emprestimo.dataPrevistaDevolucao)
  if (hoje > prevista) {
    return {
      label: 'Atrasado',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    }
  }
  return {
    label: 'Ativo',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  }
}

export function LoanHistoryModal({ userId, userName, numeroCadastro, onClose }: LoanHistoryModalProps) {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/usuarios/${userId}/emprestimos`)
      .then((r) => r.json())
      .then((data) => setEmprestimos(Array.isArray(data) ? data : []))
      .catch(() => setEmprestimos([]))
      .finally(() => setLoading(false))
  }, [userId])

  // Fechar com Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const ativos = emprestimos.filter((e) => !e.dataDevolucao).length
  const devolvidos = emprestimos.filter((e) => !!e.dataDevolucao).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-background shadow-2xl max-h-[85vh]">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground leading-tight">{userName}</h2>
              <p className="font-mono text-xs text-muted-foreground">{numeroCadastro}</p>
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

        {/* Stats */}
        {!loading && emprestimos.length > 0 && (
          <div className="flex gap-6 border-b border-border px-6 py-3">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold text-foreground">{emprestimos.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Ativos:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{ativos}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Devolvidos:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{devolvidos}</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : emprestimos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum empréstimo registrado</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Este usuário ainda não realizou empréstimos
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {emprestimos.map((e) => {
                const { label, className } = statusInfo(e)
                return (
                  <div
                    key={e.id}
                    className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-sm text-foreground">
                          {e.titulo}
                        </p>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', className)}>
                          {label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {e.autor ?? '—'} · <span className="font-mono">{e.codigoExemplar}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium">Empréstimo:</span>{' '}
                          {formatDate(e.dataEmprestimo)}
                        </span>
                        <span>
                          <span className="font-medium">Previsto:</span>{' '}
                          {formatDate(e.dataPrevistaDevolucao)}
                        </span>
                        {e.dataDevolucao && (
                          <span className="text-green-600 dark:text-green-400">
                            <span className="font-medium">Devolvido:</span>{' '}
                            {formatDate(e.dataDevolucao)}
                          </span>
                        )}
                      </div>
                    </div>
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
