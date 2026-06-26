'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter }   from 'next/navigation'
import Link             from 'next/link'
import {
  BookOpen, BookMarked, ArrowRight, ChevronLeft, ChevronRight,
  SlidersHorizontal, ArrowUpDown, X, Plus, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { PageHeader }       from '@/components/ui/page-header'
import { SearchBar }        from '@/components/ui/search-bar'
import { Button }           from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge }      from '@/components/ui/status-badge'
import { ActionMenu }       from '@/components/ui/action-menu'
import {
  DropdownMenu, DropdownTrigger, DropdownContent, DropdownItem,
} from '@/components/ui/action-menu'
import { Drawer }           from '@/components/ui/drawer'
import { Input }            from '@/components/ui/input'
import { EmptyState }       from '@/components/ui/empty-state'
import { SkeletonCard }     from '@/components/ui/loading-state'

// ── Types ─────────────────────────────────────────────────────────────────────

type ExemplarDTO = {
  id: number
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
  status: 'DISPONIVEL' | 'EMPRESTADO' | 'RESERVADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO'
}

type ObraCard = {
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
  totalExemplares: number
  disponiveis: number
  emprestados: number
  reservados: number
  emManutencao: number
  extraviados: number
}

type StatusFilter = 'TODOS' | 'DISPONIVEL' | 'EMPRESTADO' | 'RESERVADO' | 'INDISPONIVEL'
type SortOption   = 'titulo-asc' | 'titulo-desc' | 'autor' | 'recentes'

type FilterState = {
  status:  StatusFilter
  assunto: string
  editora: string
  cdd:     string
  anoMin:  string
  anoMax:  string
}

const FILTER_DEFAULT: FilterState = {
  status:  'TODOS',
  assunto: '',
  editora: '',
  cdd:     '',
  anoMin:  '',
  anoMax:  '',
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function groupByObra(exemplares: ExemplarDTO[]): ObraCard[] {
  const map = new Map<number, ObraCard>()

  for (const ex of exemplares) {
    if (!map.has(ex.obraId)) {
      map.set(ex.obraId, {
        obraId: ex.obraId, isbn: ex.isbn, tipoPublicacao: ex.tipoPublicacao,
        classificacao: ex.classificacao, titulo: ex.titulo, subtitulo: ex.subtitulo,
        autor: ex.autor, edicao: ex.edicao, editora: ex.editora,
        anoPublicacao: ex.anoPublicacao, assunto1: ex.assunto1,
        assunto2: ex.assunto2, assunto3: ex.assunto3, colecao: ex.colecao,
        totalExemplares: 0, disponiveis: 0, emprestados: 0,
        reservados: 0, emManutencao: 0, extraviados: 0,
      })
    }

    const o = map.get(ex.obraId)!
    o.totalExemplares++
    switch (ex.status) {
      case 'DISPONIVEL': o.disponiveis++;  break
      case 'EMPRESTADO': o.emprestados++;  break
      case 'RESERVADO':  o.reservados++;   break
      case 'MANUTENCAO': o.emManutencao++; break
      case 'EXTRAVIADO': o.extraviados++;  break
    }
  }

  return Array.from(map.values())
}

function deriveStatus(o: ObraCard): 'disponivel' | 'emprestado' | 'reservado' | 'inativo' {
  if (o.disponiveis > 0)  return 'disponivel'
  if (o.reservados  > 0)  return 'reservado'
  if (o.emprestados > 0)  return 'emprestado'
  return 'inativo'
}

function matchesSearch(o: ObraCard, q: string): boolean {
  if (!q.trim()) return true
  const n = q.toLowerCase().trim()
  return [o.titulo, o.subtitulo, o.autor, o.isbn, o.classificacao,
          o.editora, o.assunto1, o.assunto2, o.assunto3, o.colecao]
    .some(f => f?.toLowerCase().includes(n) ?? false)
}

function applyFilters(obras: ObraCard[], f: FilterState): ObraCard[] {
  return obras.filter(o => {
    if (f.status !== 'TODOS') {
      const s = deriveStatus(o)
      if (f.status === 'DISPONIVEL'   && s !== 'disponivel') return false
      if (f.status === 'EMPRESTADO'   && s !== 'emprestado') return false
      if (f.status === 'RESERVADO'    && s !== 'reservado')  return false
      if (f.status === 'INDISPONIVEL' && s !== 'inativo')    return false
    }
    if (f.assunto) {
      const n = f.assunto.toLowerCase()
      if (![o.assunto1, o.assunto2, o.assunto3].some(a => a?.toLowerCase().includes(n))) return false
    }
    if (f.editora && !o.editora?.toLowerCase().includes(f.editora.toLowerCase())) return false
    if (f.cdd     && !o.classificacao?.toLowerCase().includes(f.cdd.toLowerCase())) return false
    if (f.anoMin  && o.anoPublicacao !== null && o.anoPublicacao < Number(f.anoMin)) return false
    if (f.anoMax  && o.anoPublicacao !== null && o.anoPublicacao > Number(f.anoMax)) return false
    return true
  })
}

function sortObras(obras: ObraCard[], sort: SortOption): ObraCard[] {
  const arr = [...obras]
  const pt = (a: string, b: string) => a.localeCompare(b, 'pt-BR')
  if (sort === 'titulo-asc')  return arr.sort((a, b) => pt(a.titulo, b.titulo))
  if (sort === 'titulo-desc') return arr.sort((a, b) => pt(b.titulo, a.titulo))
  if (sort === 'autor')       return arr.sort((a, b) => pt(a.autor ?? '', b.autor ?? ''))
  if (sort === 'recentes')    return arr.sort((a, b) => b.obraId - a.obraId)
  return arr
}

function countActiveFilters(f: FilterState): number {
  return (f.status !== 'TODOS' ? 1 : 0) +
    [f.assunto, f.editora, f.cdd, f.anoMin, f.anoMax].filter(Boolean).length
}

// ── CoverPlaceholder ──────────────────────────────────────────────────────────

const COVER_PALETTES = [
  'bg-brand-50 text-brand-600 border-brand-100',
  'bg-violet-50 text-violet-600 border-violet-100',
  'bg-teal-50 text-teal-600 border-teal-100',
  'bg-amber-50 text-amber-600 border-amber-100',
  'bg-rose-50 text-rose-600 border-rose-100',
]

function CoverPlaceholder({ titulo, obraId }: { titulo: string; obraId: number }) {
  const palette = COVER_PALETTES[obraId % COVER_PALETTES.length]
  return (
    <div className={cn(
      'flex items-center justify-center w-10 h-14 rounded-md border shrink-0 select-none',
      palette
    )}>
      <span className="text-base font-bold">{titulo[0]?.toUpperCase() ?? '?'}</span>
    </div>
  )
}

// ── BookCard ──────────────────────────────────────────────────────────────────

function BookCard({
  obra, onOpen, onNewLoan,
}: {
  obra: ObraCard
  onOpen: () => void
  onNewLoan: () => void
}) {
  const status  = deriveStatus(obra)
  const assuntos = [obra.assunto1, obra.assunto2, obra.assunto3].filter(Boolean) as string[]

  return (
    <Card
      className="border border-border/60 bg-white shadow-none hover:shadow-sm hover:border-brand-200 transition-all cursor-pointer group"
      onClick={onOpen}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Capa */}
          <CoverPlaceholder titulo={obra.titulo} obraId={obra.obraId} />

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">

            {/* Linha: título + badges + menu */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="ds-card-title leading-snug truncate group-hover:text-brand-600 transition-colors">
                  {obra.titulo}
                </h3>
                {obra.subtitulo && (
                  <p className="ds-caption text-slate-400 truncate mt-0.5">{obra.subtitulo}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge status={status} />
                {/* Parar propagação do click no menu */}
                <span onClick={e => e.stopPropagation()}>
                  <ActionMenu
                    align="end"
                    items={[
                      {
                        label: 'Abrir obra',
                        icon:  <BookOpen className="size-4" />,
                        onClick: onOpen,
                      },
                      {
                        label:    'Novo empréstimo',
                        icon:     <BookMarked className="size-4" />,
                        onClick:  onNewLoan,
                        disabled: obra.disponiveis === 0,
                      },
                    ]}
                  />
                </span>
              </div>
            </div>

            {/* Metadados bibliográficos */}
            <div className="space-y-0.5">
              {(obra.autor || obra.editora || obra.anoPublicacao) && (
                <div className="flex items-center gap-1 flex-wrap">
                  {obra.autor && (
                    <span className="ds-caption text-slate-600 font-medium">{obra.autor}</span>
                  )}
                  {obra.autor && (obra.editora || obra.anoPublicacao) && (
                    <span className="ds-caption text-slate-300">·</span>
                  )}
                  {obra.editora && (
                    <span className="ds-caption text-slate-400">{obra.editora}</span>
                  )}
                  {obra.editora && obra.anoPublicacao && (
                    <span className="ds-caption text-slate-300">·</span>
                  )}
                  {obra.anoPublicacao && (
                    <span className="ds-caption text-slate-400">{obra.anoPublicacao}</span>
                  )}
                </div>
              )}

              {(obra.isbn || obra.classificacao) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {obra.isbn && (
                    <span className="ds-caption text-slate-400">ISBN {obra.isbn}</span>
                  )}
                  {obra.classificacao && (
                    <span className="ds-caption text-slate-400">CDD {obra.classificacao}</span>
                  )}
                </div>
              )}

              {assuntos.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {assuntos.slice(0, 2).map((a, i) => (
                    <span
                      key={i}
                      className="inline-block px-1.5 py-0.5 text-[11px] bg-slate-100 text-slate-500 rounded leading-none"
                    >
                      {a}
                    </span>
                  ))}
                  {assuntos.length > 2 && (
                    <span className="ds-caption text-slate-400">+{assuntos.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            {/* Exemplares + CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="ds-caption font-medium text-slate-700">
                  {obra.totalExemplares} {obra.totalExemplares === 1 ? 'exemplar' : 'exemplares'}
                </span>

                {obra.disponiveis > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-status-available inline-block" />
                    <span className="ds-caption text-status-available font-medium">
                      {obra.disponiveis} disp.
                    </span>
                  </span>
                )}
                {obra.emprestados > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-status-borrowed inline-block" />
                    <span className="ds-caption text-status-borrowed">
                      {obra.emprestados} empr.
                    </span>
                  </span>
                )}
                {obra.reservados > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-status-reserved inline-block" />
                    <span className="ds-caption text-status-reserved">
                      {obra.reservados} reserv.
                    </span>
                  </span>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-slate-400 hover:text-brand-600 shrink-0 h-7 px-2"
                onClick={e => { e.stopPropagation(); onOpen() }}
              >
                Abrir
                <ArrowRight className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── FilterDrawer ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'TODOS',        label: 'Todos'        },
  { value: 'DISPONIVEL',   label: 'Disponível'   },
  { value: 'EMPRESTADO',   label: 'Emprestado'   },
  { value: 'RESERVADO',    label: 'Reservado'    },
  { value: 'INDISPONIVEL', label: 'Indisponível' },
]

function FilterDrawer({
  open, onClose, filters, onApply,
}: {
  open:     boolean
  onClose:  () => void
  filters:  FilterState
  onApply:  (f: FilterState) => void
}) {
  const [draft, setDraft] = useState<FilterState>(filters)

  // Sincronizar rascunho ao abrir
  useEffect(() => { if (open) setDraft(filters) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClear() {
    setDraft(FILTER_DEFAULT)
    onApply(FILTER_DEFAULT)
  }

  function handleApply() {
    onApply(draft)
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filtros"
      description="Refine os resultados do catálogo"
      width="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleClear}>Limpar</Button>
          <Button onClick={handleApply}>Aplicar filtros</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Disponibilidade */}
        <div className="space-y-2">
          <p className="ds-label text-slate-600">Disponibilidade</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDraft(d => ({ ...d, status: opt.value }))}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  draft.status === opt.value
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-slate-600 border-border hover:border-brand-300'
                )}
              >
                {draft.status === opt.value && <Check className="size-3" />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assunto */}
        <div className="space-y-2">
          <label className="ds-label text-slate-600" htmlFor="f-assunto">Assunto</label>
          <Input
            id="f-assunto"
            placeholder="ex: Teologia"
            value={draft.assunto}
            onChange={e => setDraft(d => ({ ...d, assunto: e.target.value }))}
          />
        </div>

        {/* Editora */}
        <div className="space-y-2">
          <label className="ds-label text-slate-600" htmlFor="f-editora">Editora</label>
          <Input
            id="f-editora"
            placeholder="ex: Vida Nova"
            value={draft.editora}
            onChange={e => setDraft(d => ({ ...d, editora: e.target.value }))}
          />
        </div>

        {/* CDD */}
        <div className="space-y-2">
          <label className="ds-label text-slate-600" htmlFor="f-cdd">CDD — Classificação</label>
          <Input
            id="f-cdd"
            placeholder="ex: 230"
            value={draft.cdd}
            onChange={e => setDraft(d => ({ ...d, cdd: e.target.value }))}
          />
        </div>

        {/* Ano */}
        <div className="space-y-2">
          <p className="ds-label text-slate-600">Ano de publicação</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="De"
              value={draft.anoMin}
              onChange={e => setDraft(d => ({ ...d, anoMin: e.target.value }))}
              className="w-24"
            />
            <span className="ds-caption text-slate-400">até</span>
            <Input
              type="number"
              placeholder="Até"
              value={draft.anoMax}
              onChange={e => setDraft(d => ({ ...d, anoMax: e.target.value }))}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </Drawer>
  )
}

// ── CatalogView — componente principal ────────────────────────────────────────

const SORT_LABELS: Record<SortOption, string> = {
  'titulo-asc':  'Título A→Z',
  'titulo-desc': 'Título Z→A',
  'autor':       'Autor A→Z',
  'recentes':    'Mais recentes',
}

const STATUS_QUICK: { value: StatusFilter; label: string }[] = [
  { value: 'TODOS',      label: 'Todos'       },
  { value: 'DISPONIVEL', label: 'Disponíveis' },
  { value: 'EMPRESTADO', label: 'Emprestados' },
  { value: 'RESERVADO',  label: 'Reservados'  },
]

const PER_PAGE_OPTIONS = [12, 24, 48] as const

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

export function CatalogView() {
  const router = useRouter()

  const [allObras,    setAllObras]    = useState<ObraCard[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(false)
  const [query,       setQuery]       = useState('')
  const [filters,     setFilters]     = useState<FilterState>(FILTER_DEFAULT)
  const [sort,        setSort]        = useState<SortOption>('titulo-asc')
  const [page,        setPage]        = useState(1)
  const [perPage,     setPerPage]     = useState<24 | 12 | 48>(24)
  const [drawerOpen,  setDrawerOpen]  = useState(false)

  // Buscar todos os exemplares na montagem
  useEffect(() => {
    fetch('/api/acervo?limit=500')
      .then(r => {
        if (!r.ok) throw new Error('Falha na requisição')
        return r.json()
      })
      .then(data => setAllObras(groupByObra(data.data as ExemplarDTO[])))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // Dados derivados
  const filtered = useMemo(() => {
    let r = query ? allObras.filter(o => matchesSearch(o, query)) : allObras
    r = applyFilters(r, filters)
    r = sortObras(r, sort)
    return r
  }, [allObras, query, filters, sort])

  const totalPages       = Math.ceil(filtered.length / perPage) || 1
  const paginated        = filtered.slice((page - 1) * perPage, page * perPage)
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters])

  // Resetar página ao mudar filtros/busca
  useEffect(() => { setPage(1) }, [query, filters, sort, perPage])

  // ── Estados não-interativos ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Catálogo"
          description="Carregando acervo..."
          breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', href: '/' }]} />}
        />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Catálogo"
          breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', href: '/' }]} />}
        />
        <EmptyState
          title="Não foi possível carregar o catálogo"
          description="Verifique a conexão com o servidor e tente novamente."
          action={
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          }
        />
      </div>
    )
  }

  // ── Render principal ────────────────────────────────────────────────────

  const hasSearchOrFilter = !!query || activeFilterCount > 0

  return (
    <div className="space-y-6 pb-12">

      {/* ── Cabeçalho ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Catálogo"
        breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', href: '/' }]} />}
        description={
          allObras.length === 0
            ? 'Nenhuma obra cadastrada'
            : allObras.length === filtered.length
              ? `${allObras.length} ${allObras.length === 1 ? 'obra' : 'obras'} no acervo`
              : `${filtered.length} de ${allObras.length} obras`
        }
        actions={
          <Link href="/acervo/cadastro">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" />
              Nova Obra
            </Button>
          </Link>
        }
      />

      {/* ── Área de pesquisa ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Pesquisar por título, autor, ISBN, assunto, editora, CDD..."
        />

        {/* Linha de controles */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Filtros rápidos de status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_QUICK.map(({ value, label }) => {
              const active = filters.status === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilters(f => ({ ...f, status: value }))}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    active
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-slate-500 border-border hover:border-brand-300 hover:text-brand-600'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Ordenação + filtros avançados */}
          <div className="flex items-center gap-2">
            {/* Ordenar */}
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpDown className="size-3.5" />
                  <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                  <span className="sm:hidden">Ordenar</span>
                </Button>
              </DropdownTrigger>
              <DropdownContent align="end">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([k, v]) => (
                  <DropdownItem key={k} onSelect={() => setSort(k)}>
                    <span className={cn('flex items-center gap-2', sort === k && 'text-brand-600')}>
                      {sort === k
                        ? <Check className="size-3.5" />
                        : <span className="size-3.5" />
                      }
                      {v}
                    </span>
                  </DropdownItem>
                ))}
              </DropdownContent>
            </DropdownMenu>

            {/* Filtros avançados */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal className="size-3.5" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center size-4 rounded-full bg-brand-500 text-white text-[10px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Limpar filtros ativos */}
            {hasSearchOrFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setQuery(''); setFilters(FILTER_DEFAULT) }}
                className="text-slate-400 hover:text-slate-600 px-2"
                title="Limpar pesquisa e filtros"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Resultados ──────────────────────────────────────────────────── */}
      {paginated.length === 0 ? (
        hasSearchOrFilter ? (
          <EmptyState
            icon={<BookOpen className="size-8 text-slate-300" />}
            title="Nenhuma obra encontrada"
            description={
              query
                ? `Sem resultados para "${query}". Tente outros termos ou limpe os filtros.`
                : 'Nenhuma obra corresponde aos filtros aplicados.'
            }
            action={
              <Button variant="outline" onClick={() => { setQuery(''); setFilters(FILTER_DEFAULT) }}>
                Limpar pesquisa
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<BookOpen className="size-8 text-slate-300" />}
            title="Acervo vazio"
            description="Nenhuma obra cadastrada ainda. Comece adicionando a primeira obra ao catálogo."
            action={
              <Link href="/acervo/cadastro">
                <Button className="gap-1.5">
                  <Plus className="size-4" />
                  Cadastrar primeira obra
                </Button>
              </Link>
            }
          />
        )
      ) : (
        <>
          {/* Contagem + resultados por página */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="ds-caption text-slate-500">
              {filtered.length === 1 ? '1 obra encontrada' : `${filtered.length} obras encontradas`}
              {query && <span className="text-slate-400"> para &ldquo;{query}&rdquo;</span>}
            </p>

            <div className="flex items-center gap-1.5">
              <span className="ds-caption text-slate-400">por página:</span>
              {PER_PAGE_OPTIONS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPerPage(n as 12 | 24 | 48)}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded border transition-colors',
                    perPage === n
                      ? 'border-brand-400 text-brand-600 bg-brand-50'
                      : 'border-border text-slate-400 hover:border-slate-300'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de BookCards */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {paginated.map(obra => (
              <BookCard
                key={obra.obraId}
                obra={obra}
                onOpen={() => router.push(`/acervo/obra/${obra.obraId}`)}
                onNewLoan={() => router.push(`/loans/new?obraId=${obra.obraId}`)}
              />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="gap-1"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Button>

              <span className="ds-caption text-slate-500 tabular-nums">
                {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="gap-1"
              >
                Próxima
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Drawer de filtros avançados ──────────────────────────────────── */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  )
}
