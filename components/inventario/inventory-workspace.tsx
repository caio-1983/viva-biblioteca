'use client'

import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react'
import Link from 'next/link'
import {
  Search, QrCode, CheckCircle2, AlertTriangle,
  Wrench, AlertOctagon, BookX, Loader2, Boxes,
  BookOpen, RefreshCw, X, Package, ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KpiCard } from '@/components/ui/kpi-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Drawer } from '@/components/ui/drawer'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { usePageTitle } from '@/components/page-context'

// ─── Types ──────────────────────────────────────────────────────────────────

type StatusExemplar =
  | 'DISPONIVEL'
  | 'EMPRESTADO'
  | 'RESERVADO'
  | 'MANUTENCAO'
  | 'EXTRAVIADO'
  | 'BAIXADO'

type WorkspaceTab = 'pesquisa' | 'inventario'
type SearchKind = 'codigo' | 'texto'
type ScanResult = 'ok' | 'divergencia' | 'achado' | 'nao_encontrado'

interface ExemplarItem {
  id: number
  codigoExemplar: string
  titulo: string
  autor: string | null
  classificacao: string | null
  assunto1: string | null
  status: StatusExemplar
  ativo: boolean
}

interface ExemplarDetail {
  id: number
  codigoExemplar: string
  tombo: string | null
  observacao: string | null
  status: StatusExemplar
  ativo: boolean
  obraId: number
  titulo: string
  autor: string | null
  classificacao: string | null
  isbn: string | null
  editora: string | null
  anoPublicacao: number | null
}

interface StatsData {
  total: number
  disponivel: number
  emprestado: number
  extraviado: number
  manutencao: number
}

interface ScanEntry {
  codigoExemplar: string
  titulo: string
  status: StatusExemplar | null
  scanResult: ScanResult
  message: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type BadgeStatus = 'disponivel' | 'emprestado' | 'reservado' | 'manutencao' | 'inativo' | 'atrasado'

function toStatusBadge(s: StatusExemplar): { status: BadgeStatus; label?: string } {
  switch (s) {
    case 'DISPONIVEL': return { status: 'disponivel' }
    case 'EMPRESTADO': return { status: 'emprestado' }
    case 'RESERVADO':  return { status: 'reservado' }
    case 'MANUTENCAO': return { status: 'manutencao' }
    case 'EXTRAVIADO': return { status: 'inativo', label: 'Extraviado' }
    case 'BAIXADO':    return { status: 'inativo', label: 'Baixado' }
  }
}

function detectKind(q: string): SearchKind {
  return q.trim().toUpperCase().startsWith('EX') ? 'codigo' : 'texto'
}

function getScanResult(status: StatusExemplar | null): { scanResult: ScanResult; message: string } {
  if (!status) return { scanResult: 'nao_encontrado', message: 'Código não encontrado no acervo' }
  switch (status) {
    case 'DISPONIVEL': return { scanResult: 'ok',          message: 'Encontrado — status correto' }
    case 'RESERVADO':  return { scanResult: 'divergencia', message: 'Divergência — exemplar reservado, deveria estar separado' }
    case 'EMPRESTADO': return { scanResult: 'divergencia', message: 'Divergência — registrado como emprestado' }
    case 'MANUTENCAO': return { scanResult: 'divergencia', message: 'Divergência — em manutenção, não deveria estar na estante' }
    case 'EXTRAVIADO': return { scanResult: 'achado',      message: 'Achado! — estava registrado como extraviado' }
    case 'BAIXADO':    return { scanResult: 'divergencia', message: 'Divergência — exemplar baixado' }
  }
}

function scanRowColors(r: ScanResult): string {
  switch (r) {
    case 'ok':           return 'border-emerald-200 bg-emerald-50 text-emerald-900'
    case 'achado':       return 'border-blue-200 bg-blue-50 text-blue-900'
    case 'divergencia':  return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'nao_encontrado': return 'border-red-200 bg-red-50 text-red-900'
  }
}

// ─── QuickActionsDrawer ──────────────────────────────────────────────────────

interface QuickActionsDrawerProps {
  open: boolean
  onClose: () => void
  exemplar: ExemplarDetail | null
  detailLoading: boolean
  onUpdated: (updated: ExemplarDetail) => void
}

function QuickActionsDrawer({
  open, onClose, exemplar, detailLoading, onUpdated,
}: QuickActionsDrawerProps) {
  const { toast } = useToast()
  const [obs, setObs] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [obsDirty, setObsDirty] = useState(false)
  const [confirmBaixar, setConfirmBaixar] = useState(false)

  useEffect(() => {
    if (exemplar) {
      setObs(exemplar.observacao ?? '')
      setObsDirty(false)
      setError(null)
    }
  }, [exemplar])

  async function changeStatus(newStatus: StatusExemplar) {
    if (!exemplar) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/acervo/${exemplar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar status')
      const updated = await res.json() as ExemplarDetail
      onUpdated(updated)
      toast({ variant: 'success', title: 'Status atualizado', description: `Exemplar ${exemplar.codigoExemplar} atualizado com sucesso.` })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setError(msg)
      toast({ variant: 'error', title: 'Falha ao atualizar status', description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  async function saveObs() {
    if (!exemplar) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/acervo/${exemplar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacao: obs }),
      })
      if (!res.ok) throw new Error('Erro ao salvar observação')
      const updated = await res.json() as ExemplarDetail
      onUpdated(updated)
      setObsDirty(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSubmitting(false)
    }
  }

  const badge = exemplar ? toStatusBadge(exemplar.status) : null

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={exemplar?.codigoExemplar ?? '…'}
      description={exemplar?.titulo}
      footer={
        <Button variant="outline" onClick={onClose}>Fechar</Button>
      }
    >
      {detailLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </div>
      )}

      {!detailLoading && exemplar && (
        <div className="space-y-6">
          {/* Status atual */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Status atual</span>
            {badge && <StatusBadge status={badge.status} label={badge.label} />}
          </div>

          {/* Identificação */}
          <div className="rounded-lg bg-slate-50 p-4 space-y-2 text-sm">
            {exemplar.tombo && (
              <div className="flex justify-between">
                <span className="text-slate-500">Tombo</span>
                <span className="font-medium font-mono">{exemplar.tombo}</span>
              </div>
            )}
            {exemplar.autor && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">Autor</span>
                <span className="font-medium text-right">{exemplar.autor}</span>
              </div>
            )}
            {exemplar.classificacao && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">Classificação</span>
                <span className="font-medium text-right">{exemplar.classificacao}</span>
              </div>
            )}
            {exemplar.editora && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">Editora</span>
                <span className="font-medium text-right">{exemplar.editora}</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Alterar status */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Alterar status
            </p>
            <div className="grid grid-cols-2 gap-2">
              {exemplar.status !== 'DISPONIVEL' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 justify-start"
                  disabled={submitting}
                  onClick={() => changeStatus('DISPONIVEL')}
                >
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Disponível
                </Button>
              )}
              {exemplar.status !== 'MANUTENCAO' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 justify-start"
                  disabled={submitting}
                  onClick={() => changeStatus('MANUTENCAO')}
                >
                  <Wrench className="size-4 text-amber-600" />
                  Manutenção
                </Button>
              )}
              {exemplar.status !== 'EXTRAVIADO' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 justify-start"
                  disabled={submitting}
                  onClick={() => changeStatus('EXTRAVIADO')}
                >
                  <AlertOctagon className="size-4 text-orange-600" />
                  Extraviado
                </Button>
              )}
              {exemplar.status !== 'BAIXADO' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 justify-start border-red-200 text-red-700 hover:bg-red-50"
                  disabled={submitting}
                  onClick={() => setConfirmBaixar(true)}
                >
                  <BookX className="size-4" />
                  Baixar exemplar
                </Button>
              )}
            </div>
          </div>

          {/* Observação */}
          <div>
            <Label htmlFor="inv-obs" className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Observação
            </Label>
            <textarea
              id="inv-obs"
              value={obs}
              onChange={e => { setObs(e.target.value); setObsDirty(true) }}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder="Notas sobre condição física, localização provisória…"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={submitting || !obsDirty}
              onClick={saveObs}
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Salvar observação
            </Button>
          </div>

          {/* Melhorias futuras — documentadas */}
          <div className="rounded-lg border border-dashed border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Melhorias futuras
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex gap-2">
                <span className="shrink-0 text-slate-300">①</span>
                <span>
                  <strong className="text-slate-500">Localização</strong> — expor campo{' '}
                  <code className="bg-slate-100 px-1 rounded">localizacao</code> no{' '}
                  <code className="bg-slate-100 px-1 rounded">ExemplarDetailDTO</code> e no{' '}
                  <code className="bg-slate-100 px-1 rounded">ExemplarUpdateSchema</code>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-slate-300">②</span>
                <span>
                  <strong className="text-slate-500">Estado físico</strong> — adicionar enum{' '}
                  <code className="bg-slate-100 px-1 rounded">EstadoFisico</code> no schema Prisma
                  (NOVO / BOM / REGULAR / RUIM / PESSIMO) e expor na API
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-slate-300">③</span>
                <span>
                  <strong className="text-slate-500">Reimprimir etiqueta</strong> — requer endpoint{' '}
                  <code className="bg-slate-100 px-1 rounded">GET /api/acervo/:id/etiqueta</code>{' '}
                  retornando PDF ou ZPL para impressora térmica
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmBaixar}
        onClose={() => setConfirmBaixar(false)}
        onConfirm={async () => {
          setConfirmBaixar(false)
          await changeStatus('BAIXADO')
        }}
        intent="destructive"
        title="Baixar exemplar?"
        description={`O exemplar ${exemplar?.codigoExemplar} será marcado como baixado e ficará inativo no sistema. Esta ação não pode ser desfeita.`}
        confirmLabel="Baixar exemplar"
        loading={submitting}
      />
    </Drawer>
  )
}

// ─── ResultCard ──────────────────────────────────────────────────────────────

const ResultCard = memo(function ResultCard({
  item,
  onActions,
}: {
  item: ExemplarItem
  onActions: (id: number) => void
}) {
  const badge = toStatusBadge(item.status)
  return (
    <Card className="border border-border/60 bg-white shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-sm font-semibold text-slate-900">
                {item.codigoExemplar}
              </span>
              <StatusBadge status={badge.status} label={badge.label} />
            </div>
            <p className="text-sm font-medium text-slate-800 truncate">{item.titulo}</p>
            {item.autor && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{item.autor}</p>
            )}
            {item.classificacao && (
              <p className="text-xs text-slate-400 mt-0.5">{item.classificacao}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => onActions(item.id)}
          >
            Ações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

// ─── ScanRow ─────────────────────────────────────────────────────────────────

const SCAN_ICONS: Record<ScanResult, React.ReactNode> = {
  ok:              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />,
  achado:          <CheckCircle2 className="size-4 shrink-0 text-blue-600" />,
  divergencia:     <AlertTriangle className="size-4 shrink-0 text-amber-600" />,
  nao_encontrado:  <AlertOctagon  className="size-4 shrink-0 text-red-600" />,
}

function ScanRow({ entry }: { entry: ScanEntry }) {
  const badge = entry.status ? toStatusBadge(entry.status) : null
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border px-4 py-3', scanRowColors(entry.scanResult))}>
      {SCAN_ICONS[entry.scanResult]}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-semibold">{entry.codigoExemplar}</span>
          {badge && <StatusBadge status={badge.status} label={badge.label} />}
        </div>
        {entry.titulo !== '—' && (
          <p className="text-xs truncate opacity-80 mt-0.5">{entry.titulo}</p>
        )}
      </div>
      <p className="text-xs text-right shrink-0 max-w-40 opacity-70">{entry.message}</p>
    </div>
  )
}

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

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

// ─── InventoryWorkspace (main export) ───────────────────────────────────────

export function InventoryWorkspace() {
  const { setPageInfo } = usePageTitle()

  useEffect(() => {
    setPageInfo('Inventário', 'Conferência patrimonial de exemplares')
  }, [setPageInfo])

  const [allExemplares, setAllExemplares] = useState<ExemplarItem[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(false)

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('pesquisa')
  const [query, setQuery] = useState('')

  // Quick actions drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerDetail, setDrawerDetail] = useState<ExemplarDetail | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)

  // Modo inventário
  const [scanInput, setScanInput] = useState('')
  const [scanSession, setScanSession] = useState<ScanEntry[]>([])
  const scanRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setDataLoading(true)
    setDataError(false)
    try {
      const opts = signal ? { signal } : {}
      const [acervoRes, statsRes] = await Promise.all([
        fetch('/api/acervo?limit=500', opts).then(r => r.json()),
        fetch('/api/acervo/stats', opts).then(r => r.json()),
      ])
      setAllExemplares((acervoRes.data ?? []) as ExemplarItem[])
      setStats(statsRes as StatsData)
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

  // Auto-focus scanner input when switching tabs
  useEffect(() => {
    if (activeTab === 'inventario') {
      setTimeout(() => scanRef.current?.focus(), 120)
    } else {
      setTimeout(() => searchRef.current?.focus(), 120)
    }
  }, [activeTab])

  // Search
  const searchKind = useMemo<SearchKind>(() => detectKind(query), [query])

  const searchResults = useMemo<ExemplarItem[]>(() => {
    const q = query.trim()
    if (!q) return []
    if (searchKind === 'codigo') {
      const upper = q.toUpperCase()
      return allExemplares.filter(e => e.codigoExemplar.includes(upper))
    }
    const lower = q.toLowerCase()
    return allExemplares
      .filter(e =>
        e.titulo.toLowerCase().includes(lower) ||
        e.autor?.toLowerCase().includes(lower) ||
        e.classificacao?.toLowerCase().includes(lower) ||
        e.assunto1?.toLowerCase().includes(lower)
      )
      .slice(0, 20)
  }, [allExemplares, query, searchKind])

  // Open detail drawer
  const openActions = useCallback(async function openActions(id: number) {
    setDrawerOpen(true)
    setDrawerLoading(true)
    setDrawerDetail(null)
    try {
      const res = await fetch(`/api/acervo/${id}`)
      if (!res.ok) throw new Error()
      const detail = await res.json() as ExemplarDetail
      setDrawerDetail(detail)
    } finally {
      setDrawerLoading(false)
    }
  }, [])

  function handleUpdated(updated: ExemplarDetail) {
    setDrawerDetail(updated)
    setAllExemplares(prev =>
      prev.map(e => e.id === updated.id ? { ...e, status: updated.status } : e)
    )
  }

  // Scan submit
  function handleScan(e: React.FormEvent) {
    e.preventDefault()
    const code = scanInput.trim().toUpperCase()
    if (!code) return

    const found = allExemplares.find(e => e.codigoExemplar === code)
    const { scanResult, message } = getScanResult(found?.status ?? null)

    setScanSession(prev => [
      {
        codigoExemplar: code,
        titulo: found?.titulo ?? '—',
        status: found?.status ?? null,
        scanResult,
        message,
      },
      ...prev,
    ])
    setScanInput('')
    setTimeout(() => scanRef.current?.focus(), 50)
  }

  const scanStats = useMemo(() => ({
    total:        scanSession.length,
    ok:           scanSession.filter(e => e.scanResult === 'ok' || e.scanResult === 'achado').length,
    divergencias: scanSession.filter(e => e.scanResult === 'divergencia' || e.scanResult === 'nao_encontrado').length,
  }), [scanSession])

  const TABS = [
    { id: 'pesquisa'   as WorkspaceTab, label: 'Pesquisa Patrimonial', icon: <Search className="size-4" /> },
    { id: 'inventario' as WorkspaceTab, label: 'Modo Inventário',       icon: <QrCode  className="size-4" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label="Acervo total"
            value={stats?.total ?? 0}
            icon={<Boxes className="size-5" />}
            loading={dataLoading}
          />
          <KpiCard
            label="Disponíveis"
            value={stats?.disponivel ?? 0}
            accent="success"
            icon={<BookOpen className="size-5" />}
            loading={dataLoading}
          />
          <KpiCard
            label="Manutenção"
            value={stats?.manutencao ?? 0}
            accent="warning"
            icon={<Wrench className="size-5" />}
            loading={dataLoading}
          />
          <KpiCard
            label="Extraviados"
            value={stats?.extraviado ?? 0}
            accent="warning"
            icon={<AlertOctagon className="size-5" />}
            loading={dataLoading}
          />
        </div>

        {/* Data error */}
        {dataError && (
          <EmptyState
            icon={<AlertTriangle className="size-7 text-red-400" />}
            title="Não foi possível carregar o acervo"
            description="Ocorreu um erro ao buscar os dados. Tente novamente."
            action={
              <Button variant="outline" size="sm" onClick={() => loadData()} className="gap-2">
                <RefreshCw className="size-4" />
                Tentar novamente
              </Button>
            }
          />
        )}

        {/* Tab Bar */}
        <div className="flex p-1 bg-slate-100 rounded-xl gap-1 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Pesquisa Tab ─────────────────────────────────────────────── */}
        {activeTab === 'pesquisa' && (
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <Input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="EX000021 · Tombo · Título · Autor…"
                  className="pl-9"
                />
              </div>
              {query.trim() && (
                <span className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shrink-0',
                  searchKind === 'codigo'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                )}>
                  {searchKind === 'codigo'
                    ? <QrCode className="size-3" />
                    : <Search className="size-3" />
                  }
                  {searchKind === 'codigo' ? 'Código EX' : 'Texto'}
                </span>
              )}
            </div>

            {/* Results */}
            {!query.trim() ? (
              <EmptyState
                icon={<ClipboardList className="size-10" />}
                title="Pesquisa patrimonial"
                description="Digite o código EX ou texto para localizar um exemplar. Pesquisa por tombo e localização requer suporte na API."
                size="md"
              />
            ) : dataLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-6 animate-spin text-slate-400" />
              </div>
            ) : searchResults.length === 0 ? (
              <EmptyState
                icon={<Package className="size-10" />}
                title="Nenhum exemplar encontrado"
                description={`Sem resultados para "${query.trim()}".`}
                size="md"
              />
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
                  {searchResults.length === 20 && ' (mostrando os primeiros 20)'}
                </p>
                {searchResults.map(item => (
                  <ResultCard key={item.id} item={item} onActions={openActions} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Modo Inventário Tab ───────────────────────────────────────── */}
        {activeTab === 'inventario' && (
          <div className="space-y-4">
            {/* Session summary bar */}
            {scanSession.length > 0 && (
              <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-border/60 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="font-bold text-slate-900">{scanStats.total}</span>
                  <span className="text-slate-500">lidos</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-1.5 text-sm text-emerald-700">
                  <CheckCircle2 className="size-4" />
                  <span className="font-bold">{scanStats.ok}</span>
                  <span>ok</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-1.5 text-sm text-amber-700">
                  <AlertTriangle className="size-4" />
                  <span className="font-bold">{scanStats.divergencias}</span>
                  <span>divergência{scanStats.divergencias !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setScanSession([])}
                >
                  <X className="size-3.5" />
                  Limpar sessão
                </Button>
              </div>
            )}

            {/* Scanner input — keyboard-first */}
            <form onSubmit={handleScan} className="flex gap-2">
              <div className="relative flex-1">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <Input
                  ref={scanRef}
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  placeholder="Escaneie ou digite o código EX e pressione Enter…"
                  className="pl-9 font-mono text-base h-12 tracking-wide"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-6 shrink-0"
                disabled={!scanInput.trim() || dataLoading}
              >
                Confirmar
              </Button>
            </form>

            {/* Hint */}
            <p className="text-xs text-slate-400 text-center">
              Scanner USB envia Enter automaticamente · Mouse praticamente desnecessário
            </p>

            {/* Scan list */}
            {scanSession.length === 0 ? (
              <EmptyState
                icon={<QrCode className="size-10" />}
                title="Aguardando leitura"
                description="Escaneie o código de barras do exemplar ou digite o código EX e pressione Enter."
                size="md"
              />
            ) : (
              <div className="space-y-2">
                {scanSession.map((entry, i) => (
                  <ScanRow key={`${entry.codigoExemplar}-${i}`} entry={entry} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Quick Actions Drawer */}
      <QuickActionsDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerDetail(null) }}
        exemplar={drawerDetail}
        detailLoading={drawerLoading}
        onUpdated={handleUpdated}
      />
    </div>
  )
}
