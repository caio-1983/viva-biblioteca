'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { usePageTitle } from '@/components/page-context'
import {
  BookMarked, Undo2, RefreshCw, Search, CheckCircle, AlertTriangle,
  Clock, Check, ChevronRight, ChevronLeft, BookOpen, Users, User,
  RotateCcw, CalendarClock, Info, ArrowLeftRight, BookText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { PageHeader }        from '@/components/ui/page-header'
import { Button }            from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge }       from '@/components/ui/status-badge'
import { Drawer }            from '@/components/ui/drawer'
import { Input }             from '@/components/ui/input'
import { EmptyState }        from '@/components/ui/empty-state'
import { Spinner }           from '@/components/ui/loading-state'

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkspaceTab = 'emprestimo' | 'devolucao' | 'renovacao' | 'reservas'
type WizardStep   = 1 | 2 | 3 | 4

type ExemplarStatus = 'DISPONIVEL' | 'EMPRESTADO' | 'RESERVADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO'

type ExemplarDTO = {
  id: number
  codigoExemplar: string
  tombo: string | null
  observacao: string | null
  status: ExemplarStatus
  ativo: boolean
  obraId: number
  isbn: string | null
  tipoPublicacao: string | null
  classificacao: string | null
  titulo: string
  subtitulo: string | null
  autor: string | null
  edicao: string | null
  editora: string | null
  anoPublicacao: number | null
  assunto1: string | null
  assunto2: string | null
  assunto3: string | null
  colecao: string | null
}

type LoanDTO = {
  id: number
  dataEmprestimo: string
  dataPrevistaDevolucao: string
  dataDevolucao: string | null
  status: 'ATIVO' | 'DEVOLVIDO' | 'ATRASADO' | 'CANCELADO'
  nomeCompleto: string
  numeroCadastro: string
  titulo: string
  codigoExemplar: string
}

type UsuarioDTO = {
  id: number
  numeroCadastro: string
  nomeCompleto: string
  cpf: string | null
  email: string | null
  celular: string | null
  membro: boolean
  ativo: boolean
}

type EmprestimoAtivoDTO = {
  emprestimoId: number
  exemplarId: number
  codigoExemplar: string
  titulo: string
  usuarioId: number
  nomeCompleto: string
  numeroCadastro: string
  dataEmprestimo: string
  dataPrevistaDevolucao: string
  statusEmprestimo: string
}

type ObraCard = {
  obraId: number
  titulo: string
  subtitulo: string | null
  autor: string | null
  isbn: string | null
  classificacao: string | null
  editora: string | null
  anoPublicacao: number | null
  assunto1: string | null
  assunto2: string | null
  assunto3: string | null
  disponiveis: number
  totalExemplares: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function getDueDate14(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().split('T')[0]
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function diffDays(iso: string): number {
  const due = new Date(iso).getTime()
  const now = new Date().setHours(0, 0, 0, 0)
  return Math.floor((now - due) / 86_400_000)
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function groupByObra(exemplares: ExemplarDTO[]): ObraCard[] {
  const map = new Map<number, ObraCard & { _ex: ExemplarDTO[] }>()
  for (const ex of exemplares) {
    if (!map.has(ex.obraId)) {
      map.set(ex.obraId, {
        obraId: ex.obraId,
        titulo: ex.titulo,
        subtitulo: ex.subtitulo,
        autor: ex.autor,
        isbn: ex.isbn,
        classificacao: ex.classificacao,
        editora: ex.editora,
        anoPublicacao: ex.anoPublicacao,
        assunto1: ex.assunto1,
        assunto2: ex.assunto2,
        assunto3: ex.assunto3,
        disponiveis: 0,
        totalExemplares: 0,
        _ex: [],
      })
    }
    const o = map.get(ex.obraId)!
    o.totalExemplares++
    if (ex.status === 'DISPONIVEL') o.disponiveis++
  }
  return Array.from(map.values())
}

// ── ExemplarPickerDrawer ──────────────────────────────────────────────────────

function ExemplarPickerDrawer({ open, onClose, exemplares, current, onSelect }: {
  open: boolean
  onClose: () => void
  exemplares: ExemplarDTO[]
  current: ExemplarDTO | null
  onSelect: (e: ExemplarDTO) => void
}) {
  const [temp, setTemp] = useState<ExemplarDTO | null>(null)

  useEffect(() => {
    if (open) setTemp(current)
  }, [open, current])

  function handleConfirm() {
    if (temp) { onSelect(temp); onClose() }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Alterar Exemplar"
      description={`${exemplares.length} exemplar${exemplares.length === 1 ? '' : 'es'} disponível${exemplares.length === 1 ? '' : 'is'}`}
      width="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!temp}>Confirmar</Button>
        </>
      }
    >
      <div className="space-y-2">
        {exemplares.map(ex => (
          <button
            key={ex.id}
            type="button"
            onClick={() => setTemp(ex)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors',
              temp?.id === ex.id
                ? 'bg-brand-50 border-brand-300'
                : 'bg-white border-border hover:border-brand-200 hover:bg-slate-50'
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold font-mono text-slate-800">{ex.codigoExemplar}</p>
              {ex.tombo && <p className="ds-caption text-slate-400">Tombo {ex.tombo}</p>}
              {ex.observacao && <p className="ds-caption text-slate-500 italic mt-0.5">{ex.observacao}</p>}
            </div>
            {temp?.id === ex.id && <Check className="size-4 text-brand-500 shrink-0" />}
          </button>
        ))}
      </div>
    </Drawer>
  )
}

// ── StepIndicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: WizardStep }) {
  const steps = [
    { n: 1 as WizardStep, label: 'Leitor' },
    { n: 2 as WizardStep, label: 'Obra' },
    { n: 3 as WizardStep, label: 'Exemplar' },
    { n: 4 as WizardStep, label: 'Confirmar' },
  ]
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          {i > 0 && (
            <div className={cn('flex-1 h-px mx-1', s.n <= current ? 'bg-brand-300' : 'bg-border')} />
          )}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className={cn(
              'size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
              s.n < current  ? 'bg-brand-500 text-white' :
              s.n === current ? 'bg-brand-500 text-white ring-4 ring-brand-100' :
              'bg-slate-100 text-slate-400'
            )}>
              {s.n < current ? <Check className="size-3.5" /> : s.n}
            </div>
            <span className={cn(
              'text-[10px] font-medium whitespace-nowrap',
              s.n <= current ? 'text-brand-600' : 'text-slate-400'
            )}>
              {s.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>›</span>}
          {item.href
            ? <Link href={item.href} className="hover:text-slate-600 transition-colors">{item.label}</Link>
            : <span className="text-slate-600">{item.label}</span>
          }
        </span>
      ))}
    </nav>
  )
}

// ── CirculationWorkspace ──────────────────────────────────────────────────────

export function CirculationWorkspace() {
  const { setPageInfo } = usePageTitle()
  const searchParams = useSearchParams()
  useEffect(() => {
    setPageInfo('Circulação', 'Empréstimos, devoluções e renovações')
  }, [setPageInfo])

  // ── Shared data ─────────────────────────────────────────────────────────────
  const [exemplares,  setExemplares]  = useState<ExemplarDTO[]>([])
  const [loans,       setLoans]       = useState<LoanDTO[]>([])
  const [usuarios,    setUsuarios]    = useState<UsuarioDTO[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError,   setDataError]   = useState(false)

  // ── Tab ──────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('emprestimo')

  // ── Wizard (Empréstimo) ──────────────────────────────────────────────────────
  const [wizardStep,       setWizardStep]       = useState<WizardStep>(1)
  const [userQuery,        setUserQuery]        = useState('')
  const [obraQuery,        setObraQuery]        = useState('')
  const [wizardUser,       setWizardUser]       = useState<UsuarioDTO | null>(null)
  const [wizardObra,       setWizardObra]       = useState<ObraCard | null>(null)
  const [wizardExemplar,   setWizardExemplar]   = useState<ExemplarDTO | null>(null)
  const [wizardDueDate,    setWizardDueDate]    = useState(getDueDate14)
  const [drawerOpen,       setDrawerOpen]       = useState(false)
  const [drawerTempEx,     setDrawerTempEx]     = useState<ExemplarDTO | null>(null)
  const [loanSubmitting,   setLoanSubmitting]   = useState(false)
  const [loanError,        setLoanError]        = useState<string | null>(null)
  const [loanSuccess,      setLoanSuccess]      = useState(false)

  // ── Devolução ────────────────────────────────────────────────────────────────
  const [returnQuery,      setReturnQuery]      = useState('')
  const [returnLoading,    setReturnLoading]    = useState(false)
  const [returnFound,      setReturnFound]      = useState<EmprestimoAtivoDTO | null>(null)
  const [returnSearchErr,  setReturnSearchErr]  = useState<string | null>(null)
  const [returnSubmitting, setReturnSubmitting] = useState(false)
  const [returnSuccess,    setReturnSuccess]    = useState(false)

  // ── Renovação ────────────────────────────────────────────────────────────────
  const [renovQuery,      setRenovQuery]      = useState('')
  const [renovSubmitting, setRenovSubmitting] = useState<number | null>(null)
  const [renovSuccess,    setRenovSuccess]    = useState<number | null>(null)
  const [renovError,      setRenovError]      = useState<{ id: number; msg: string } | null>(null)
  const [renovTarget,      setRenovTarget]      = useState<{ id: number; titulo: string; leitor: string; vencimentoAtual: string } | null>(null)
  const [renovNovaData,    setRenovNovaData]    = useState('')
  const [renovObservacao,  setRenovObservacao]  = useState('')

  // ── Load data ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setDataError(false)
    try {
      const opts = signal ? { signal } : {}
      const [acervoRes, loansRes, usuariosRes] = await Promise.all([
        fetch('/api/acervo?limit=500', opts).then(r => r.json()),
        fetch('/api/loans', opts).then(r => r.json()),
        fetch('/api/usuarios', opts).then(r => r.json()),
      ])
      setExemplares((acervoRes.data ?? []) as ExemplarDTO[])
      setLoans(Array.isArray(loansRes) ? loansRes : loansRes.data ?? [])
      setUsuarios(Array.isArray(usuariosRes) ? usuariosRes : usuariosRes.data ?? [])
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      setDataError(true)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    loadData(ctrl.signal)
    return () => ctrl.abort()
  }, [loadData])

  // ── Derived ──────────────────────────────────────────────────────────────────

  const obras = useMemo(() => groupByObra(exemplares), [exemplares])

  const activeByUser = useMemo(() => {
    const map = new Map<string, { active: number; overdue: number }>()
    for (const l of loans) {
      if (l.status === 'ATIVO' || l.status === 'ATRASADO') {
        const cur = map.get(l.numeroCadastro) ?? { active: 0, overdue: 0 }
        cur.active++
        if (l.status === 'ATRASADO') cur.overdue++
        map.set(l.numeroCadastro, cur)
      }
    }
    return map
  }, [loans])

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase()
    if (!q) return usuarios
    const exact = usuarios.filter(u => u.numeroCadastro === userQuery.trim())
    if (exact.length > 0) return exact
    return usuarios.filter(u =>
      u.nomeCompleto.toLowerCase().includes(q) ||
      u.numeroCadastro.includes(q)
    )
  }, [usuarios, userQuery])

  const filteredObras = useMemo(() => {
    const availableObras = obras.filter(o => o.disponiveis > 0)
    const q = obraQuery.trim().toLowerCase()
    if (!q) return availableObras
    return availableObras.filter(o =>
      o.titulo.toLowerCase().includes(q) ||
      (o.autor ?? '').toLowerCase().includes(q) ||
      (o.isbn ?? '').includes(q) ||
      (o.classificacao ?? '').toLowerCase().includes(q) ||
      [o.assunto1, o.assunto2, o.assunto3].some(a => a?.toLowerCase().includes(q))
    )
  }, [obras, obraQuery])

  const availableExemplares = useMemo(() =>
    wizardObra
      ? exemplares
          .filter(e => e.obraId === wizardObra.obraId && e.status === 'DISPONIVEL')
          .sort((a, b) => a.codigoExemplar.localeCompare(b.codigoExemplar))
      : []
  , [exemplares, wizardObra])

  const activeLoans = useMemo(() =>
    loans.filter(l => l.status === 'ATIVO' || l.status === 'ATRASADO')
  , [loans])

  const filteredActiveLoans = useMemo(() => {
    const q = renovQuery.trim().toLowerCase()
    if (!q) return activeLoans
    return activeLoans.filter(l =>
      l.nomeCompleto.toLowerCase().includes(q) ||
      l.numeroCadastro.includes(q) ||
      l.titulo.toLowerCase().includes(q) ||
      l.codigoExemplar.toLowerCase().includes(q)
    )
  }, [activeLoans, renovQuery])

  // ── Pre-select leitor from URL param (e.g. coming from /members) ────────────

  useEffect(() => {
    const leitorId = searchParams.get('leitorId')
    if (!leitorId || usuarios.length === 0 || wizardUser) return
    const user = usuarios.find(u => u.id === Number(leitorId))
    if (user) selectUser(user)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarios, searchParams])

  // ── Wizard: auto-select exemplar when obra is chosen ─────────────────────────

  useEffect(() => {
    if (wizardObra && availableExemplares.length > 0) {
      setWizardExemplar(availableExemplares[0])
    }
  }, [wizardObra, availableExemplares])

  // ── Wizard mutations ─────────────────────────────────────────────────────────

  function selectUser(u: UsuarioDTO) {
    setWizardUser(u)
    setUserQuery('')
    setObraQuery('')
    setWizardStep(2)
  }

  function selectObra(o: ObraCard) {
    setWizardObra(o)
    setWizardExemplar(null)
    setObraQuery('')
    setWizardStep(3)
  }

  function goBack() {
    setLoanError(null)
    if (wizardStep === 2) { setWizardStep(1); setUserQuery('') }
    else if (wizardStep === 3) { setWizardStep(2); setWizardObra(null); setWizardExemplar(null) }
    else if (wizardStep === 4) { setWizardStep(3) }
  }

  function resetWizard() {
    setWizardStep(1); setWizardUser(null); setWizardObra(null)
    setWizardExemplar(null); setUserQuery(''); setObraQuery('')
    setWizardDueDate(getDueDate14()); setLoanError(null); setLoanSuccess(false)
  }

  async function submitLoan() {
    if (!wizardUser || !wizardExemplar) return
    setLoanSubmitting(true); setLoanError(null)
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: wizardUser.id,
          exemplarId: wizardExemplar.id,
          dataPrevistaDevolucao: new Date(wizardDueDate + 'T23:59:59').toISOString(),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao registrar empréstimo')
      }
      setLoanSuccess(true)
      await loadData()
    } catch (e) {
      setLoanError(e instanceof Error ? e.message : 'Erro ao registrar empréstimo')
    } finally {
      setLoanSubmitting(false)
    }
  }

  // ── Devolução mutations ──────────────────────────────────────────────────────

  async function searchReturn(e: React.FormEvent) {
    e.preventDefault()
    const code = returnQuery.trim()
    if (!code) return
    setReturnLoading(true); setReturnFound(null); setReturnSearchErr(null); setReturnSuccess(false)
    try {
      const res = await fetch(`/api/returns?exemplar=${encodeURIComponent(code)}`)
      if (!res.ok) throw new Error('Empréstimo ativo não localizado para este código')
      const data = await res.json()
      setReturnFound(data)
    } catch (e) {
      setReturnSearchErr(e instanceof Error ? e.message : 'Erro ao buscar empréstimo')
    } finally {
      setReturnLoading(false)
    }
  }

  async function submitReturn() {
    if (!returnFound) return
    setReturnSubmitting(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emprestimoId: returnFound.emprestimoId,
          exemplarId: returnFound.exemplarId,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao registrar devolução')
      }
      setReturnSuccess(true)
      setReturnFound(null)
      await loadData()
    } catch (e) {
      setReturnSearchErr(e instanceof Error ? e.message : 'Erro ao registrar devolução')
    } finally {
      setReturnSubmitting(false)
    }
  }

  // ── Renovar empréstimo ────────────────────────────────────────────────────────

  function openRenovarDialog(loan: LoanDTO) {
    const base = new Date(loan.dataPrevistaDevolucao) > new Date()
      ? loan.dataPrevistaDevolucao
      : getTodayStr()
    const d = new Date(base)
    d.setDate(d.getDate() + 14)
    setRenovNovaData(d.toISOString().split('T')[0])
    setRenovObservacao('')
    setRenovTarget({ id: loan.id, titulo: loan.titulo, leitor: loan.nomeCompleto, vencimentoAtual: loan.dataPrevistaDevolucao })
    setRenovError(null)
  }

  async function handleRenovar(loanId: number, dataPrevistaDevolucao: string) {
    setRenovSubmitting(loanId)
    setRenovError(null)
    setRenovSuccess(null)
    try {
      const res = await fetch(`/api/loans/${loanId}/renovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrevistaDevolucao, ...(renovObservacao.trim() ? { observacao: renovObservacao.trim() } : {}) }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao renovar')
      }
      setRenovTarget(null)
      setRenovSuccess(loanId)
      await loadData()
      setTimeout(() => setRenovSuccess(null), 3000)
    } catch (e) {
      setRenovError({ id: loanId, msg: e instanceof Error ? e.message : 'Erro ao renovar' })
    } finally {
      setRenovSubmitting(null)
    }
  }

  // ── Loading / Error states ────────────────────────────────────────────────────

  if (dataLoading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Circulação"
          description="Empréstimos, devoluções e renovações"
          breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', href: '/' }]} />}
        />
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Circulação"
          description="Empréstimos, devoluções e renovações"
          breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', href: '/' }]} />}
        />
        <EmptyState
          icon={<AlertTriangle className="size-8 text-slate-200" />}
          title="Não foi possível carregar os dados"
          description="Verifique a conexão e tente novamente."
          action={<Button onClick={() => loadData()}>Tentar novamente</Button>}
        />
      </div>
    )
  }

  // ── TAB CONTENT: Empréstimo ──────────────────────────────────────────────────

  function renderEmprestimo() {
    // ── Successo ─────────────────────────────────────────────────────────────
    if (loanSuccess && wizardUser && wizardExemplar && wizardObra) {
      return (
        <div className="flex flex-col items-center text-center py-12 space-y-6 max-w-md mx-auto">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="size-8 text-green-500" />
          </div>
          <div>
            <h3 className="ds-section-title text-slate-800">Empréstimo registrado!</h3>
            <p className="ds-body text-slate-500 mt-1">
              <span className="font-medium">{wizardExemplar.codigoExemplar}</span>
              {' '}emprestado para{' '}
              <span className="font-medium">{wizardUser.nomeCompleto}</span>
            </p>
            <p className="ds-caption text-slate-400 mt-1">
              Devolução prevista: {fmtDate(wizardDueDate)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={resetWizard} className="gap-1.5">
              <BookMarked className="size-3.5" />
              Novo empréstimo
            </Button>
            <Button variant="outline" onClick={() => { resetWizard(); setActiveTab('devolucao') }} className="gap-1.5">
              <Undo2 className="size-3.5" />
              Ir para devolução
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Indicador de etapas */}
        <div className="bg-white rounded-xl border border-border/60 p-5">
          <StepIndicator current={wizardStep} />
        </div>

        {/* Etapa 1 — Selecionar Leitor */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="ds-section-title mb-0.5">Selecionar Leitor</h3>
              <p className="ds-caption text-slate-400">Pesquise por nome, matrícula ou código de barras do cartão</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                autoFocus
                placeholder="Nome ou matrícula..."
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Auto-match hint */}
            {userQuery.trim() && filteredUsers.length === 1 && (
              <p className="ds-caption text-brand-600 flex items-center gap-1.5">
                <CheckCircle className="size-3.5" />
                Leitor identificado — clique para selecionar
              </p>
            )}

            {/* Lista de leitores */}
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="ds-caption text-slate-400">Nenhum leitor encontrado para &quot;{userQuery}&quot;</p>
                </div>
              ) : (
                filteredUsers.slice(0, 20).map(u => {
                  const stats = activeByUser.get(u.numeroCadastro)
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={!u.ativo}
                      onClick={() => selectUser(u)}
                      className={cn(
                        'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-colors',
                        u.ativo
                          ? 'bg-white border-border hover:border-brand-300 hover:bg-brand-50/30'
                          : 'bg-slate-50 border-border/40 opacity-60 cursor-not-allowed'
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        'size-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold',
                        u.ativo ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'
                      )}>
                        {initials(u.nomeCompleto)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-800 truncate">{u.nomeCompleto}</p>
                          <StatusBadge
                            status={u.ativo ? 'disponivel' : 'inativo'}
                            label={u.ativo ? 'Ativo' : 'Inativo'}
                            dot
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="ds-caption text-slate-400 font-mono">{u.numeroCadastro}</p>
                          {stats && stats.active > 0 && (
                            <p className="ds-caption text-slate-500">
                              {stats.active} empréstimo{stats.active > 1 ? 's' : ''} ativo{stats.active > 1 ? 's' : ''}
                              {stats.overdue > 0 && (
                                <span className="text-red-500 ml-1 font-medium">· {stats.overdue} em atraso</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="size-4 text-slate-300 shrink-0" />
                    </button>
                  )
                })
              )}
            </div>

            {filteredUsers.length > 20 && (
              <p className="ds-caption text-slate-400 text-center">
                Exibindo 20 de {filteredUsers.length} — refine a busca para ver mais
              </p>
            )}
          </div>
        )}

        {/* Etapa 2 — Selecionar Obra */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            {/* Context: leitor selecionado */}
            <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 rounded-xl border border-brand-100">
              <div className="size-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 text-xs font-semibold text-brand-700">
                {initials(wizardUser!.nomeCompleto)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-brand-800">{wizardUser!.nomeCompleto}</p>
                <p className="ds-caption text-brand-600">{wizardUser!.numeroCadastro}</p>
              </div>
              <button type="button" onClick={goBack} className="text-xs text-brand-500 underline">Trocar</button>
            </div>

            <div>
              <h3 className="ds-section-title mb-0.5">Selecionar Obra</h3>
              <p className="ds-caption text-slate-400">
                Apenas obras com exemplares disponíveis ({filteredObras.length})
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                autoFocus
                placeholder="Título, autor, ISBN ou assunto..."
                value={obraQuery}
                onChange={e => setObraQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Lista de obras */}
            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {filteredObras.length === 0 ? (
                <div className="text-center py-10">
                  <p className="ds-caption text-slate-400">
                    {obraQuery ? `Nenhuma obra disponível para "${obraQuery}"` : 'Nenhuma obra disponível'}
                  </p>
                </div>
              ) : (
                filteredObras.slice(0, 30).map(o => (
                  <button
                    key={o.obraId}
                    type="button"
                    onClick={() => selectObra(o)}
                    className="w-full flex items-start gap-4 px-4 py-3.5 rounded-xl border border-border bg-white text-left transition-colors hover:border-brand-300 hover:bg-brand-50/30"
                  >
                    {/* Mini capa */}
                    <div className="w-8 h-12 rounded shrink-0 bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 border border-border/50">
                      {o.titulo[0]?.toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{o.titulo}</p>
                      {o.autor && <p className="ds-caption text-slate-500 truncate">{o.autor}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {o.isbn && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {o.isbn}
                          </span>
                        )}
                        {o.classificacao && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {o.classificacao}
                          </span>
                        )}
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded',
                          o.disponiveis > 2 ? 'bg-green-50 text-green-700' :
                          o.disponiveis === 1 ? 'bg-amber-50 text-amber-700' :
                          'bg-brand-50 text-brand-700'
                        )}>
                          {o.disponiveis} disponível{o.disponiveis > 1 ? 'is' : ''}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="size-4 text-slate-300 shrink-0 mt-1" />
                  </button>
                ))
              )}
            </div>

            {filteredObras.length > 30 && (
              <p className="ds-caption text-slate-400 text-center">
                Exibindo 30 de {filteredObras.length} — refine a busca
              </p>
            )}

            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-slate-500">
              <ChevronLeft className="size-3.5" />
              Voltar
            </Button>
          </div>
        )}

        {/* Etapa 3 — Exemplar */}
        {wizardStep === 3 && (
          <div className="space-y-4">
            {/* Context strip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 bg-slate-50 rounded-xl border border-border/60">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-1">Leitor</p>
                <p className="text-sm font-medium text-slate-700 truncate">{wizardUser!.nomeCompleto}</p>
                <p className="ds-caption text-slate-400">{wizardUser!.numeroCadastro}</p>
              </div>
              <div className="px-4 py-3 bg-slate-50 rounded-xl border border-border/60">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-1">Obra</p>
                <p className="text-sm font-medium text-slate-700 line-clamp-1">{wizardObra!.titulo}</p>
                {wizardObra!.autor && <p className="ds-caption text-slate-400 truncate">{wizardObra!.autor}</p>}
              </div>
            </div>

            {/* Exemplar auto-selecionado */}
            <div className="p-5 bg-white rounded-xl border border-border/60 space-y-4">
              <div>
                <h3 className="ds-section-title mb-0.5">Exemplar selecionado</h3>
                <p className="ds-caption text-slate-400">Selecionado automaticamente — melhor disponível</p>
              </div>

              {wizardExemplar ? (
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-4 bg-slate-50 rounded-lg border border-border/60">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status="disponivel" label="Disponível" dot />
                    </div>
                    <p className="text-base font-semibold font-mono text-slate-800">{wizardExemplar.codigoExemplar}</p>
                    {wizardExemplar.tombo && (
                      <p className="ds-caption text-slate-400 mt-0.5">Tombo {wizardExemplar.tombo}</p>
                    )}
                    {wizardExemplar.observacao && (
                      <p className="ds-caption text-slate-500 italic mt-1">{wizardExemplar.observacao}</p>
                    )}
                  </div>
                  {availableExemplares.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setDrawerTempEx(wizardExemplar); setDrawerOpen(true) }}
                      className="shrink-0 text-slate-500"
                    >
                      Alterar exemplar
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="ds-caption text-amber-700">Nenhum exemplar disponível para esta obra.</p>
                </div>
              )}
            </div>

            {/* Data de devolução */}
            <div className="p-5 bg-white rounded-xl border border-border/60 space-y-3">
              <div>
                <h3 className="ds-label text-slate-600 mb-0.5">Data de devolução</h3>
                <p className="ds-caption text-slate-400">Padrão: 14 dias a partir de hoje</p>
              </div>
              <Input
                type="date"
                min={getTodayStr()}
                value={wizardDueDate}
                onChange={e => setWizardDueDate(e.target.value)}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-slate-500">
                <ChevronLeft className="size-3.5" />
                Voltar
              </Button>
              <Button
                onClick={() => setWizardStep(4)}
                disabled={!wizardExemplar}
                className="gap-1.5"
              >
                Revisar
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Etapa 4 — Confirmar */}
        {wizardStep === 4 && (
          <div className="space-y-4 max-w-lg">
            <div>
              <h3 className="ds-section-title mb-0.5">Resumo do Empréstimo</h3>
              <p className="ds-caption text-slate-400">Confirme os dados antes de registrar</p>
            </div>

            <div className="bg-white rounded-xl border border-border/60 divide-y divide-border/60 overflow-hidden">
              {[
                {
                  label: 'Leitor',
                  value: wizardUser!.nomeCompleto,
                  sub: wizardUser!.numeroCadastro,
                },
                {
                  label: 'Obra',
                  value: wizardObra!.titulo,
                  sub: wizardObra!.autor ?? undefined,
                },
                {
                  label: 'Exemplar',
                  value: wizardExemplar!.codigoExemplar,
                  sub: wizardExemplar!.tombo ? `Tombo ${wizardExemplar!.tombo}` : undefined,
                  mono: true,
                },
                {
                  label: 'Devolução prevista',
                  value: fmtDate(wizardDueDate),
                  sub: undefined,
                },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start px-5 py-4 gap-4">
                  <p className="ds-caption text-slate-400 shrink-0 pt-0.5">{row.label}</p>
                  <div className="text-right">
                    <p className={cn('text-sm font-medium text-slate-800', row.mono && 'font-mono')}>{row.value}</p>
                    {row.sub && <p className="ds-caption text-slate-400">{row.sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            {loanError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
                <p className="ds-caption text-red-700">{loanError}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={goBack} disabled={loanSubmitting} className="gap-1.5 text-slate-500">
                <ChevronLeft className="size-3.5" />
                Voltar
              </Button>
              <Button onClick={submitLoan} disabled={loanSubmitting} className="gap-1.5">
                {loanSubmitting ? <Spinner size="sm" /> : <BookMarked className="size-3.5" />}
                Confirmar Empréstimo
              </Button>
            </div>
          </div>
        )}

        {/* Drawer de escolha de exemplar */}
        <ExemplarPickerDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          exemplares={availableExemplares}
          current={wizardExemplar}
          onSelect={ex => setWizardExemplar(ex)}
        />
      </div>
    )
  }

  // ── TAB CONTENT: Devolução ───────────────────────────────────────────────────

  function renderDevolucao() {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h3 className="ds-section-title mb-0.5">Receber Devolução</h3>
          <p className="ds-caption text-slate-400">
            Informe o código EX do exemplar. Leia o código de barras com o leitor óptico ou digite manualmente.
          </p>
        </div>

        {/* Successo */}
        {returnSuccess && (
          <div className="flex flex-col items-center text-center py-8 space-y-4">
            <div className="size-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="size-7 text-green-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Devolução registrada!</h4>
              <p className="ds-caption text-slate-400 mt-0.5">Exemplar disponível para novo empréstimo.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => { setReturnSuccess(false); setReturnQuery('') }} className="gap-1.5">
                <Undo2 className="size-3.5" />
                Nova devolução
              </Button>
              <Button variant="outline" onClick={() => { setReturnSuccess(false); setReturnQuery(''); setActiveTab('emprestimo') }} className="gap-1.5">
                <BookMarked className="size-3.5" />
                Ir para empréstimo
              </Button>
            </div>
          </div>
        )}

        {!returnSuccess && (
          <>
            {/* Campo de busca */}
            <form onSubmit={searchReturn} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  autoFocus
                  placeholder="Ex: EX000021"
                  value={returnQuery}
                  onChange={e => { setReturnQuery(e.target.value); setReturnFound(null); setReturnSearchErr(null) }}
                  className="pl-9 font-mono text-base"
                />
              </div>
              <Button type="submit" disabled={!returnQuery.trim() || returnLoading} className="shrink-0">
                {returnLoading ? <Spinner size="sm" /> : 'Buscar'}
              </Button>
            </form>

            {/* Nota sobre busca por código de barras / tombo */}
            <div className="flex items-start gap-2 text-slate-400">
              <Info className="size-3.5 shrink-0 mt-0.5" />
              <p className="ds-caption">
                Busca por código de barras e tombo requer expansão de{' '}
                <code className="text-[11px] bg-slate-100 px-1 rounded">GET /api/returns</code> para aceitar esses parâmetros.
              </p>
            </div>

            {/* Erro */}
            {returnSearchErr && (
              <div className="flex items-start gap-2 p-4 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Não encontrado</p>
                  <p className="ds-caption text-red-600 mt-0.5">{returnSearchErr}</p>
                </div>
              </div>
            )}

            {/* Card do empréstimo encontrado */}
            {returnFound && (() => {
              const overdueDays = diffDays(returnFound.dataPrevistaDevolucao)
              const isOverdue = overdueDays > 0

              return (
                <div className={cn(
                  'rounded-xl border overflow-hidden',
                  isOverdue ? 'border-red-200' : 'border-border'
                )}>
                  {/* Header da obra */}
                  <div className="px-5 py-4 bg-slate-50 border-b border-border/60">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-1">Obra</p>
                    <p className="text-sm font-semibold text-slate-800">{returnFound.titulo}</p>
                    <p className="ds-caption font-mono text-slate-400 mt-0.5">{returnFound.codigoExemplar}</p>
                  </div>

                  {/* Corpo */}
                  <div className="px-5 py-4 bg-white space-y-4">
                    {/* Leitor */}
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 shrink-0">
                        {initials(returnFound.nomeCompleto)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{returnFound.nomeCompleto}</p>
                        <p className="ds-caption text-slate-400 font-mono">{returnFound.numeroCadastro}</p>
                      </div>
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Emprestado em</p>
                        <p className="text-sm text-slate-700 mt-0.5">{fmtDate(returnFound.dataEmprestimo)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Prazo</p>
                        <p className={cn('text-sm mt-0.5', isOverdue ? 'text-red-600 font-semibold' : 'text-slate-700')}>
                          {fmtDate(returnFound.dataPrevistaDevolucao)}
                        </p>
                      </div>
                    </div>

                    {/* Atraso */}
                    {isOverdue && (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-lg border border-red-100">
                        <AlertTriangle className="size-4 text-red-500 shrink-0" />
                        <p className="ds-caption text-red-700 font-medium">
                          {overdueDays} {overdueDays === 1 ? 'dia' : 'dias'} em atraso
                        </p>
                      </div>
                    )}

                    {/* Ação */}
                    <Button
                      className={cn('w-full gap-1.5', isOverdue && 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-300')}
                      onClick={submitReturn}
                      disabled={returnSubmitting}
                    >
                      {returnSubmitting ? <Spinner size="sm" /> : <Undo2 className="size-3.5" />}
                      Receber devolução
                    </Button>
                  </div>
                </div>
              )
            })()}
          </>
        )}
      </div>
    )
  }

  // ── TAB CONTENT: Renovação ───────────────────────────────────────────────────

  function renderRenovacao() {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="ds-section-title mb-0.5">Empréstimos Ativos</h3>
            <p className="ds-caption text-slate-400">
              {activeLoans.length} empréstimo{activeLoans.length !== 1 ? 's' : ''} ativo{activeLoans.length !== 1 ? 's' : ''}
              {activeLoans.filter(l => l.status === 'ATRASADO').length > 0 && (
                <span className="text-red-500 ml-1">
                  · {activeLoans.filter(l => l.status === 'ATRASADO').length} em atraso
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Leitor, código EX ou título..."
            value={renovQuery}
            onChange={e => setRenovQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lista */}
        {filteredActiveLoans.length === 0 ? (
          <EmptyState
            title={renovQuery ? 'Nenhum resultado' : 'Sem empréstimos ativos'}
            description={renovQuery ? `Nenhum empréstimo ativo para "${renovQuery}"` : 'Todos os exemplares estão devolvidos.'}
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {filteredActiveLoans.map(loan => {
              const overdueDays = diffDays(loan.dataPrevistaDevolucao)
              const isOverdue = loan.status === 'ATRASADO' || overdueDays > 0

              return (
                <div
                  key={loan.id}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3.5 bg-white rounded-xl border',
                    isOverdue ? 'border-red-100 bg-red-50/30' : 'border-border/60'
                  )}
                >
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-800 truncate flex-1">{loan.titulo}</p>
                      <StatusBadge
                        status={isOverdue ? 'atrasado' : 'emprestado'}
                        label={isOverdue ? 'Atrasado' : 'Ativo'}
                        dot
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <p className="ds-caption text-slate-500 truncate">{loan.nomeCompleto}</p>
                      <p className="ds-caption font-mono text-slate-400">{loan.codigoExemplar}</p>
                      <div className={cn('flex items-center gap-1', isOverdue ? 'text-red-500' : 'text-slate-400')}>
                        {isOverdue
                          ? <AlertTriangle className="size-3" />
                          : <Clock className="size-3" />
                        }
                        <span className="ds-caption">
                          {isOverdue
                            ? `${overdueDays}d em atraso`
                            : `Até ${fmtShort(loan.dataPrevistaDevolucao)}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ação */}
                  <div className="shrink-0 space-y-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRenovarDialog(loan)}
                      disabled={renovSubmitting === loan.id}
                      className={cn(
                        'gap-1.5',
                        renovSuccess === loan.id && 'border-green-300 text-green-700'
                      )}
                    >
                      {renovSubmitting === loan.id
                        ? <Spinner size="sm" />
                        : renovSuccess === loan.id
                          ? <Check className="size-3.5" />
                          : <CalendarClock className="size-3.5" />
                      }
                      {renovSuccess === loan.id ? 'Renovado' : 'Renovar'}
                    </Button>
                    {renovError?.id === loan.id && (
                      <p className="ds-caption text-red-500 max-w-[140px] text-right">{renovError.msg}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Dialog: renovação de empréstimo */}
        {(() => {
          const diasProrrogados = renovTarget && renovNovaData
            ? Math.round((new Date(renovNovaData + 'T12:00:00').getTime() - new Date(renovTarget.vencimentoAtual + 'T12:00:00').getTime()) / 86_400_000)
            : 0

          return (
            <Drawer
              open={!!renovTarget}
              onClose={() => setRenovTarget(null)}
              title={
                <span className="flex items-center gap-2">
                  <span className="flex items-center justify-center size-7 rounded-lg bg-brand-50 shrink-0">
                    <CalendarClock className="size-4 text-brand-600" />
                  </span>
                  <span>Renovar empréstimo</span>
                </span>
              }
              width="md"
              footer={
                <>
                  <Button variant="outline" onClick={() => setRenovTarget(null)}>Cancelar</Button>
                  <Button
                    onClick={() => renovTarget && handleRenovar(renovTarget.id, renovNovaData)}
                    disabled={!renovNovaData || !!renovSubmitting}
                    className="gap-1.5"
                  >
                    {renovSubmitting ? <Spinner size="sm" /> : <CalendarClock className="size-3.5" />}
                    Confirmar renovação
                  </Button>
                </>
              }
            >
              <div className="space-y-6">

                {/* Contexto: obra + leitor */}
                <div className="bg-slate-50 rounded-xl border border-border/60 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-white border border-border/60 flex items-center justify-center shrink-0 mt-0.5">
                      <BookText className="size-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                        {renovTarget?.titulo}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                        <User className="size-3.5 shrink-0" />
                        <span>{renovTarget?.leitor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vencimento atual */}
                <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5">
                    Vencimento atual
                  </p>
                  <p className="text-xl font-semibold text-slate-800 tabular-nums">
                    {renovTarget ? fmtDate(renovTarget.vencimentoAtual) : '—'}
                  </p>
                </div>

                {/* Novo vencimento */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 block">
                    Novo vencimento
                  </label>
                  <p className="text-xs text-slate-400 mb-2">Selecione a nova data de devolução.</p>
                  <Input
                    type="date"
                    value={renovNovaData}
                    onChange={e => setRenovNovaData(e.target.value)}
                    min={getTodayStr()}
                  />
                </div>

                {/* Observações */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 block">
                    Observações
                  </label>
                  <textarea
                    value={renovObservacao}
                    onChange={e => setRenovObservacao(e.target.value.slice(0, 500))}
                    placeholder="Informe o motivo da renovação ou alguma observação (opcional)."
                    maxLength={500}
                    rows={4}
                    className={cn(
                      'w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm',
                      'placeholder:text-muted-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  />
                  <p className="text-[11px] text-slate-400 text-right tabular-nums">
                    {renovObservacao.length}/500
                  </p>
                </div>

                {/* Resumo da renovação */}
                {renovNovaData && renovTarget && (
                  <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-3">
                      Resumo da renovação
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-400 mb-0.5">Vencimento atual</p>
                        <p className="text-sm font-medium text-slate-700 tabular-nums">
                          {fmtDate(renovTarget.vencimentoAtual)}
                        </p>
                      </div>
                      <ArrowLeftRight className="size-4 text-slate-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-400 mb-0.5">Novo vencimento</p>
                        <p className="text-sm font-medium text-slate-700 tabular-nums">
                          {fmtDate(renovNovaData + 'T12:00:00')}
                        </p>
                      </div>
                      {diasProrrogados !== 0 && (
                        <span className={cn(
                          'ml-auto shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums',
                          diasProrrogados > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        )}>
                          {diasProrrogados > 0 ? '+' : ''}{diasProrrogados}d
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Erro */}
                {renovError && renovTarget && renovError.id === renovTarget.id && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200/70 rounded-lg">
                    <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{renovError.msg}</p>
                  </div>
                )}

              </div>
            </Drawer>
          )
        })()}
      </div>
    )
  }

  // ── TAB CONTENT: Reservas ────────────────────────────────────────────────────

  function renderReservas() {
    return (
      <div className="space-y-5 max-w-xl">
        <div>
          <h3 className="ds-section-title mb-0.5">Reservas</h3>
          <p className="ds-caption text-slate-400">Fila de espera por obra</p>
        </div>

        <EmptyState
          icon={<CalendarClock className="size-8 text-slate-200" />}
          title="Módulo de Reservas pendente"
          description="O modelo de Reservas ainda não está implementado no backend."
          size="sm"
        />

        {/* Documentação dos endpoints necessários */}
        <div className="p-4 bg-slate-50 rounded-xl border border-border/60 space-y-3">
          <p className="ds-caption text-slate-500 font-semibold">Endpoints necessários</p>
          <div className="space-y-1.5">
            {[
              'GET  /api/reservas — listar por obra ou leitor',
              'POST /api/reservas — criar nova reserva',
              'DELETE /api/reservas/:id — cancelar reserva',
              'GET  /api/obras/:id/fila — posição na fila',
            ].map(ep => (
              <code key={ep} className="block text-[11px] bg-slate-100 text-slate-600 px-2 py-1.5 rounded font-mono">
                {ep}
              </code>
            ))}
          </div>
          <p className="ds-caption text-slate-400 mt-2">
            O modelo <code className="text-[11px] bg-slate-100 px-1 rounded">Reserva</code>{' '}
            também precisa ser criado no schema Prisma antes de implementar os endpoints.
          </p>
        </div>

        <Link href="/acervo/consulta">
          <Button variant="outline" size="sm" className="gap-1.5">
            <BookOpen className="size-3.5" />
            Ver catálogo
          </Button>
        </Link>
      </div>
    )
  }

  // ── Tabs config ──────────────────────────────────────────────────────────────

  const TABS: { id: WorkspaceTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'emprestimo',
      label: 'Empréstimo',
      icon: <BookMarked className="size-4" />,
    },
    {
      id: 'devolucao',
      label: 'Devolução',
      icon: <Undo2 className="size-4" />,
    },
    {
      id: 'renovacao',
      label: 'Renovação',
      icon: <RotateCcw className="size-4" />,
      badge: activeLoans.filter(l => l.status === 'ATRASADO').length || undefined,
    },
    {
      id: 'reservas',
      label: 'Reservas',
      icon: <CalendarClock className="size-4" />,
    },
  ]

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => loadData()}>
        <RefreshCw className="size-3.5" />
        <span className="hidden sm:inline">Atualizar</span>
      </Button>
    </div>
  )

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Circulação"
        description={`${activeLoans.length} empréstimo${activeLoans.length !== 1 ? 's' : ''} ativo${activeLoans.length !== 1 ? 's' : ''} · ${obras.filter(o => o.disponiveis > 0).length} obras disponíveis`}
        breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', href: '/' }]} />}
        actions={pageActions}
      />

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative',
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="size-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'emprestimo' && renderEmprestimo()}
        {activeTab === 'devolucao' && renderDevolucao()}
        {activeTab === 'renovacao' && renderRenovacao()}
        {activeTab === 'reservas'  && renderReservas()}
      </div>
    </div>
  )
}
