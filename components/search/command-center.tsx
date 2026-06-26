'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useRouter } from 'next/navigation'
import {
  Search, X, Loader2, BookOpen, Users, Package, Zap, Clock, Pin, PinOff,
  LayoutDashboard, ArrowLeftRight, ClipboardList, BookPlus, UserPlus, BarChart3, Cog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusExemplar = 'DISPONIVEL' | 'EMPRESTADO' | 'RESERVADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO'
type BadgeStatus = 'disponivel' | 'emprestado' | 'reservado' | 'manutencao' | 'inativo' | 'atrasado'
type QueryType = 'exemplar' | 'isbn' | 'tombo' | 'texto'
type ItemType = 'obra' | 'exemplar' | 'leitor' | 'acao' | 'history' | 'pin'

interface RawExemplar {
  id: number
  codigoExemplar: string
  titulo: string
  autor: string | null
  status: StatusExemplar
  ativo: boolean
}

interface RawLeitor {
  id: number
  nomeCompleto: string
  numeroCadastro: string
}

interface ObraGroup {
  exemplarId: number
  titulo: string
  autor: string | null
  disponiveis: number
  total: number
}

interface PinItem {
  label: string
  sublabel?: string
  href?: string
  exemplarId?: number
}

interface FlatItem {
  key: string
  type: ItemType
  label: string
  sublabel?: string
  status?: StatusExemplar
  href?: string
  exemplarId?: number
  meta?: { disponiveis?: number; total?: number }
  onActivate?: () => void
  pinData?: PinItem
  isPinned?: boolean
}

interface ActionDef {
  id: string
  label: string
  desc: string
  href: string
  keywords: string[]
  Icon: React.ComponentType<{ className?: string }>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_HISTORY = 'viva:search:history'
const LS_PINS    = 'viva:search:pins'

const STATIC_ACTIONS: ActionDef[] = [
  { id: 'dashboard',    label: 'Dashboard',       desc: 'Painel principal',           href: '/',            keywords: ['dashboard', 'inicio', 'painel', 'home'],                     Icon: LayoutDashboard },
  { id: 'circulacao',   label: 'Circulação',      desc: 'Empréstimos e devoluções',   href: '/circulacao',  keywords: ['circulacao', 'emprestimo', 'devolucao', 'renovacao'],         Icon: ArrowLeftRight  },
  { id: 'inventario',   label: 'Inventário',      desc: 'Conferência patrimonial',    href: '/inventario',  keywords: ['inventario', 'conferencia', 'patrimonio'],                    Icon: ClipboardList   },
  { id: 'nova-obra',    label: 'Nova obra',        desc: 'Cadastrar novo título',      href: '/books/new',   keywords: ['nova', 'obra', 'livro', 'criar', 'novo', 'cadastrar'],        Icon: BookPlus        },
  { id: 'novo-leitor',  label: 'Novo leitor',      desc: 'Cadastrar leitor',           href: '/members/new', keywords: ['novo', 'leitor', 'membro', 'usuario', 'criar', 'cadastrar'],  Icon: UserPlus        },
  { id: 'acervo',       label: 'Acervo',           desc: 'Catálogo de obras',          href: '/books',       keywords: ['acervo', 'catalogo', 'livros', 'obras'],                     Icon: BookOpen        },
  { id: 'leitores',     label: 'Leitores',         desc: 'Gerenciar leitores',         href: '/members',     keywords: ['leitores', 'membros', 'usuarios', 'alunos'],                 Icon: Users           },
  { id: 'relatorios',   label: 'Relatórios',       desc: 'Estatísticas do sistema',    href: '/reports',     keywords: ['relatorios', 'estatisticas', 'relatorio'],                   Icon: BarChart3       },
  { id: 'config',       label: 'Configurações',    desc: 'Ajustes do sistema',         href: '/settings',    keywords: ['configuracoes', 'settings', 'ajustes'],                      Icon: Cog             },
]

const QUERY_TYPE_LABELS: Record<QueryType, string> = {
  exemplar: '📦 Código EX',
  isbn:     '🔖 ISBN',
  tombo:    '🏷️ Tombo',
  texto:    '🔍 Texto livre',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectType(q: string): QueryType {
  const t = q.trim()
  if (/^EX\d*/i.test(t)) return 'exemplar'
  if (/^\d{13}$/.test(t)) return 'isbn'
  if (/^\d{3,8}$/.test(t)) return 'tombo'
  return 'texto'
}

function statusToBadge(s: StatusExemplar): BadgeStatus {
  const map: Record<StatusExemplar, BadgeStatus> = {
    DISPONIVEL: 'disponivel', EMPRESTADO: 'emprestado',
    RESERVADO: 'reservado',   MANUTENCAO: 'manutencao',
    EXTRAVIADO: 'inativo',    BAIXADO:    'inativo',
  }
  return map[s]
}

function groupByObra(items: RawExemplar[]): ObraGroup[] {
  const map = new Map<string, ObraGroup>()
  for (const item of items) {
    const key = `${item.titulo}__${item.autor ?? ''}`
    const ex = map.get(key)
    if (ex) {
      ex.total++
      if (item.status === 'DISPONIVEL') ex.disponiveis++
    } else {
      map.set(key, {
        exemplarId: item.id,
        titulo: item.titulo,
        autor: item.autor,
        disponiveis: item.status === 'DISPONIVEL' ? 1 : 0,
        total: 1,
      })
    }
  }
  return Array.from(map.values())
}

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY) ?? '[]') } catch { return [] }
}
function pushHistory(q: string) {
  if (!q.trim()) return
  const h = [q.trim(), ...getHistory().filter(x => x !== q.trim())].slice(0, 10)
  localStorage.setItem(LS_HISTORY, JSON.stringify(h))
}
function getPins(): PinItem[] {
  try { return JSON.parse(localStorage.getItem(LS_PINS) ?? '[]') } catch { return [] }
}
function savePins(pins: PinItem[]) {
  localStorage.setItem(LS_PINS, JSON.stringify(pins))
}

// ─── CommandCenter ────────────────────────────────────────────────────────────

export function CommandCenter() {
  const router = useRouter()

  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [focusIdx, setFocusIdx] = useState(0)
  const [searching, setSearching] = useState(false)

  const [obraGroups, setObraGroups]           = useState<ObraGroup[]>([])
  const [exemplarResults, setExemplarResults] = useState<RawExemplar[]>([])
  const [leitorResults, setLeitorResults]     = useState<RawLeitor[]>([])
  const [pins, setPins]     = useState<PinItem[]>([])
  const [history, setHistory] = useState<string[]>([])

  const inputRef       = useRef<HTMLInputElement>(null)
  const debounceRef    = useRef<ReturnType<typeof setTimeout>>(null)
  const leitorCache    = useRef<RawLeitor[]>([])
  const cacheLoaded    = useRef(false)

  // Sync localStorage on open
  useEffect(() => {
    if (open) {
      setPins(getPins())
      setHistory(getHistory())
    }
  }, [open])

  // Global Ctrl+K + custom event listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    function onOpen() { setOpen(true) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('viva:search:open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('viva:search:open', onOpen)
    }
  }, [])

  // Focus input on open; reset on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60)
    } else {
      setQuery('')
      setFocusIdx(0)
      setObraGroups([])
      setExemplarResults([])
      setLeitorResults([])
    }
  }, [open])

  // Scroll focused item into view
  useEffect(() => {
    document.getElementById(`cmd-${focusIdx}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusIdx])

  async function ensureLeitorCache() {
    if (cacheLoaded.current) return
    cacheLoaded.current = true
    try {
      const res = await fetch('/api/usuarios')
      const data = await res.json()
      leitorCache.current = (Array.isArray(data) ? data : (data.data ?? [])) as RawLeitor[]
    } catch {
      cacheLoaded.current = false
    }
  }

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setObraGroups([]); setExemplarResults([]); setLeitorResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    await ensureLeitorCache()
    const type = detectType(trimmed)

    try {
      if (type === 'exemplar') {
        const res  = await fetch(`/api/acervo?limit=200`)
        const data = await res.json()
        const all  = (data.data ?? []) as RawExemplar[]
        const up   = trimmed.toUpperCase()
        setExemplarResults(all.filter(e => e.codigoExemplar.includes(up)).slice(0, 6))
        setObraGroups([]); setLeitorResults([])
      } else {
        // Parallel: title search + (autor fallback if few results)
        const res  = await fetch(`/api/acervo?titulo=${encodeURIComponent(trimmed)}&limit=20`)
        const data = await res.json()
        let items  = (data.data ?? []) as RawExemplar[]

        if (items.length < 3 && type === 'texto') {
          try {
            const ar   = await fetch(`/api/acervo?autor=${encodeURIComponent(trimmed)}&limit=10`)
            const ad   = await ar.json()
            const more = (ad.data ?? []) as RawExemplar[]
            const seen = new Set(items.map(x => x.codigoExemplar))
            items = [...items, ...more.filter(x => !seen.has(x.codigoExemplar))]
          } catch { /* silent */ }
        }

        setObraGroups(groupByObra(items).slice(0, 5))
        setExemplarResults([])

        // Filter leitores client-side (cached list)
        const low = trimmed.toLowerCase()
        setLeitorResults(
          leitorCache.current
            .filter(l => l.nomeCompleto.toLowerCase().includes(low) || l.numeroCadastro.includes(trimmed))
            .slice(0, 4)
        )
      }
    } catch { /* silent */ } finally {
      setSearching(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleQueryChange(q: string) {
    setQuery(q)
    setFocusIdx(0)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q), 200)
  }

  // Filtered actions
  const actionResults = useMemo<ActionDef[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return STATIC_ACTIONS.slice(0, 5)
    return STATIC_ACTIONS.filter(a =>
      a.label.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q) ||
      a.keywords.some(kw => kw.includes(q))
    )
  }, [query])

  // ── Flat item list (drives keyboard nav + rendering) ──────────────────────

  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = []

    if (!query.trim()) {
      for (const p of pins) {
        items.push({ key: `pin-${p.label}`, type: 'pin', label: p.label, sublabel: p.sublabel, href: p.href, exemplarId: p.exemplarId, isPinned: true, pinData: p })
      }
      for (const h of history) {
        const captured = h
        items.push({ key: `hist-${h}`, type: 'history', label: h, onActivate: () => handleQueryChange(captured) })
      }
      for (const a of STATIC_ACTIONS.slice(0, 5)) {
        items.push({ key: a.id, type: 'acao', label: a.label, sublabel: a.desc, href: a.href })
      }
      return items
    }

    for (const o of obraGroups) {
      items.push({ key: `obra-${o.exemplarId}`, type: 'obra', label: o.titulo, sublabel: o.autor ?? undefined, exemplarId: o.exemplarId, meta: { disponiveis: o.disponiveis, total: o.total } })
    }
    for (const e of exemplarResults) {
      items.push({ key: `ex-${e.id}`, type: 'exemplar', label: e.codigoExemplar, sublabel: e.titulo, status: e.status, exemplarId: e.id })
    }
    for (const l of leitorResults) {
      items.push({ key: `leitor-${l.id}`, type: 'leitor', label: l.nomeCompleto, sublabel: `Matrícula: ${l.numeroCadastro}`, href: '/members' })
    }
    for (const a of actionResults) {
      items.push({ key: a.id, type: 'acao', label: a.label, sublabel: a.desc, href: a.href })
    }
    return items
  // handleQueryChange is stable (doesn't change) but eslint can't know
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, obraGroups, exemplarResults, leitorResults, actionResults, pins, history])

  // Grouped sections for display
  interface SectionDef { id: string; label: string; Icon: React.ComponentType<{className?: string}>; color: string; items: FlatItem[] }
  const sections = useMemo<SectionDef[]>(() => {
    const pick = (type: ItemType) => flatItems.filter(x => x.type === type)
    if (!query.trim()) {
      const secs: SectionDef[] = []
      if (pins.length)    secs.push({ id: 'pins',    label: 'Fixados',           Icon: Pin,     color: 'text-amber-600',  items: pick('pin') })
      if (history.length) secs.push({ id: 'history', label: 'Recentes',          Icon: Clock,   color: 'text-slate-500',  items: pick('history') })
      secs.push(                     { id: 'acesso',  label: 'Acesso rápido',     Icon: Zap,     color: 'text-orange-600', items: pick('acao') })
      return secs
    }
    const secs: SectionDef[] = []
    if (pick('obra').length)      secs.push({ id: 'obras',      label: 'Obras',      Icon: BookOpen, color: 'text-blue-600',    items: pick('obra') })
    if (pick('exemplar').length)  secs.push({ id: 'exemplares', label: 'Exemplares', Icon: Package,  color: 'text-emerald-600', items: pick('exemplar') })
    if (pick('leitor').length)    secs.push({ id: 'leitores',   label: 'Leitores',   Icon: Users,    color: 'text-purple-600',  items: pick('leitor') })
    if (pick('acao').length)      secs.push({ id: 'acoes',      label: 'Ações',      Icon: Zap,      color: 'text-orange-600',  items: pick('acao') })
    return secs
  }, [flatItems, query, pins, history])

  // ── Activation ───────────────────────────────────────────────────────────

  async function activateItem(item: FlatItem) {
    if (item.onActivate) { item.onActivate(); return }

    let dest = item.href
    if ((item.type === 'obra' || item.type === 'exemplar' || item.type === 'pin') && item.exemplarId) {
      try {
        const d = await fetch(`/api/acervo/${item.exemplarId}`).then(r => r.json())
        dest = `/acervo/obra/${d.obraId}`
      } catch {
        dest = '/books'
      }
    }

    if (dest) router.push(dest)
    if (query.trim()) pushHistory(query.trim())
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, flatItems.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (flatItems[focusIdx]) activateItem(flatItems[focusIdx]) }
  }

  // ── Pin management ────────────────────────────────────────────────────────

  function togglePin(item: FlatItem, e: React.MouseEvent) {
    e.stopPropagation()
    const current = getPins()
    let updated: PinItem[]
    if (item.isPinned || current.some(p => p.label === item.label)) {
      updated = current.filter(p => p.label !== item.label)
    } else {
      const entry: PinItem = { label: item.label, sublabel: item.sublabel, href: item.href, exemplarId: item.exemplarId }
      updated = [entry, ...current].slice(0, 20)
    }
    savePins(updated)
    setPins(updated)
  }

  const isPinned = (item: FlatItem) => item.isPinned || pins.some(p => p.label === item.label)
  const queryType = detectType(query)
  const hasResults = flatItems.length > 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DialogPrimitive.Root open={open} onOpenChange={v => { if (!v) setOpen(false) }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
        )} />

        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-[12vh] z-50 w-full max-w-2xl -translate-x-1/2 px-4',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4'
          )}
          onKeyDown={handleKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">Pesquisa global</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Pesquise obras, leitores, exemplares e comandos</DialogPrimitive.Description>

          <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/8 overflow-hidden">

            {/* ── Search input ── */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
              {searching
                ? <Loader2 className="size-5 text-slate-400 animate-spin shrink-0" />
                : <Search className="size-5 text-slate-400 shrink-0" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                placeholder="Pesquisar obras, leitores, exemplares…"
                className="flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {query ? (
                <button
                  onClick={() => { setQuery(''); setFocusIdx(0); doSearch(''); inputRef.current?.focus() }}
                  className="rounded-md p-1 hover:bg-slate-100 transition-colors"
                  aria-label="Limpar"
                >
                  <X className="size-4 text-slate-400" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500 font-mono">
                  Ctrl+K
                </kbd>
              )}
            </div>

            {/* ── Type detection badge ── */}
            {query.trim() && queryType !== 'texto' && (
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2">
                <span className="text-xs text-slate-400">Detectado:</span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                  {QUERY_TYPE_LABELS[queryType]}
                </span>
              </div>
            )}

            {/* ── Results ── */}
            <div className="max-h-[56vh] overflow-y-auto">
              {query.trim() && !searching && !hasResults ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <Search className="size-9 text-slate-200 mb-3" />
                  <p className="text-sm font-medium text-slate-700">Nenhum resultado para "{query}"</p>
                  <p className="text-xs text-slate-400 mt-1">Tente um termo diferente ou use um código EX</p>
                </div>
              ) : (
                sections.map(section => {
                  const SIcon = section.Icon
                  const sectionStart = flatItems.findIndex(x => x.key === section.items[0]?.key)

                  return (
                    <div key={section.id} className="py-1.5">
                      <div className="flex items-center gap-1.5 px-4 pb-1 pt-0.5">
                        <SIcon className={cn('size-3 shrink-0', section.color)} />
                        <span className={cn('text-xs font-semibold uppercase tracking-wider', section.color)}>
                          {section.label}
                        </span>
                      </div>

                      <div className="px-2">
                        {section.items.map((item, li) => {
                          const gi = sectionStart + li
                          const focused = gi === focusIdx
                          const pinned = isPinned(item)
                          const actionDef = item.type === 'acao' ? STATIC_ACTIONS.find(a => a.id === item.key) : undefined

                          return (
                            <button
                              key={item.key}
                              id={`cmd-${gi}`}
                              onClick={() => activateItem(item)}
                              onMouseEnter={() => setFocusIdx(gi)}
                              className={cn(
                                'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-75',
                                focused ? 'bg-blue-50 ring-1 ring-blue-200/70' : 'hover:bg-slate-50'
                              )}
                            >
                              {/* Icon */}
                              <div className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                                item.type === 'history'  && 'bg-slate-100',
                                item.type === 'pin'      && 'bg-amber-50',
                                item.type === 'obra'     && 'bg-blue-50',
                                item.type === 'exemplar' && 'bg-emerald-50',
                                item.type === 'leitor'   && 'bg-purple-50',
                                item.type === 'acao'     && 'bg-orange-50',
                              )}>
                                {item.type === 'history'  && <Clock    className="size-4 text-slate-400" />}
                                {item.type === 'pin'      && <Pin      className="size-4 text-amber-500" />}
                                {item.type === 'obra'     && <BookOpen className="size-4 text-blue-600" />}
                                {item.type === 'exemplar' && <Package  className="size-4 text-emerald-600" />}
                                {item.type === 'leitor'   && <Users    className="size-4 text-purple-600" />}
                                {item.type === 'acao' && actionDef && <actionDef.Icon className="size-4 text-orange-600" />}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn('text-sm font-medium truncate', focused ? 'text-slate-900' : 'text-slate-800')}>
                                    {item.label}
                                  </span>
                                  {item.status && (
                                    <StatusBadge status={statusToBadge(item.status)} className="shrink-0" />
                                  )}
                                  {item.type === 'obra' && item.meta && (
                                    <span className={cn(
                                      'shrink-0 text-xs font-medium rounded-full px-1.5 py-0.5',
                                      (item.meta.disponiveis ?? 0) > 0
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-500'
                                    )}>
                                      {item.meta.disponiveis} de {item.meta.total} disponíveis
                                    </span>
                                  )}
                                </div>
                                {item.sublabel && (
                                  <p className="text-xs text-slate-500 truncate mt-0.5">{item.sublabel}</p>
                                )}
                              </div>

                              {/* Right: pin + enter hint */}
                              <div className="shrink-0 flex items-center gap-1">
                                {(item.type === 'obra' || item.type === 'exemplar' || item.type === 'leitor') && (
                                  <button
                                    onClick={e => togglePin(item, e)}
                                    className={cn(
                                      'rounded-md p-1 transition-colors',
                                      pinned
                                        ? 'text-amber-500 hover:bg-amber-50'
                                        : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-500'
                                    )}
                                    aria-label={pinned ? 'Desafixar' : 'Fixar'}
                                  >
                                    {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                                  </button>
                                )}
                                {focused && (
                                  <span className="text-xs text-slate-300 font-mono leading-none">↵</span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-slate-100 px-4 py-2.5 flex items-center gap-4 flex-wrap">
              <span className="text-xs text-slate-400"><kbd className="font-mono">↑↓</kbd> navegar</span>
              <span className="text-xs text-slate-400"><kbd className="font-mono">↵</kbd> abrir</span>
              <span className="text-xs text-slate-400"><kbd className="font-mono">Esc</kbd> fechar</span>
              <div className="flex-1" />
              {!query.trim() && (
                <span className="text-xs text-slate-300">
                  {pins.length > 0 ? `${pins.length} fixado${pins.length !== 1 ? 's' : ''}` : 'Passe o mouse em um resultado para fixar'}
                </span>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
