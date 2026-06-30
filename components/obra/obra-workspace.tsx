'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useRouter }    from 'next/navigation'
import Link             from 'next/link'
import { usePageTitle } from '@/components/page-context'
import {
  ArrowLeft, Plus, Pencil, BookOpen, BookMarked, Archive,
  CheckCircle, Clock, Wrench, Search, AlertTriangle,
  ExternalLink, RefreshCw, Undo2, Printer,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { PageHeader }        from '@/components/ui/page-header'
import { KpiCard }           from '@/components/ui/kpi-card'
import { Button }            from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge }       from '@/components/ui/status-badge'
import { ActionMenu }        from '@/components/ui/action-menu'
import { Modal }             from '@/components/ui/modal'
import { Drawer }            from '@/components/ui/drawer'
import { Input }             from '@/components/ui/input'
import { EmptyState }        from '@/components/ui/empty-state'
import { SkeletonCard, Spinner } from '@/components/ui/loading-state'
import { ConfirmDialog }     from '@/components/ui/confirm-dialog'
import { useToast }          from '@/components/ui/toast'
import { LabelPrintDialog }  from '@/components/cataloging/label-print-dialog'

// ── Types ─────────────────────────────────────────────────────────────────────

type ExemplarStatus =
  | 'DISPONIVEL' | 'EMPRESTADO' | 'RESERVADO'
  | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO'

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
  cutter: string | null
  notacaoAutor: string | null
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

// GET /api/loans → EmprestimoListItemDTO[]
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
  nomeCompleto: string
  numeroCadastro: string
  ativo: boolean
}

// GET /api/returns?exemplar=<code> → EmprestimoAtivoDTO
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

// ── Helpers ───────────────────────────────────────────────────────────────────

type DSStatus = 'disponivel' | 'emprestado' | 'reservado' | 'inativo' | 'manutencao' | 'atrasado'

const STATUS_DS: Record<ExemplarStatus, DSStatus> = {
  DISPONIVEL: 'disponivel',
  EMPRESTADO: 'emprestado',
  RESERVADO:  'reservado',
  MANUTENCAO: 'manutencao',
  EXTRAVIADO: 'inativo',
  BAIXADO:    'inativo',
}

const STATUS_LABEL: Record<ExemplarStatus, string> = {
  DISPONIVEL: 'Disponível',
  EMPRESTADO: 'Emprestado',
  RESERVADO:  'Reservado',
  MANUTENCAO: 'Em manutenção',
  EXTRAVIADO: 'Extraviado',
  BAIXADO:    'Baixado',
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── CoverPlaceholder ──────────────────────────────────────────────────────────

const PALETTES = [
  'bg-brand-50 text-brand-600 border-brand-200',
  'bg-violet-50 text-violet-600 border-violet-200',
  'bg-teal-50 text-teal-600 border-teal-200',
  'bg-amber-50 text-amber-600 border-amber-200',
  'bg-rose-50 text-rose-600 border-rose-200',
]

function CoverPlaceholder({ titulo, obraId, size = 'md' }: {
  titulo: string
  obraId: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const palette = PALETTES[obraId % PALETTES.length]
  const sz = { sm: 'w-10 h-14 rounded-md text-base', md: 'w-14 h-20 rounded-lg text-xl', lg: 'w-20 h-28 rounded-xl text-3xl' }
  return (
    <div className={cn('flex items-center justify-center border shrink-0 select-none font-bold', palette, sz[size])}>
      {titulo[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

// ── BookCover ─────────────────────────────────────────────────────────────────
// Renders capaUrl when available; falls back to CoverPlaceholder.
// Backend-ready: swap in the real field whenever GET /api/obras/:id exposes it.

function BookCover({ capaUrl, titulo, obraId, size = 'md' }: {
  capaUrl?: string | null
  titulo: string
  obraId: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const sz = { sm: 'w-10 h-14 rounded-md', md: 'w-14 h-20 rounded-lg', lg: 'w-20 h-28 rounded-xl' }
  if (capaUrl) {
    return (
      <img
        src={capaUrl}
        alt={titulo}
        className={cn(sz[size], 'object-cover shrink-0')}
      />
    )
  }
  return <CoverPlaceholder titulo={titulo} obraId={obraId} size={size} />
}

// ── MetaField ─────────────────────────────────────────────────────────────────

function MetaField({ label, value, missing }: { label: string; value?: string | null; missing?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">{label}</p>
      <p className={cn('text-sm mt-0.5', value ? 'text-slate-700' : 'text-slate-300 italic')}>
        {value ?? '—'}
        {missing && !value && <span className="text-[10px] not-italic text-slate-300 ml-1">(campo futuro)</span>}
      </p>
    </div>
  )
}

// ── ExemplarCard ──────────────────────────────────────────────────────────────

const ExemplarCard = memo(function ExemplarCard({ exemplar, lastLoan, onLoan, onEdit, onStatusChange, onReturn }: {
  exemplar: ExemplarDTO
  lastLoan: LoanDTO | undefined
  onLoan: (e: ExemplarDTO) => void
  onEdit: (e: ExemplarDTO) => void
  onStatusChange: (e: ExemplarDTO, s: ExemplarStatus) => Promise<void>
  onReturn: (e: ExemplarDTO) => void
}) {
  const isInactive  = exemplar.status === 'BAIXADO' || exemplar.status === 'EXTRAVIADO'
  const isEmprestado = exemplar.status === 'EMPRESTADO'
  const isOverdue   = isEmprestado && lastLoan
    ? new Date(lastLoan.dataPrevistaDevolucao) < new Date()
    : false

  // ── Layout: EMPRESTADO ────────────────────────────────────────────────────
  if (isEmprestado) {
    return (
      <Card className="border border-border/60 bg-white shadow-none">
        <CardContent className="p-4">
          {/* Status + menu */}
          <div className="flex items-center justify-between mb-3">
            <StatusBadge status="emprestado" label="Emprestado" />
            <span onClick={e => e.stopPropagation()}>
              <ActionMenu
                align="end"
                items={[
                  {
                    label: 'Editar exemplar',
                    icon:  <Pencil className="size-4" />,
                    onClick: () => onEdit(exemplar),
                  },
                  { label: '', onClick: () => {}, separator: true },
                  {
                    label: 'Marcar como Reservado',
                    onClick: () => onStatusChange(exemplar, 'RESERVADO'),
                  },
                  {
                    label: 'Enviar para Manutenção',
                    onClick: () => onStatusChange(exemplar, 'MANUTENCAO'),
                  },
                  {
                    label: 'Baixar exemplar',
                    destructive: true,
                    onClick: () => onStatusChange(exemplar, 'BAIXADO'),
                  },
                ]}
              />
            </span>
          </div>

          {/* Identificação */}
          <div className="mb-3">
            <p className="text-sm font-semibold font-mono text-slate-800">{exemplar.codigoExemplar}</p>
            {exemplar.tombo && (
              <p className="ds-caption text-slate-400 mt-0.5">Tombo {exemplar.tombo}</p>
            )}
          </div>

          {/* Borrower block */}
          <div className={cn(
            'p-3 rounded-lg border mb-3',
            isOverdue ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-border/40'
          )}>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-1.5">Com</p>
            {lastLoan ? (
              <>
                <p className="text-sm font-medium text-slate-700">{lastLoan.nomeCompleto}</p>
                <p className="ds-caption text-slate-400">{lastLoan.numeroCadastro}</p>
                <div className={cn(
                  'flex items-center gap-1.5 mt-2 pt-2 border-t',
                  isOverdue ? 'border-red-100 text-red-600' : 'border-border/40 text-slate-400'
                )}>
                  {isOverdue
                    ? <AlertTriangle className="size-3.5 shrink-0" />
                    : <Clock className="size-3.5 shrink-0" />
                  }
                  <span className="ds-caption">
                    {isOverdue ? 'Em atraso desde' : 'Devolver em'}{' '}
                    {fmtDate(lastLoan.dataPrevistaDevolucao)}
                  </span>
                </div>
              </>
            ) : (
              <p className="ds-caption text-slate-400 italic">Dados do leitor indisponíveis</p>
            )}
          </div>

          {exemplar.observacao && (
            <p className="ds-caption text-slate-500 italic mb-3">{exemplar.observacao}</p>
          )}

          {/* Single primary action */}
          <Button
            size="sm"
            className={cn('w-full gap-1.5', isOverdue && 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-300')}
            onClick={() => onReturn(exemplar)}
          >
            <Undo2 className="size-3.5" />
            Receber devolução
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── Layout: padrão ────────────────────────────────────────────────────────
  const canLoan = exemplar.status === 'DISPONIVEL'

  return (
    <Card className={cn(
      'border border-border/60 bg-white shadow-none transition-opacity',
      isInactive && 'opacity-60'
    )}>
      <CardContent className="p-4">
        {/* Status + menu */}
        <div className="flex items-center justify-between mb-3">
          <StatusBadge
            status={STATUS_DS[exemplar.status]}
            label={STATUS_LABEL[exemplar.status]}
          />
          <span onClick={e => e.stopPropagation()}>
            <ActionMenu
              align="end"
              items={[
                {
                  label: 'Editar exemplar',
                  icon:  <Pencil className="size-4" />,
                  onClick: () => onEdit(exemplar),
                },
                {
                  label: 'Marcar como Disponível',
                  onClick: () => onStatusChange(exemplar, 'DISPONIVEL'),
                  disabled: exemplar.status === 'DISPONIVEL',
                },
                {
                  label: 'Marcar como Reservado',
                  onClick: () => onStatusChange(exemplar, 'RESERVADO'),
                  disabled: exemplar.status === 'RESERVADO',
                },
                {
                  label: 'Enviar para Manutenção',
                  onClick: () => onStatusChange(exemplar, 'MANUTENCAO'),
                  disabled: exemplar.status === 'MANUTENCAO',
                },
                {
                  label: 'Baixar exemplar',
                  destructive: true,
                  onClick: () => onStatusChange(exemplar, 'BAIXADO'),
                  disabled: exemplar.status === 'BAIXADO',
                },
              ]}
            />
          </span>
        </div>

        {/* Identificação */}
        <div className="mb-3">
          <p className="text-sm font-semibold font-mono text-slate-800">{exemplar.codigoExemplar}</p>
          {exemplar.tombo && (
            <p className="ds-caption text-slate-400 mt-0.5">Tombo {exemplar.tombo}</p>
          )}
        </div>

        {/* Campos — disponíveis vs futuros */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-3 border-y border-border/40">
          <MetaField label="Cód. de barras"    value={null} missing />
          <MetaField label="Estado físico"      value={null} missing />
          <MetaField label="Localização"        value={null} missing />
          <MetaField
            label="Última movimentação"
            value={lastLoan
              ? `${fmtShort(lastLoan.dataEmprestimo)} · ${lastLoan.nomeCompleto}`
              : undefined
            }
          />
        </div>

        {exemplar.observacao && (
          <p className="ds-caption text-slate-500 italic mt-3">{exemplar.observacao}</p>
        )}

        {/* Ações rápidas */}
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            disabled={!canLoan}
            onClick={() => onLoan(exemplar)}
            className="gap-1.5"
          >
            <BookMarked className="size-3.5" />
            Emprestar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(exemplar)}
            className="gap-1.5"
          >
            <Pencil className="size-3.5" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

// ── EmprestimoModal ───────────────────────────────────────────────────────────

function EmprestimoModal({ open, onClose, exemplar, onSuccess }: {
  open: boolean
  onClose: () => void
  exemplar: ExemplarDTO | null
  onSuccess: () => void
}) {
  const [usuarios,    setUsuarios]    = useState<UsuarioDTO[]>([])
  const [search,      setSearch]      = useState('')
  const [selected,    setSelected]    = useState<number | null>(null)
  const [loadingU,    setLoadingU]    = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSearch(''); setSelected(null); setError(null)
    setLoadingU(true)
    fetch('/api/usuarios')
      .then(r => r.json())
      .then(data => setUsuarios(
        (Array.isArray(data) ? data : data.data ?? []).filter((u: UsuarioDTO) => u.ativo)
      ))
      .catch(() => setError('Não foi possível carregar os leitores'))
      .finally(() => setLoadingU(false))
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) return usuarios
    // Exact match on numeroCadastro first (barcode scan path)
    const byCode = usuarios.filter(u => u.numeroCadastro === q)
    if (byCode.length > 0) return byCode
    // Fuzzy by name or partial code
    return usuarios.filter(u =>
      u.nomeCompleto.toLowerCase().includes(q.toLowerCase()) ||
      u.numeroCadastro.includes(q)
    )
  }, [usuarios, search])

  // Auto-select when the query resolves to a single leitor (ex: código de barras)
  useEffect(() => {
    if (search.trim() && filtered.length === 1) {
      setSelected(filtered[0].id)
    }
  }, [filtered, search])

  async function handleConfirm() {
    if (!selected || !exemplar) return
    setSubmitting(true); setError(null)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: selected,
          exemplarId: exemplar.id,
          dataPrevistaDevolucao: dueDate.toISOString(),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao registrar empréstimo')
      }
      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao registrar empréstimo')
    } finally {
      setSubmitting(false)
    }
  }

  const dueStr = fmtDate(new Date(Date.now() + 14 * 86_400_000).toISOString())

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar Empréstimo"
      description={exemplar ? `${exemplar.codigoExemplar} — ${exemplar.titulo}` : ''}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!selected || submitting} className="gap-1.5">
            {submitting ? <Spinner size="sm" /> : <BookMarked className="size-3.5" />}
            Confirmar Empréstimo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Prazo info */}
        <div className="flex items-center gap-2 p-3 bg-brand-50 rounded-lg border border-brand-100">
          <Clock className="size-4 text-brand-500 shrink-0" />
          <p className="ds-caption text-brand-700">
            Prazo padrão: 14 dias — devolução prevista em {dueStr}
          </p>
        </div>

        {/* Busca de leitor */}
        <div className="space-y-2">
          <p className="ds-label text-slate-600">Selecionar Leitor</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Nome, matrícula ou código de barras..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          {search.trim() && filtered.length === 1 && (
            <p className="ds-caption text-brand-600 flex items-center gap-1.5">
              <CheckCircle className="size-3.5" />
              Leitor identificado automaticamente
            </p>
          )}
        </div>

        {/* Lista de leitores */}
        <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
          {loadingU ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <p className="ds-caption text-slate-400 text-center py-6">
              {search ? 'Nenhum leitor encontrado' : 'Nenhum leitor ativo'}
            </p>
          ) : (
            <div className="p-1 space-y-0.5">
              {filtered.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelected(u.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
                    selected === u.id
                      ? 'bg-brand-50 border border-brand-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  )}
                >
                  <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-500">
                    {u.nomeCompleto.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{u.nomeCompleto}</p>
                    <p className="ds-caption text-slate-400">{u.numeroCadastro}</p>
                  </div>
                  {selected === u.id && (
                    <CheckCircle className="size-4 text-brand-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="ds-caption text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />{error}
          </p>
        )}
      </div>
    </Modal>
  )
}

// ── DevolucaoModal ────────────────────────────────────────────────────────────

function DevolucaoModal({ open, onClose, exemplar, onSuccess }: {
  open: boolean
  onClose: () => void
  exemplar: ExemplarDTO | null
  onSuccess: () => void
}) {
  const [emprestimo,  setEmprestimo]  = useState<EmprestimoAtivoDTO | null>(null)
  const [loadingE,    setLoadingE]    = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!open || !exemplar) return
    setEmprestimo(null); setError(null)
    setLoadingE(true)
    fetch(`/api/returns?exemplar=${encodeURIComponent(exemplar.codigoExemplar)}`)
      .then(r => {
        if (!r.ok) throw new Error('Empréstimo ativo não encontrado')
        return r.json()
      })
      .then(data => setEmprestimo(data))
      .catch(e => setError(e instanceof Error ? e.message : 'Erro ao buscar empréstimo'))
      .finally(() => setLoadingE(false))
  }, [open, exemplar])

  async function handleConfirm() {
    if (!emprestimo || !exemplar) return
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emprestimoId: emprestimo.emprestimoId,
          exemplarId: exemplar.id,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao registrar devolução')
      }
      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao registrar devolução')
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = emprestimo
    ? new Date(emprestimo.dataPrevistaDevolucao) < new Date()
    : false

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Receber Devolução"
      description={exemplar ? `${exemplar.codigoExemplar} — ${exemplar.titulo}` : ''}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            disabled={!emprestimo || submitting}
            className={cn('gap-1.5', isOverdue && 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-300')}
          >
            {submitting ? <Spinner size="sm" /> : <Undo2 className="size-3.5" />}
            Confirmar Devolução
          </Button>
        </>
      }
    >
      {loadingE ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <div className="flex items-start gap-2 p-4 bg-red-50 rounded-lg border border-red-100">
          <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
          <p className="ds-caption text-red-700">{error}</p>
        </div>
      ) : emprestimo ? (
        <div className="space-y-4">
          {/* Leitor */}
          <div className="p-4 bg-slate-50 rounded-lg border border-border/60">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2">Leitor</p>
            <p className="text-sm font-medium text-slate-700">{emprestimo.nomeCompleto}</p>
            <p className="ds-caption text-slate-400 font-mono">{emprestimo.numeroCadastro}</p>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Emprestado em</p>
              <p className="text-sm text-slate-700 mt-0.5">{fmtDate(emprestimo.dataEmprestimo)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Prazo</p>
              <p className={cn('text-sm mt-0.5', isOverdue ? 'text-red-600 font-semibold' : 'text-slate-700')}>
                {fmtDate(emprestimo.dataPrevistaDevolucao)}
              </p>
            </div>
          </div>

          {isOverdue && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle className="size-4 text-red-500 shrink-0" />
              <p className="ds-caption text-red-700 font-medium">Empréstimo em atraso</p>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  )
}

// ── EditExemplarDrawer ────────────────────────────────────────────────────────

const EDITABLE_STATUSES: ExemplarStatus[] = ['DISPONIVEL', 'RESERVADO', 'MANUTENCAO', 'EXTRAVIADO', 'BAIXADO']

function EditExemplarDrawer({ open, onClose, exemplar, onSaved }: {
  open: boolean
  onClose: () => void
  exemplar: ExemplarDTO | null
  onSaved: () => void
}) {
  const [tombo,    setTombo]    = useState('')
  const [obs,      setObs]      = useState('')
  const [status,   setStatus]   = useState<ExemplarStatus>('DISPONIVEL')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (!exemplar) return
    setTombo(exemplar.tombo ?? '')
    setObs(exemplar.observacao ?? '')
    setStatus(exemplar.status)
    setError(null)
  }, [exemplar])

  async function handleSave() {
    if (!exemplar) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/acervo/${exemplar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tombo: tombo || null, observacao: obs || null, status }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao salvar')
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar exemplar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Editar Exemplar"
      description={exemplar ? `${exemplar.codigoExemplar}` : ''}
      width="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving && <Spinner size="sm" />}
            Salvar
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Status */}
        <div className="space-y-2">
          <p className="ds-label text-slate-600">Status</p>
          <div className="grid grid-cols-2 gap-2">
            {EDITABLE_STATUSES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  'px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors',
                  status === s
                    ? 'bg-brand-50 border-brand-400 text-brand-700'
                    : 'bg-white border-border text-slate-600 hover:border-brand-200'
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Tombo */}
        <div className="space-y-2">
          <label className="ds-label text-slate-600" htmlFor="ex-tombo">Tombo patrimonial</label>
          <Input
            id="ex-tombo"
            placeholder="ex: 00123"
            value={tombo}
            onChange={e => setTombo(e.target.value)}
          />
        </div>

        {/* Observação */}
        <div className="space-y-2">
          <label className="ds-label text-slate-600" htmlFor="ex-obs">Observação</label>
          <textarea
            id="ex-obs"
            rows={3}
            className="w-full resize-y rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            placeholder="Estado físico, notas, localização provisória..."
            value={obs}
            onChange={e => setObs(e.target.value)}
          />
        </div>

        {/* Nota sobre campos futuros */}
        <div className="p-3 bg-slate-50 border border-border rounded-lg">
          <p className="ds-caption text-slate-500 font-medium">Campos disponíveis após expansão do DTO</p>
          <p className="ds-caption text-slate-400 mt-1">
            Código de barras, estado físico, localização e dados de aquisição serão editáveis quando{' '}
            <code className="text-[11px] bg-slate-200 px-1 rounded">ExemplarDetailDTO</code> incluir esses campos.
          </p>
        </div>

        {error && (
          <p className="ds-caption text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />{error}
          </p>
        )}
      </div>
    </Drawer>
  )
}

// ── AddExemplarDrawer ─────────────────────────────────────────────────────────

const ESTADOS_FISICOS = ['Novo', 'Bom', 'Regular', 'Ruim', 'Péssimo']

function AddExemplarDrawer({ open, onClose, obra, onSaved }: {
  open: boolean
  onClose: () => void
  obra: ExemplarDTO | null
  onSaved: () => void
}) {
  const [tombo,            setTombo]            = useState('')
  const [codigoBarras,     setCodigoBarras]     = useState('')
  const [localizacao,      setLocalizacao]      = useState('')
  const [estadoFisico,     setEstadoFisico]     = useState('')
  const [observacao,       setObservacao]       = useState('')
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState<string | null>(null)
  const [saved,            setSaved]            = useState(false)
  const [showPrintDialog,  setShowPrintDialog]  = useState(false)

  useEffect(() => {
    if (open) {
      setTombo(''); setCodigoBarras(''); setLocalizacao('')
      setEstadoFisico(''); setObservacao(''); setError(null)
      setSaved(false); setShowPrintDialog(false)
    }
  }, [open])

  async function handleSave() {
    if (!obra) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/obras/${obra.obraId}/exemplares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tombo: tombo || null,
          codigoBarras: codigoBarras || null,
          localizacao: localizacao || null,
          estadoFisico: estadoFisico || null,
          observacao: observacao || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao adicionar exemplar')
      }
      onSaved()
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao adicionar exemplar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Drawer
      open={open}
      onClose={onClose}
      title="Adicionar Exemplar"
      description={obra?.titulo ?? ''}
      width="sm"
      footer={
        saved ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Agora não
            </Button>
            <Button onClick={() => setShowPrintDialog(true)} className="flex-1 gap-1.5">
              <Printer className="size-3.5" />
              Visualizar Etiquetas
            </Button>
          </div>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Spinner size="sm" />}
              <Plus className="size-3.5" />
              Salvar Exemplar
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        {/* ── Estado de sucesso ── */}
        {saved ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center space-y-3 py-4">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="size-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Cadastro concluído com sucesso.</p>
                <p className="text-xs text-slate-400 mt-1">Foram cadastrados:</p>
                <p className="text-xl font-bold text-slate-800 mt-1">1 exemplar</p>
              </div>
              <p className="text-sm text-slate-500">Deseja imprimir as etiquetas agora?</p>
            </div>
          </div>
        ) : (
          <>
        {obra && (
          <div className="p-3 bg-brand-50 rounded-lg border border-brand-100">
            <p className="text-[10px] uppercase tracking-widest text-brand-400 font-medium mb-1">Obra</p>
            <p className="text-sm font-medium text-brand-800">{obra.titulo}</p>
            {obra.autor && <p className="ds-caption text-brand-600">{obra.autor}</p>}
          </div>
        )}

        <div className="space-y-2">
          <label className="ds-label text-slate-600" htmlFor="add-tombo">Tombo patrimonial</label>
          <Input
            id="add-tombo"
            placeholder="ex: 00124"
            value={tombo}
            onChange={e => setTombo(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="ds-label text-slate-600" htmlFor="add-barras">Código de barras</label>
          <Input
            id="add-barras"
            placeholder="ex: 9788577420123"
            value={codigoBarras}
            onChange={e => setCodigoBarras(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="ds-label text-slate-600" htmlFor="add-loc">Localização</label>
          <Input
            id="add-loc"
            placeholder="ex: Estante A, Prateleira 3"
            value={localizacao}
            onChange={e => setLocalizacao(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="ds-label text-slate-600">Estado físico</p>
          <div className="flex flex-wrap gap-2">
            {ESTADOS_FISICOS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEstadoFisico(f => f === e ? '' : e)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  estadoFisico === e
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-slate-600 border-border hover:border-brand-300'
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="ds-label text-slate-600" htmlFor="add-obs">Observação</label>
          <textarea
            id="add-obs"
            rows={3}
            className="w-full resize-y rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            placeholder="Notas adicionais..."
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />
        </div>

        {error && (
          <p className="ds-caption text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />{error}
          </p>
        )}
        </>
        )}
      </div>
    </Drawer>

    {/* Dialog de impressão — abre após o sucesso do save */}
    {obra && (
      <LabelPrintDialog
        open={showPrintDialog}
        onClose={() => { setShowPrintDialog(false); onClose() }}
        obra={{
          titulo:        obra.titulo,
          classificacao: obra.classificacao,
          cutter:        obra.cutter,
          anoPublicacao: obra.anoPublicacao,
          edicao:        obra.edicao,
        }}
        quantity={1}
      />
    )}
  </>
  )
}

// ── EditObraDrawer ────────────────────────────────────────────────────────────

function EditObraDrawer({ open, obra, onClose, onSaved }: {
  open: boolean
  obra: ExemplarDTO | null
  onClose: () => void
  onSaved: () => void
}) {
  const [titulo,         setTitulo]         = useState('')
  const [subtitulo,      setSubtitulo]      = useState('')
  const [autor,          setAutor]          = useState('')
  const [editora,        setEditora]        = useState('')
  const [isbn,           setIsbn]           = useState('')
  const [anoPublicacao,  setAnoPublicacao]  = useState('')
  const [edicao,         setEdicao]         = useState('')
  const [classificacao,  setClassificacao]  = useState('')
  const [cutter,         setCutter]         = useState('')
  const [assunto1,       setAssunto1]       = useState('')
  const [assunto2,       setAssunto2]       = useState('')
  const [assunto3,       setAssunto3]       = useState('')
  const [colecao,        setColecao]        = useState('')
  const [tipoPublicacao, setTipoPublicacao] = useState('')
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  useEffect(() => {
    if (open && obra) {
      setTitulo(obra.titulo ?? '')
      setSubtitulo(obra.subtitulo ?? '')
      setAutor(obra.autor ?? '')
      setEditora(obra.editora ?? '')
      setIsbn(obra.isbn ?? '')
      setAnoPublicacao(obra.anoPublicacao?.toString() ?? '')
      setEdicao(obra.edicao ?? '')
      setClassificacao(obra.classificacao ?? '')
      setCutter(obra.cutter ?? '')
      setAssunto1(obra.assunto1 ?? '')
      setAssunto2(obra.assunto2 ?? '')
      setAssunto3(obra.assunto3 ?? '')
      setColecao(obra.colecao ?? '')
      setTipoPublicacao(obra.tipoPublicacao ?? '')
      setError(null)
    }
  }, [open, obra])

  async function handleSave() {
    if (!titulo.trim() || !obra) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/obras/${obra.obraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo.trim(),
          subtitulo: subtitulo.trim() || null,
          autor: autor.trim() || null,
          editora: editora.trim() || null,
          isbn: isbn.trim() || null,
          anoPublicacao: anoPublicacao ? parseInt(anoPublicacao, 10) : null,
          edicao: edicao.trim() || null,
          classificacao: classificacao.trim() || null,
          cutter: cutter.trim() || null,
          assunto1: assunto1.trim() || null,
          assunto2: assunto2.trim() || null,
          assunto3: assunto3.trim() || null,
          colecao: colecao.trim() || null,
          tipoPublicacao: tipoPublicacao.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao atualizar obra')
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Editar Obra"
      description={obra?.titulo ?? ''}
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !titulo.trim()} className="gap-1.5">
            {saving && <Spinner size="sm" />}
            Salvar alterações
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-titulo">Título *</label>
            <Input id="eo-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título da obra" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-subtitulo">Subtítulo</label>
            <Input id="eo-subtitulo" value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Subtítulo (opcional)" />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-autor">Autor</label>
            <Input id="eo-autor" value={autor} onChange={e => setAutor(e.target.value)} placeholder="Nome do autor" />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-editora">Editora</label>
            <Input id="eo-editora" value={editora} onChange={e => setEditora(e.target.value)} placeholder="Editora" />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-isbn">ISBN</label>
            <Input id="eo-isbn" value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="978-..." />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-ano">Ano de publicação</label>
            <Input id="eo-ano" type="number" min={1400} max={2100} value={anoPublicacao} onChange={e => setAnoPublicacao(e.target.value)} placeholder="2024" />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-edicao">Edição</label>
            <Input id="eo-edicao" value={edicao} onChange={e => setEdicao(e.target.value)} placeholder="1ª ed." />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-cdd">CDD / Classificação</label>
            <Input id="eo-cdd" value={classificacao} onChange={e => setClassificacao(e.target.value)} placeholder="ex: 869.3" />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-cutter">Cutter-Sanborn</label>
            <Input id="eo-cutter" value={cutter} onChange={e => setCutter(e.target.value)} placeholder="ex: B576a" />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-tipo">Tipo de publicação</label>
            <Input id="eo-tipo" value={tipoPublicacao} onChange={e => setTipoPublicacao(e.target.value)} placeholder="Livro, Periódico..." />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-colecao">Coleção</label>
            <Input id="eo-colecao" value={colecao} onChange={e => setColecao(e.target.value)} placeholder="Nome da coleção" />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-a1">Assunto 1</label>
            <Input id="eo-a1" value={assunto1} onChange={e => setAssunto1(e.target.value)} placeholder="Assunto principal" />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-a2">Assunto 2</label>
            <Input id="eo-a2" value={assunto2} onChange={e => setAssunto2(e.target.value)} placeholder="Assunto secundário" />
          </div>
          <div className="space-y-2">
            <label className="ds-label text-slate-600" htmlFor="eo-a3">Assunto 3</label>
            <Input id="eo-a3" value={assunto3} onChange={e => setAssunto3(e.target.value)} placeholder="Assunto terciário" />
          </div>
        </div>

        {error && (
          <p className="ds-caption text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />{error}
          </p>
        )}
      </div>
    </Drawer>
  )
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function ObraBreadcrumb({ titulo }: { titulo?: string }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400">
      <Link href="/" className="hover:text-slate-600 transition-colors">Dashboard</Link>
      <span aria-hidden>›</span>
      <Link href="/acervo/consulta" className="hover:text-slate-600 transition-colors">Catálogo</Link>
      {titulo && (
        <>
          <span aria-hidden>›</span>
          <span className="text-slate-600 truncate max-w-[200px]">{titulo}</span>
        </>
      )}
    </nav>
  )
}

// ── ObraWorkspace ─────────────────────────────────────────────────────────────

export function ObraWorkspace({ obraId }: { obraId: number }) {
  const router = useRouter()
  const { setPageInfo } = usePageTitle()
  const { toast } = useToast()

  const [exemplares,    setExemplares]    = useState<ExemplarDTO[]>([])
  const [loans,         setLoans]         = useState<LoanDTO[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(false)
  const [loanTarget,    setLoanTarget]    = useState<ExemplarDTO | null>(null)
  const [returnTarget,  setReturnTarget]  = useState<ExemplarDTO | null>(null)
  const [editTarget,    setEditTarget]    = useState<ExemplarDTO | null>(null)
  const [addOpen,       setAddOpen]       = useState(false)
  const [editObraOpen,  setEditObraOpen]  = useState(false)
  const [statusFilter,  setStatusFilter]  = useState<string>('TODOS')
  const [confirmBaixar, setConfirmBaixar] = useState<ExemplarDTO | null>(null)

  const obra = exemplares[0]

  useEffect(() => {
    if (obra) setPageInfo(obra.titulo, obra.autor ?? 'Catálogo')
  }, [obra, setPageInfo])

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      const opts = signal ? { signal } : {}
      const [acervoRes, loansRes] = await Promise.all([
        fetch('/api/acervo?limit=500', opts).then(r => r.json()),
        fetch('/api/loans', opts).then(r => r.json()),
      ])

      const allEx = (acervoRes.data ?? []) as ExemplarDTO[]
      const mine  = allEx.filter(e => e.obraId === obraId)
      setExemplares(mine)

      const codes = new Set(mine.map(e => e.codigoExemplar))
      const allLoans: LoanDTO[] = Array.isArray(loansRes) ? loansRes : loansRes.data ?? []
      setLoans(allLoans.filter(l => codes.has(l.codigoExemplar)))
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [obraId])

  useEffect(() => {
    const ctrl = new AbortController()
    loadData(ctrl.signal)
    return () => ctrl.abort()
  }, [loadData])

  // ── Derived ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total:       exemplares.length,
    disponiveis: exemplares.filter(e => e.status === 'DISPONIVEL').length,
    emprestados: exemplares.filter(e => e.status === 'EMPRESTADO').length,
    reservados:  exemplares.filter(e => e.status === 'RESERVADO').length,
    manutencao:  exemplares.filter(e => e.status === 'MANUTENCAO').length,
    baixados:    exemplares.filter(e => e.status === 'BAIXADO' || e.status === 'EXTRAVIADO').length,
  }), [exemplares])

  const filteredEx = useMemo(() =>
    statusFilter === 'TODOS'
      ? exemplares
      : exemplares.filter(e => e.status === statusFilter)
  , [exemplares, statusFilter])

  const lastLoanByCode = useMemo(() => {
    const map = new Map<string, LoanDTO>()
    const sorted = [...loans].sort((a, b) =>
      a.dataEmprestimo > b.dataEmprestimo ? -1 : 1
    )
    for (const l of sorted) {
      if (!map.has(l.codigoExemplar)) map.set(l.codigoExemplar, l)
    }
    return map
  }, [loans])

  const sortedLoans = useMemo(() =>
    [...loans].sort((a, b) => a.dataEmprestimo > b.dataEmprestimo ? -1 : 1)
  , [loans])

  // ── Mutations ──────────────────────────────────────────────────────────────

  const handleStatusChange = useCallback(async function handleStatusChange(exemplar: ExemplarDTO, newStatus: ExemplarStatus) {
    try {
      const res = await fetch(`/api/acervo/${exemplar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Resposta inválida do servidor')
      await loadData()
      toast({ variant: 'success', title: 'Status atualizado', description: `Exemplar ${exemplar.codigoExemplar} atualizado.` })
    } catch {
      toast({ variant: 'error', title: 'Falha ao atualizar status', description: 'Não foi possível atualizar o exemplar. Tente novamente.' })
    }
  }, [loadData, toast])

  const requestStatusChange = useCallback(async function requestStatusChange(exemplar: ExemplarDTO, newStatus: ExemplarStatus) {
    if (newStatus === 'BAIXADO') {
      setConfirmBaixar(exemplar)
    } else {
      await handleStatusChange(exemplar, newStatus)
    }
  }, [handleStatusChange])

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Carregando..."
          breadcrumb={
            <ObraBreadcrumb />
          }
        />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (error || exemplares.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Obra não encontrada"
          breadcrumb={<ObraBreadcrumb />}
        />
        <EmptyState
          icon={<BookOpen className="size-8 text-slate-200" />}
          title="Obra não encontrada"
          description="Esta obra não existe ou não possui exemplares ativos no catálogo."
          action={
            <Link href="/acervo/consulta">
              <Button variant="outline">Voltar ao Catálogo</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const assuntos = [obra.assunto1, obra.assunto2, obra.assunto3].filter(Boolean) as string[]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-16">

      {/* ══ 1. CABEÇALHO ════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <PageHeader
          title={obra.titulo}
          description={[obra.autor, obra.editora, obra.anoPublicacao].filter(Boolean).join(' · ')}
          breadcrumb={<ObraBreadcrumb titulo={obra.titulo} />}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => loadData()}>
                <RefreshCw className="size-3.5" />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditObraOpen(true)}>
                <Pencil className="size-3.5" />
                <span className="hidden sm:inline">Editar Obra</span>
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Exemplar</span>
              </Button>
              <ActionMenu
                align="end"
                items={[
                  {
                    label: 'Exportar dados',
                    icon: <Archive className="size-4" />,
                    onClick: () => {},
                    disabled: true,
                  },
                  {
                    label: 'Ir para Cadastro',
                    icon: <ExternalLink className="size-4" />,
                    onClick: () => router.push('/acervo/cadastro'),
                  },
                ]}
              />
            </div>
          }
        />

        {/* Ficha bibliográfica */}
        <div className="flex gap-5 p-5 bg-slate-50 rounded-xl border border-border/60">
          {/* capaUrl=null — BookCover exibe placeholder; troca automática quando DTO expor o campo */}
          <BookCover capaUrl={null} titulo={obra.titulo} obraId={obra.obraId} size="lg" />
          <div className="min-w-0 flex-1">
            {obra.subtitulo && (
              <p className="text-sm text-slate-500 italic mb-3">{obra.subtitulo}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
              <MetaField label="ISBN"    value={obra.isbn} />
              <MetaField label="Editora" value={obra.editora} />
              <MetaField label="Ano"     value={obra.anoPublicacao?.toString()} />
              <MetaField label="CDD"     value={obra.classificacao} />
              <MetaField label="Edição"  value={obra.edicao} />
              <MetaField label="Idioma"  value={null} missing />
              {obra.colecao       && <MetaField label="Coleção" value={obra.colecao} />}
              {obra.tipoPublicacao && <MetaField label="Tipo"   value={obra.tipoPublicacao} />}
            </div>
            {assuntos.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-1.5">Assuntos</p>
                <div className="flex flex-wrap gap-1.5">
                  {assuntos.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-white border border-border text-slate-500 rounded-full">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ 2. DISPONIBILIDADE ══════════════════════════════════════════════ */}
      <section>
        <div className="mb-4">
          <h2 className="ds-section-title">Disponibilidade</h2>
          <p className="ds-caption text-slate-400 mt-0.5">
            {stats.disponiveis > 0
              ? `${stats.disponiveis} ${stats.disponiveis === 1 ? 'exemplar disponível' : 'exemplares disponíveis'} para empréstimo`
              : 'Nenhum exemplar disponível no momento'
            }
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            label="Total"
            value={stats.total}
            icon={<BookOpen className="size-4" />}
            accent="neutral"
          />
          <KpiCard
            label="Disponíveis"
            value={stats.disponiveis}
            icon={<CheckCircle className="size-4" />}
            accent={stats.disponiveis > 0 ? 'success' : 'neutral'}
            onClick={() => setStatusFilter(f => f === 'DISPONIVEL' ? 'TODOS' : 'DISPONIVEL')}
          />
          <KpiCard
            label="Emprestados"
            value={stats.emprestados}
            icon={<BookMarked className="size-4" />}
            accent={stats.emprestados > 0 ? 'brand' : 'neutral'}
            onClick={() => setStatusFilter(f => f === 'EMPRESTADO' ? 'TODOS' : 'EMPRESTADO')}
          />
          <KpiCard
            label="Reservados"
            value={stats.reservados}
            icon={<Clock className="size-4" />}
            accent={stats.reservados > 0 ? 'warning' : 'neutral'}
            onClick={() => setStatusFilter(f => f === 'RESERVADO' ? 'TODOS' : 'RESERVADO')}
          />
          <KpiCard
            label="Manutenção"
            value={stats.manutencao}
            icon={<Wrench className="size-4" />}
            accent={stats.manutencao > 0 ? 'warning' : 'neutral'}
            onClick={() => setStatusFilter(f => f === 'MANUTENCAO' ? 'TODOS' : 'MANUTENCAO')}
          />
          <KpiCard
            label="Baixados"
            value={stats.baixados}
            icon={<Archive className="size-4" />}
            accent="neutral"
            onClick={() => setStatusFilter(f => f === 'BAIXADO' ? 'TODOS' : 'BAIXADO')}
          />
        </div>
      </section>

      {/* ══ 3. EXEMPLARES ═══════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="ds-section-title">Exemplares</h2>
            <p className="ds-caption text-slate-400 mt-0.5">
              {filteredEx.length} de {exemplares.length}
              {statusFilter !== 'TODOS' && ` · filtro: ${STATUS_LABEL[statusFilter as ExemplarStatus]}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statusFilter !== 'TODOS' && (
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter('TODOS')} className="text-slate-400">
                Limpar filtro
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="size-3.5" />
              Adicionar
            </Button>
          </div>
        </div>

        {filteredEx.length === 0 ? (
          <EmptyState
            title="Nenhum exemplar nesta categoria"
            description="Tente outro filtro ou adicione exemplares."
            action={
              <Button variant="outline" onClick={() => setStatusFilter('TODOS')}>Ver todos</Button>
            }
            size="sm"
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredEx.map(ex => (
              <ExemplarCard
                key={ex.id}
                exemplar={ex}
                lastLoan={lastLoanByCode.get(ex.codigoExemplar)}
                onLoan={setLoanTarget}
                onEdit={setEditTarget}
                onStatusChange={requestStatusChange}
                onReturn={setReturnTarget}
              />
            ))}
          </div>
        )}
      </section>

      {/* ══ 4. HISTÓRICO ════════════════════════════════════════════════════ */}
      <section>
        <div className="mb-4">
          <h2 className="ds-section-title">Histórico de Circulação</h2>
          <p className="ds-caption text-slate-400 mt-0.5">
            {loans.length} {loans.length === 1 ? 'movimentação' : 'movimentações'} registradas
          </p>
        </div>

        {sortedLoans.length === 0 ? (
          <EmptyState
            title="Sem histórico"
            description="Nenhum empréstimo registrado para os exemplares desta obra."
            size="sm"
          />
        ) : (
          <div className="border border-border/60 rounded-xl bg-white overflow-hidden">
            {sortedLoans.slice(0, 10).map((loan, i) => {
              const devolvido  = loan.status === 'DEVOLVIDO'
              const atrasado   = loan.status === 'ATRASADO'
              const cancelado  = loan.status === 'CANCELADO'

              return (
                <div
                  key={loan.id}
                  className={cn(
                    'flex items-start gap-4 px-5 py-4',
                    i > 0 && 'border-t border-border/40'
                  )}
                >
                  <div className={cn(
                    'size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    devolvido ? 'bg-green-50' : atrasado ? 'bg-red-50' : cancelado ? 'bg-slate-100' : 'bg-brand-50'
                  )}>
                    {devolvido
                      ? <CheckCircle  className="size-4 text-green-500" />
                      : atrasado
                        ? <AlertTriangle className="size-4 text-red-500" />
                        : <BookMarked className="size-4 text-brand-500" />
                    }
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">
                        {devolvido ? 'Devolvido por' : atrasado ? 'Em atraso —' : cancelado ? 'Cancelado —' : 'Emprestado para'}
                      </span>
                      {' '}{loan.nomeCompleto}
                    </p>
                    <p className="ds-caption text-slate-400 mt-0.5">
                      {loan.codigoExemplar}
                      {' · '}
                      {fmtDate(loan.dataEmprestimo)}
                      {loan.dataDevolucao && ` → devolvido ${fmtDate(loan.dataDevolucao)}`}
                    </p>
                  </div>

                  <StatusBadge
                    status={devolvido ? 'disponivel' : atrasado ? 'atrasado' : cancelado ? 'inativo' : 'emprestado'}
                    label={devolvido ? 'Devolvido' : atrasado ? 'Atrasado' : cancelado ? 'Cancelado' : 'Ativo'}
                    dot
                  />
                </div>
              )
            })}

            {sortedLoans.length > 10 && (
              <div className="px-5 py-3 border-t border-border/40 bg-slate-50/60">
                <p className="ds-caption text-slate-400">
                  Exibindo 10 de {sortedLoans.length} movimentações.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ══ 5. INFORMAÇÕES COMPLEMENTARES ═══════════════════════════════════ */}
      <section>
        <div className="mb-4">
          <h2 className="ds-section-title">Informações Complementares</h2>
          <p className="ds-caption text-slate-400 mt-0.5">Dados catalográficos adicionais</p>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Sinopse */}
          <Card className="border-border/60 shadow-none">
            <CardContent className="p-5">
              <h3 className="ds-label text-slate-500 mb-2">Sinopse / Resumo</h3>
              <p className="ds-caption text-slate-300 italic">
                Campo disponível no modelo (sinopse), não incluído no DTO atual.
                Disponível após implementar{' '}
                <code className="text-[11px] bg-slate-100 px-1 rounded not-italic text-slate-400">
                  GET /api/obras/{'{id}'}
                </code>.
              </p>
            </CardContent>
          </Card>

          {/* Ficha catalográfica */}
          <Card className="border-border/60 shadow-none">
            <CardContent className="p-5">
              <h3 className="ds-label text-slate-500 mb-3">Dados Catalográficos</h3>
              <div className="space-y-2">
                {[
                  { label: 'Tipo de publicação', value: obra.tipoPublicacao },
                  { label: 'Coleção',             value: obra.colecao },
                  { label: 'Edição',              value: obra.edicao },
                  { label: 'ID interno (Obra)',   value: String(obra.obraId) },
                ]
                  .filter(row => row.value)
                  .map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-2">
                      <span className="ds-caption text-slate-400">{label}</span>
                      <span className="ds-caption text-slate-700 text-right">{value}</span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ══ Overlays ════════════════════════════════════════════════════════ */}

      <EmprestimoModal
        open={!!loanTarget}
        onClose={() => setLoanTarget(null)}
        exemplar={loanTarget}
        onSuccess={loadData}
      />

      <DevolucaoModal
        open={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        exemplar={returnTarget}
        onSuccess={() => { loadData(); setReturnTarget(null) }}
      />

      <EditExemplarDrawer
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        exemplar={editTarget}
        onSaved={() => { loadData(); setEditTarget(null) }}
      />

      <AddExemplarDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        obra={obra ?? null}
        onSaved={() => { loadData(); setAddOpen(false) }}
      />

      <EditObraDrawer
        open={editObraOpen}
        obra={obra ?? null}
        onClose={() => setEditObraOpen(false)}
        onSaved={() => { loadData(); setEditObraOpen(false) }}
      />

      <ConfirmDialog
        open={!!confirmBaixar}
        onClose={() => setConfirmBaixar(null)}
        onConfirm={async () => {
          if (confirmBaixar) await handleStatusChange(confirmBaixar, 'BAIXADO')
          setConfirmBaixar(null)
        }}
        intent="destructive"
        title="Baixar exemplar?"
        description={`O exemplar ${confirmBaixar?.codigoExemplar ?? ''} será marcado como baixado e ficará inativo no sistema. Esta ação não pode ser desfeita.`}
        confirmLabel="Baixar exemplar"
      />
    </div>
  )
}
