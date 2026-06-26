'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Search, Users, Mail, Phone, Calendar, Clock, BookOpen,
  Undo2, RotateCcw, AlertTriangle, CheckCircle2, Loader2,
  ChevronLeft, MoreHorizontal, UserPlus, BookMarked,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KpiCard } from '@/components/ui/kpi-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Modal, ModalCloseButton } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { ActionMenu } from '@/components/ui/action-menu'
import { useToast } from '@/components/ui/toast'

// ─── Types ───────────────────────────────────────────────────────────────────

type LoanStatus = 'ATIVO' | 'ATRASADO' | 'DEVOLVIDO' | 'RENOVADO'

interface Leitor {
  id: number
  numeroCadastro: string
  nomeCompleto: string
  cpf: string | null
  dataNascimento: string | null
  celular: string | null
  email: string | null
  membro: boolean
  ativo: boolean
  createdAt: string
  _count: { emprestimos: number }
}

interface LoanListItem {
  id: number
  status: LoanStatus
  numeroCadastro: string
  titulo: string
  codigoExemplar: string
  dataEmprestimo: string
  dataPrevistaDevolucao: string
  dataDevolucao: string | null
}

interface LoanHistoryItem {
  id: number
  exemplarId: number
  status: LoanStatus
  titulo: string
  autor: string | null
  codigoExemplar: string
  dataEmprestimo: string
  dataPrevistaDevolucao: string
  dataDevolucao: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function fmtDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtShort(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function daysUntil(d: string | Date): number {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const t = new Date(d); t.setHours(0, 0, 0, 0)
  return Math.round((t.getTime() - now.getTime()) / 86400000)
}

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',   'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600', 'from-rose-500 to-rose-600',
  'from-teal-500 to-teal-600',   'from-orange-500 to-orange-600',
]

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

// ─── LeitorListCard ───────────────────────────────────────────────────────────

function LeitorListCard({
  leitor, active, overdue, selected, onClick,
}: {
  leitor: Leitor
  active: number
  overdue: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-75',
        selected ? 'bg-blue-50 ring-1 ring-blue-200/70' : 'hover:bg-slate-50'
      )}
    >
      <div className={cn(
        'size-9 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0',
        avatarColor(leitor.id)
      )}>
        <span className="text-white text-xs font-bold">{initials(leitor.nomeCompleto)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-sm font-medium truncate', selected ? 'text-blue-900' : 'text-slate-800')}>
            {leitor.nomeCompleto}
          </span>
          {overdue > 0 && <span className="size-2 rounded-full bg-red-500 shrink-0 animate-pulse" />}
        </div>
        <span className="text-xs text-slate-400">{leitor.numeroCadastro}</span>
      </div>

      {active > 0 && (
        <span className={cn(
          'shrink-0 text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-5 text-center',
          overdue > 0 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
        )}>
          {active}
        </span>
      )}
    </button>
  )
}

// ─── ActiveLoanCard ───────────────────────────────────────────────────────────

function ActiveLoanCard({
  loan, onReturn,
}: {
  loan: LoanHistoryItem
  onReturn: (loan: LoanHistoryItem) => void
}) {
  const days = daysUntil(loan.dataPrevistaDevolucao)
  const isOverdue = days < 0

  return (
    <Card className="border border-border/60 bg-white shadow-none">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Obra mini-cover */}
          <div className={cn(
            'size-10 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold',
            'bg-gradient-to-br', avatarColor(loan.exemplarId)
          )}>
            {(loan.titulo[0] ?? '?').toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{loan.titulo}</p>
            {loan.autor && <p className="text-xs text-slate-500 truncate">{loan.autor}</p>}
            <p className="text-xs text-slate-400 font-mono mt-0.5">{loan.codigoExemplar}</p>

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>Emprestado {fmtShort(loan.dataEmprestimo)}</span>
              <span className="text-slate-300">·</span>
              <span className={cn(
                'font-medium',
                isOverdue ? 'text-red-600' : days <= 3 ? 'text-amber-600' : 'text-slate-600'
              )}>
                {isOverdue
                  ? `${Math.abs(days)}d em atraso`
                  : days === 0 ? 'Devolução hoje'
                  : `Devolver em ${days}d`
                }
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs opacity-50 cursor-not-allowed"
                disabled
                title="Requer endpoint POST /api/loans/:id/renovar"
              >
                <RotateCcw className="size-3" />
                Renovar
              </Button>
              <Button
                size="sm"
                className={cn(
                  'gap-1.5 text-xs',
                  isOverdue ? 'bg-red-600 hover:bg-red-700' : ''
                )}
                onClick={() => onReturn(loan)}
              >
                <Undo2 className="size-3" />
                Devolver
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── HistoryTimeline ──────────────────────────────────────────────────────────

const STATUS_TIMELINE: Record<LoanStatus, { color: string; label: string; icon: React.ReactNode }> = {
  DEVOLVIDO: { color: 'bg-emerald-500', label: 'Devolvido',  icon: <CheckCircle2 className="size-3.5 text-emerald-600" /> },
  ATIVO:     { color: 'bg-blue-400',    label: 'Ativo',      icon: <BookOpen className="size-3.5 text-blue-600" /> },
  ATRASADO:  { color: 'bg-red-500',     label: 'Em atraso',  icon: <AlertTriangle className="size-3.5 text-red-600" /> },
  RENOVADO:  { color: 'bg-purple-400',  label: 'Renovado',   icon: <RotateCcw className="size-3.5 text-purple-600" /> },
}

function HistoryTimeline({ items }: { items: LoanHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="size-8" />}
        title="Sem histórico"
        description="Nenhum empréstimo registrado para este leitor."
        size="sm"
      />
    )
  }

  return (
    <div className="relative space-y-0">
      {items.map((item, i) => {
        const meta = STATUS_TIMELINE[item.status] ?? STATUS_TIMELINE.ATIVO
        const isLast = i === items.length - 1
        return (
          <div key={item.id} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className={cn('size-2.5 rounded-full mt-1.5 shrink-0', meta.color)} />
              {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1 mb-0" />}
            </div>

            <div className={cn('pb-4 min-w-0 flex-1', isLast && 'pb-0')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 font-medium truncate">{item.titulo}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {item.autor && <span>{item.autor} · </span>}
                    <span className="font-mono">{item.codigoExemplar}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={cn('text-xs font-medium', meta.color === 'bg-emerald-500' ? 'text-emerald-700' : meta.color === 'bg-red-500' ? 'text-red-600' : 'text-slate-500')}>
                    {meta.label}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(item.dataEmprestimo)}</p>
                  {item.dataDevolucao && (
                    <p className="text-xs text-emerald-600">↵ {fmtDate(item.dataDevolucao)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── ReturnModal ──────────────────────────────────────────────────────────────

function ReturnModal({
  loan, open, onClose, onConfirm, submitting,
}: {
  loan: LoanHistoryItem | null
  open: boolean
  onClose: () => void
  onConfirm: () => void
  submitting: boolean
}) {
  if (!loan) return null
  const days = daysUntil(loan.dataPrevistaDevolucao)
  const isOverdue = days < 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmar devolução"
      description={loan.titulo}
      size="sm"
      footer={
        <>
          <ModalCloseButton />
          <Button
            className={cn(isOverdue && 'bg-red-600 hover:bg-red-700')}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Undo2 className="size-4 mr-2" />}
            Confirmar devolução
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="rounded-lg bg-slate-50 p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Exemplar</span>
            <span className="font-mono font-medium">{loan.codigoExemplar}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Emprestado em</span>
            <span>{fmtDate(loan.dataEmprestimo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Previsto para</span>
            <span className={cn(isOverdue ? 'text-red-600 font-medium' : '')}>
              {fmtDate(loan.dataPrevistaDevolucao)}
            </span>
          </div>
        </div>
        {isOverdue && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{Math.abs(days)} dia{Math.abs(days) !== 1 ? 's' : ''} em atraso</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── ReadersWorkspace ─────────────────────────────────────────────────────────

export function ReadersWorkspace() {
  const { toast } = useToast()

  const [leitores, setLeitores]           = useState<Leitor[]>([])
  const [allLoans, setAllLoans]           = useState<LoanListItem[]>([])
  const [dataLoading, setDataLoading]     = useState(true)
  const [dataError, setDataError]         = useState(false)

  const [selectedId, setSelectedId]       = useState<number | null>(null)
  const [history, setHistory]             = useState<LoanHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [search, setSearch]               = useState('')
  const [mobileView, setMobileView]       = useState<'list' | 'profile'>('list')

  const [returnTarget, setReturnTarget]   = useState<LoanHistoryItem | null>(null)
  const [returnSubmitting, setReturnSubmitting] = useState(false)

  // ── Load list data ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setDataLoading(true)
    setDataError(false)
    try {
      const [lRes, loansRes] = await Promise.all([
        fetch('/api/usuarios').then(r => r.json()),
        fetch('/api/loans').then(r => r.json()),
      ])
      setLeitores(Array.isArray(lRes) ? lRes : (lRes.data ?? []))
      const rawLoans = Array.isArray(loansRes) ? loansRes : (loansRes.data ?? [])
      setAllLoans(rawLoans)
    } catch {
      setDataError(true)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Load profile history on select ───────────────────────────────────────

  useEffect(() => {
    if (!selectedId) return
    setHistoryLoading(true)
    fetch(`/api/usuarios/${selectedId}/emprestimos`)
      .then(r => r.json())
      .then((data: LoanHistoryItem[]) => {
        setHistory(Array.isArray(data) ? data : [])
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [selectedId])

  // ── Per-leitor loan summary (from global loans list) ─────────────────────

  const loanSummary = useMemo(() => {
    const map = new Map<string, { active: number; overdue: number }>()
    for (const l of allLoans) {
      if (l.status === 'ATIVO' || l.status === 'ATRASADO') {
        const cur = map.get(l.numeroCadastro) ?? { active: 0, overdue: 0 }
        cur.active++
        if (l.status === 'ATRASADO') cur.overdue++
        map.set(l.numeroCadastro, cur)
      }
    }
    return map
  }, [allLoans])

  // ── Search filter ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leitores
    return leitores.filter(l =>
      l.nomeCompleto.toLowerCase().includes(q) ||
      l.numeroCadastro.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.celular?.includes(q) ||
      l.cpf?.includes(q)
    )
  }, [leitores, search])

  // ── Selected leitor ───────────────────────────────────────────────────────

  const selectedLeitor = useMemo(
    () => leitores.find(l => l.id === selectedId) ?? null,
    [leitores, selectedId]
  )

  function selectLeitor(id: number) {
    setSelectedId(id)
    setMobileView('profile')
    setHistory([])
  }

  // ── Derived from history ──────────────────────────────────────────────────

  const activeLoans = useMemo(
    () => history.filter(e => e.status === 'ATIVO' || e.status === 'ATRASADO'),
    [history]
  )
  const overdueLoans = useMemo(
    () => history.filter(e => e.status === 'ATRASADO'),
    [history]
  )

  // ── Return flow ───────────────────────────────────────────────────────────

  async function confirmReturn() {
    if (!returnTarget) return
    setReturnSubmitting(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emprestimoId: returnTarget.id, exemplarId: returnTarget.exemplarId }),
      })
      if (!res.ok) throw new Error('Erro ao processar devolução')
      setReturnTarget(null)
      toast({ variant: 'success', title: 'Devolução registrada', description: `"${returnTarget.titulo}" devolvido com sucesso.` })
      if (selectedId) {
        fetch(`/api/usuarios/${selectedId}/emprestimos`)
          .then(r => r.json())
          .then((data: LoanHistoryItem[]) => setHistory(Array.isArray(data) ? data : []))
      }
      fetch('/api/loans').then(r => r.json()).then(data => {
        setAllLoans(Array.isArray(data) ? data : (data.data ?? []))
      })
    } catch {
      toast({ variant: 'error', title: 'Falha na devolução', description: 'Não foi possível registrar a devolução. Tente novamente.' })
    } finally {
      setReturnSubmitting(false)
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalActive  = useMemo(() => allLoans.filter(l => l.status === 'ATIVO' || l.status === 'ATRASADO').length, [allLoans])
  const totalOverdue = useMemo(() => allLoans.filter(l => l.status === 'ATRASADO').length, [allLoans])
  const overdueCount = useMemo(() => leitores.filter(l => (loanSummary.get(l.numeroCadastro)?.overdue ?? 0) > 0).length, [leitores, loanSummary])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden -mx-6 -mt-10 md:-mx-10 md:-mt-12">

      {/* ── LEFT: List panel ── */}
      <aside className={cn(
        'w-72 shrink-0 border-r border-border/60 flex flex-col bg-white',
        mobileView === 'profile' ? 'hidden md:flex' : 'flex'
      )}>
        {/* Search */}
        <div className="p-3 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nome, matrícula, e-mail…"
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border/60 text-xs text-slate-500">
          <span>{dataLoading ? '…' : filtered.length} leitor{filtered.length !== 1 ? 'es' : ''}</span>
          {totalActive > 0 && <span className="text-blue-600">{totalActive} ativos</span>}
          {overdueCount > 0 && <span className="text-red-600">{overdueCount} com atraso</span>}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs gap-1 opacity-50 cursor-not-allowed"
            disabled
            title="Requer endpoint POST /api/usuarios — funcionalidade em desenvolvimento"
          >
            <UserPlus className="size-3" />
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </div>
          ) : dataError ? (
            <EmptyState
              icon={<AlertTriangle className="size-7 text-red-400" />}
              title="Erro ao carregar"
              description="Não foi possível buscar os leitores."
              action={<Button size="sm" variant="outline" onClick={loadData}>Tentar novamente</Button>}
              size="sm"
            />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Users className="size-8" />} title="Nenhum leitor" description="Tente outro termo de busca." size="sm" />
          ) : (
            <div className="space-y-0.5">
              {filtered.map(l => {
                const summary = loanSummary.get(l.numeroCadastro) ?? { active: 0, overdue: 0 }
                return (
                  <LeitorListCard
                    key={l.id}
                    leitor={l}
                    active={summary.active}
                    overdue={summary.overdue}
                    selected={selectedId === l.id}
                    onClick={() => selectLeitor(l.id)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT: Profile panel ── */}
      <main className={cn(
        'flex-1 overflow-y-auto bg-slate-50',
        mobileView === 'list' ? 'hidden md:block' : 'block'
      )}>
        {!selectedLeitor ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={<Users className="size-10" />}
              title="Selecione um leitor"
              description="Clique em um leitor na lista para ver o perfil completo."
              size="lg"
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

            {/* ── Mobile back button ── */}
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <ChevronLeft className="size-4" /> Leitores
            </button>

            {/* ── Profile header ── */}
            <div className="bg-white rounded-2xl border border-border/60 p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={cn(
                  'size-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shrink-0 text-white text-lg font-bold',
                  avatarColor(selectedLeitor.id)
                )}>
                  {initials(selectedLeitor.nomeCompleto)}
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{selectedLeitor.nomeCompleto}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono text-sm text-slate-500">{selectedLeitor.numeroCadastro}</span>
                        {selectedLeitor.membro
                          ? <StatusBadge status="disponivel" label="Membro" />
                          : <StatusBadge status="inativo" label="Não membro" />
                        }
                        {overdueLoans.length > 0
                          ? <StatusBadge status="atrasado" label="Com atraso" />
                          : activeLoans.length > 0
                            ? <StatusBadge status="emprestado" label="Ativo" />
                            : <StatusBadge status="disponivel" label="Em dia" />
                        }
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" className="gap-1.5 text-xs" onClick={() => window.dispatchEvent(new CustomEvent('viva:search:open'))}>
                        <BookMarked className="size-3.5" />
                        Novo empréstimo
                      </Button>
                      <ActionMenu
                        trigger={<Button size="sm" variant="outline" className="size-8 p-0"><MoreHorizontal className="size-4" /></Button>}
                        items={[
                          { label: 'Editar cadastro', onClick: () => {} },
                          { label: 'Imprimir carteirinha', onClick: () => {} },
                          { label: 'Inativar leitor', onClick: () => {}, destructive: true },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {selectedLeitor.email && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="size-3.5 shrink-0" />{selectedLeitor.email}
                      </span>
                    )}
                    {selectedLeitor.celular && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="size-3.5 shrink-0" />{selectedLeitor.celular}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="size-3.5 shrink-0" />Cadastro: {fmtDate(selectedLeitor.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overdue warning */}
              {overdueLoans.length > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <AlertTriangle className="size-4 shrink-0" />
                  {overdueLoans.length} empréstimo{overdueLoans.length !== 1 ? 's' : ''} em atraso — verificar antes de novo empréstimo
                </div>
              )}
            </div>

            {/* ── KPI strip ── */}
            {historyLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[0,1,2].map(i => <KpiCard key={i} label="…" value={0} loading />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <KpiCard label="Ativos" value={activeLoans.length} accent={activeLoans.length > 0 ? 'brand' : 'neutral'} icon={<BookOpen className="size-4" />} />
                <KpiCard label="Em atraso" value={overdueLoans.length} accent={overdueLoans.length > 0 ? 'warning' : 'neutral'} icon={<AlertTriangle className="size-4" />} />
                <KpiCard label="Total histórico" value={history.length} icon={<Clock className="size-4" />} />
              </div>
            )}

            {/* ── Active loans ── */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Empréstimos ativos
                {activeLoans.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">{activeLoans.length}</span>}
              </h3>
              {historyLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-slate-400" /></div>
              ) : activeLoans.length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="size-8" />} title="Nenhum empréstimo ativo" description="Este leitor não possui obras emprestadas." size="sm" />
              ) : (
                <div className="space-y-3">
                  {activeLoans.map(loan => (
                    <ActiveLoanCard key={loan.id} loan={loan} onReturn={setReturnTarget} />
                  ))}
                </div>
              )}
            </section>

            {/* ── History timeline ── */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Histórico
                {history.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">{history.length} registros</span>}
              </h3>
              <div className="bg-white rounded-xl border border-border/60 p-4">
                {historyLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-slate-400" /></div>
                ) : (
                  <HistoryTimeline items={[...history].sort((a, b) => new Date(b.dataEmprestimo).getTime() - new Date(a.dataEmprestimo).getTime())} />
                )}
              </div>
            </section>

            {/* ── Observações (placeholder) ── */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Observações</h3>
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-5 text-center">
                <p className="text-sm text-slate-400">Área para observações administrativas</p>
                <p className="text-xs text-slate-300 mt-1">Requer campo <code className="bg-slate-100 px-1 rounded">observacao</code> no model Usuario</p>
              </div>
            </section>

          </div>
        )}
      </main>

      {/* ── Return modal ── */}
      <ReturnModal
        loan={returnTarget}
        open={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        onConfirm={confirmReturn}
        submitting={returnSubmitting}
      />
    </div>
  )
}
