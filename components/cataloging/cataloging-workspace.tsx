'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePageTitle } from '@/components/page-context'
import {
  Search, BookOpen, Plus, ArrowLeft, ArrowRight, CheckCircle2,
  AlertTriangle, Upload, Barcode, Wand2, Loader2, ChevronRight,
  FileSpreadsheet, Database, BookMarked, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { SearchBar }          from '@/components/ui/search-bar'
import { Button }             from '@/components/ui/button'
import { Card, CardContent }  from '@/components/ui/card'
import { Input }              from '@/components/ui/input'
import { Label }              from '@/components/ui/label'
import { StatusBadge }        from '@/components/ui/status-badge'
import { Drawer }             from '@/components/ui/drawer'
import { EmptyState }         from '@/components/ui/empty-state'
import { Section }            from '@/components/ui/section'

// ─── Types ────────────────────────────────────────────────────────────────────

type ExemplarStatus = 'DISPONIVEL' | 'EMPRESTADO' | 'RESERVADO' | 'MANUTENCAO' | 'EXTRAVIADO' | 'BAIXADO'

interface RawExemplar {
  id: number
  obraId: number
  codigoExemplar: string
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
  tombo: string | null
  status: ExemplarStatus
  ativo: boolean
}

interface ObraCard {
  obraId: number
  isbn: string | null
  titulo: string
  subtitulo: string | null
  autor: string | null
  editora: string | null
  anoPublicacao: number | null
  classificacao: string | null
  assunto1: string | null
  assunto2: string | null
  assunto3: string | null
  totalExemplares: number
  disponiveis: number
  emprestados: number
}

type Phase =
  | 'idle'
  | 'found'
  | 'not-found'
  | 'new-obra'
  | 'success'

interface FormData {
  // Step 1 — Identificação
  titulo: string
  subtitulo: string
  isbn: string
  tipoPublicacao: string
  // Step 2 — Catalogação
  classificacao: string
  assunto1: string
  assunto2: string
  assunto3: string
  colecao: string
  // Step 3 — Publicação
  autor: string
  editora: string
  edicao: string
  anoPublicacao: string
  // Step 4 — Exemplar
  tombo: string
  observacao: string
}

const FORM_EMPTY: FormData = {
  titulo: '', subtitulo: '', isbn: '', tipoPublicacao: '',
  classificacao: '', assunto1: '', assunto2: '', assunto3: '', colecao: '',
  autor: '', editora: '', edicao: '', anoPublicacao: '',
  tombo: '', observacao: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isISBN(q: string) {
  const n = q.replace(/[-\s]/g, '')
  return /^\d{10}$/.test(n) || /^\d{13}$/.test(n)
}

function normalizeISBN(s: string) {
  return s.replace(/[-\s]/g, '')
}

function groupByObra(exemplares: RawExemplar[]): ObraCard[] {
  const map = new Map<number, ObraCard>()
  for (const ex of exemplares) {
    if (!map.has(ex.obraId)) {
      map.set(ex.obraId, {
        obraId: ex.obraId, isbn: ex.isbn, titulo: ex.titulo,
        subtitulo: ex.subtitulo, autor: ex.autor, editora: ex.editora,
        anoPublicacao: ex.anoPublicacao, classificacao: ex.classificacao,
        assunto1: ex.assunto1, assunto2: ex.assunto2, assunto3: ex.assunto3,
        totalExemplares: 0, disponiveis: 0, emprestados: 0,
      })
    }
    const o = map.get(ex.obraId)!
    o.totalExemplares++
    if (ex.status === 'DISPONIVEL') o.disponiveis++
    if (ex.status === 'EMPRESTADO') o.emprestados++
  }
  return Array.from(map.values())
}

function searchObras(obras: ObraCard[], q: string): ObraCard[] {
  const t = q.trim().toLowerCase()
  if (!t) return []
  const isbn = isISBN(q)
  return obras.filter(o => {
    if (isbn) return normalizeISBN(o.isbn ?? '') === normalizeISBN(q)
    return [o.titulo, o.subtitulo, o.autor, o.isbn, o.classificacao,
            o.editora, o.assunto1, o.assunto2, o.assunto3]
      .some(f => f?.toLowerCase().includes(t))
  })
}

const COVER_PALETTES = [
  'bg-brand-50 text-brand-600 border-brand-100',
  'bg-violet-50 text-violet-600 border-violet-100',
  'bg-teal-50 text-teal-600 border-teal-100',
  'bg-amber-50 text-amber-600 border-amber-100',
  'bg-rose-50 text-rose-600 border-rose-100',
]

function CoverPlaceholder({ titulo, obraId }: { titulo: string; obraId: number }) {
  return (
    <div className={cn(
      'flex items-center justify-center w-12 h-16 rounded-md border shrink-0 font-bold text-lg select-none',
      COVER_PALETTES[obraId % COVER_PALETTES.length]
    )}>
      {titulo[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

// ─── FoundObraCard ─────────────────────────────────────────────────────────────

function FoundObraCard({
  obra, isExact, onOpen, onAddExemplar,
}: {
  obra: ObraCard
  isExact: boolean
  onOpen: () => void
  onAddExemplar: () => void
}) {
  const available = obra.disponiveis > 0 ? 'disponivel' : obra.emprestados > 0 ? 'emprestado' : 'inativo'

  return (
    <Card className="border border-border/60 bg-white shadow-none">
      <CardContent className="p-4 space-y-3">
        {/* ISBN exact match banner */}
        {isExact && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-sm text-emerald-700 font-medium">
              Esta obra já está cadastrada. Deseja apenas adicionar um novo exemplar?
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <CoverPlaceholder titulo={obra.titulo} obraId={obra.obraId} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 leading-snug">{obra.titulo}</h3>
                {obra.subtitulo && <p className="text-xs text-slate-400 truncate">{obra.subtitulo}</p>}
              </div>
              <StatusBadge status={available} />
            </div>

            <div className="mt-1.5 space-y-0.5">
              {(obra.autor || obra.editora || obra.anoPublicacao) && (
                <p className="text-xs text-slate-500">
                  {[obra.autor, obra.editora, obra.anoPublicacao].filter(Boolean).join(' · ')}
                </p>
              )}
              {(obra.isbn || obra.classificacao) && (
                <p className="text-xs text-slate-400">
                  {obra.isbn && `ISBN ${obra.isbn}`}
                  {obra.isbn && obra.classificacao && ' · '}
                  {obra.classificacao && `CDD ${obra.classificacao}`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{obra.totalExemplares} exemplar{obra.totalExemplares !== 1 ? 'es' : ''}</span>
              {obra.disponiveis > 0 && <span className="text-emerald-600">{obra.disponiveis} disp.</span>}
              {obra.emprestados > 0 && <span className="text-blue-600">{obra.emprestados} empr.</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1 border-t border-border/40">
          <Button size="sm" onClick={onOpen} className="gap-1.5">
            <BookOpen className="size-3.5" />
            Abrir Obra
          </Button>
          <Button size="sm" variant="outline" onClick={onAddExemplar} className="gap-1.5">
            <Plus className="size-3.5" />
            Adicionar Exemplar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── AddExemplarDrawer ─────────────────────────────────────────────────────────

function AddExemplarDrawer({ open, onClose, obra }: {
  open: boolean
  onClose: () => void
  obra: ObraCard | null
}) {
  const router = useRouter()
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Adicionar Exemplar"
      description={obra?.titulo ?? ''}
      width="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button
            onClick={() => { onClose(); router.push(`/acervo/obra/${obra?.obraId}`) }}
            className="gap-1.5"
          >
            <ExternalLink className="size-3.5" />
            Abrir na Obra
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Endpoint notice */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 font-semibold">Endpoint pendente</p>
          </div>
          <p className="text-xs text-amber-600">
            Adicionar exemplar a uma obra existente requer um endpoint dedicado que ainda não foi implementado.
          </p>
          <code className="block text-[11px] bg-amber-100 text-amber-800 px-2 py-1.5 rounded font-mono">
            POST /api/obras/{'{obraId}'}/exemplares
          </code>
        </div>

        {/* Obra context */}
        {obra && (
          <div className="p-3 bg-slate-50 rounded-lg border border-border/60 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Obra de destino</p>
            <p className="text-sm font-medium text-slate-700">{obra.titulo}</p>
            {obra.autor && <p className="text-xs text-slate-400">{obra.autor}</p>}
            <p className="text-xs font-mono text-slate-300">obraId: {obra.obraId}</p>
          </div>
        )}

        {/* Greyed-out preview */}
        <div className="space-y-3 opacity-40 pointer-events-none select-none">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Campos do novo exemplar</p>
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs">Tombo patrimonial</Label>
            <Input disabled placeholder="ex: 00124" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs">Código de barras</Label>
            <Input disabled placeholder="ex: 9788577420123" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs">Observação</Label>
            <Input disabled placeholder="Estado físico, localização..." />
          </div>
        </div>

        <p className="text-xs text-slate-400 border-t border-border/40 pt-3">
          Por enquanto, acesse a Obra diretamente e clique em <strong>+ Exemplar</strong> para cadastrar via o fluxo existente.
        </p>
      </div>
    </Drawer>
  )
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

const STEP_LABELS = ['Identificação', 'Catalogação', 'Publicação', 'Exemplar']

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done    = n < step
        const current = n === step
        return (
          <div key={n} className="flex items-center gap-1">
            <div className={cn(
              'flex items-center justify-center size-6 rounded-full text-xs font-semibold border transition-colors',
              done    ? 'bg-brand-500 border-brand-500 text-white'
                      : current ? 'bg-white border-brand-400 text-brand-600'
                                : 'bg-white border-slate-200 text-slate-400'
            )}>
              {done ? <CheckCircle2 className="size-3.5" /> : n}
            </div>
            <span className={cn(
              'text-xs hidden sm:inline',
              current ? 'text-slate-700 font-medium' : 'text-slate-400'
            )}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <ChevronRight className="size-3.5 text-slate-300 mx-0.5" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── FormField helper ─────────────────────────────────────────────────────────

function Field({ id, label, required, children }: {
  id: string; label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm text-slate-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ─── ImportCard ───────────────────────────────────────────────────────────────

function ImportCard() {
  return (
    <Card className="border border-border/60 bg-white shadow-none">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Importação</h3>
        </div>
        <p className="text-xs text-slate-400">Cadastre múltiplas obras de uma vez.</p>

        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-slate-50 transition-colors text-left">
            <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700">Importar CSV / Planilha</p>
              <p className="text-xs text-slate-400">Modelo disponível para download</p>
            </div>
            <ArrowRight className="size-3.5 text-slate-300 ml-auto shrink-0" />
          </button>

          <button disabled className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 opacity-50 cursor-not-allowed text-left">
            <Database className="size-4 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-600">Importar MARC21</p>
              <p className="text-xs text-slate-400">Formato bibliotecário padrão</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded ml-auto shrink-0">Em breve</span>
          </button>

          <button disabled className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 opacity-50 cursor-not-allowed text-left">
            <Barcode className="size-4 text-purple-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-600">Importação por ISBN</p>
              <p className="text-xs text-slate-400">Consultar base pública</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded ml-auto shrink-0">Em breve</span>
          </button>
        </div>

        <div className="border-t border-border/40 pt-2">
          <p className="text-[10px] text-slate-300 uppercase tracking-wide font-medium mb-1.5">Histórico</p>
          <p className="text-xs text-slate-400 italic">Nenhuma importação registrada.</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── CatalogingWorkspace ──────────────────────────────────────────────────────

export function CatalogingWorkspace() {
  const router = useRouter()
  const { setPageInfo } = usePageTitle()
  useEffect(() => {
    setPageInfo('Catalogação', 'Identifique a obra e registre exemplares')
  }, [setPageInfo])

  // Data cache
  const allExemplar = useRef<RawExemplar[]>([])
  const allObras    = useRef<ObraCard[]>([])
  const dataLoaded  = useRef(false)

  // UI state
  const [phase,    setPhase]    = useState<Phase>('idle')
  const [query,    setQuery]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [results,  setResults]  = useState<ObraCard[]>([])
  const [step,     setStep]     = useState<1 | 2 | 3 | 4>(1)
  const [form,     setForm]     = useState<FormData>(FORM_EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [saveErr,  setSaveErr]  = useState<string | null>(null)
  const [addTarget, setAddTarget] = useState<ObraCard | null>(null)

  // Detect query type
  const detectedISBN = useMemo(() => isISBN(query), [query])

  // Load exemplares (lazy — on first search)
  async function ensureDataLoaded() {
    if (dataLoaded.current) return
    const res = await fetch('/api/acervo?limit=500')
    const json = await res.json()
    allExemplar.current = (json.data ?? []) as RawExemplar[]
    allObras.current    = groupByObra(allExemplar.current)
    dataLoaded.current  = true
  }

  // Trigger search
  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) { setPhase('idle'); return }
    setLoading(true)
    await ensureDataLoaded()
    const found = searchObras(allObras.current, trimmed)
    setResults(found)
    setPhase(found.length > 0 ? 'found' : 'not-found')
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search (300ms)
  useEffect(() => {
    if (!query.trim()) { setPhase('idle'); setResults([]); return }
    const t = setTimeout(() => { runSearch(query) }, 300)
    return () => clearTimeout(t)
  }, [query, runSearch])

  // Form field helper
  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // Pre-fill ISBN from search query
  function startNewObra() {
    setForm({ ...FORM_EMPTY, isbn: detectedISBN ? query.trim() : '' })
    setStep(1)
    setPhase('new-obra')
    setSaveErr(null)
  }

  // Step navigation
  function nextStep() {
    if (!form.titulo.trim()) return
    if (step < 4) setStep(s => (s + 1) as typeof step)
  }
  function prevStep() {
    if (step > 1) setStep(s => (s - 1) as typeof step)
  }

  // Submit form
  async function handleSave() {
    if (!form.titulo.trim()) return
    setSaving(true); setSaveErr(null)
    try {
      const payload = {
        titulo:         form.titulo.trim(),
        subtitulo:      form.subtitulo.trim()   || null,
        isbn:           form.isbn.trim()        || null,
        tipoPublicacao: form.tipoPublicacao.trim() || null,
        classificacao:  form.classificacao.trim() || null,
        assunto1:       form.assunto1.trim()    || null,
        assunto2:       form.assunto2.trim()    || null,
        assunto3:       form.assunto3.trim()    || null,
        colecao:        form.colecao.trim()     || null,
        autor:          form.autor.trim()       || null,
        editora:        form.editora.trim()     || null,
        edicao:         form.edicao.trim()      || null,
        anoPublicacao:  form.anoPublicacao ? Number(form.anoPublicacao) : null,
        tombo:          form.tombo.trim()       || null,
        observacao:     form.observacao.trim()  || null,
      }

      const res = await fetch('/api/acervo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao catalogar obra')
      }

      const created = await res.json()
      const obraId: number = created.obraId ?? created.obra?.id ?? created.id
      router.push(`/acervo/obra/${obraId}`)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const showImport = phase !== 'new-obra'

  return (
    <div className="space-y-6 pb-16">
      {/* ── Search bar — hero element ── */}
      <div className="space-y-2">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Pesquisar por ISBN, título, autor, CDD, assunto ou editora…"
          loading={loading}
          onClear={() => { setQuery(''); setPhase('idle'); setResults([]) }}
        />
        {/* Auto-detection hint */}
        {detectedISBN && query.trim() && (
          <div className="flex items-center gap-1.5 text-xs text-brand-600">
            <Barcode className="size-3.5" />
            ISBN detectado — buscando por código exato
          </div>
        )}
      </div>

      {/* ── Layout: main + import sidebar ── */}
      <div className={cn(
        'flex gap-6',
        showImport ? 'flex-col md:flex-row' : 'flex-col'
      )}>
        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0">

          {/* ─ idle ─ */}
          {phase === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                <Search className="size-7 text-brand-400" />
              </div>
              <p className="text-slate-600 font-medium">Comece pesquisando a obra</p>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                Digite o ISBN, título ou nome do autor. O sistema detecta automaticamente e verifica se a obra já existe.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5 gap-1.5"
                onClick={startNewObra}
              >
                <Plus className="size-3.5" />
                Cadastrar sem pesquisar
              </Button>
            </div>
          )}

          {/* ─ loading ─ */}
          {loading && (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </div>
          )}

          {/* ─ found ─ */}
          {phase === 'found' && !loading && (
            <Section
              title={`${results.length} obra${results.length !== 1 ? 's' : ''} encontrada${results.length !== 1 ? 's' : ''}`}
              description={`Para "${query}" — selecione para abrir ou adicionar exemplares`}
              action={
                <Button size="sm" variant="outline" onClick={startNewObra} className="gap-1.5">
                  <Plus className="size-3.5" />
                  Nova obra mesmo assim
                </Button>
              }
            >
              <div className="space-y-3 mt-4">
                {results.map(obra => (
                  <FoundObraCard
                    key={obra.obraId}
                    obra={obra}
                    isExact={detectedISBN}
                    onOpen={() => router.push(`/acervo/obra/${obra.obraId}`)}
                    onAddExemplar={() => setAddTarget(obra)}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* ─ not-found ─ */}
          {phase === 'not-found' && !loading && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-10 text-center">
                <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                  <BookMarked className="size-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-700">
                  Nenhuma obra encontrada para{' '}
                  <span className="text-brand-600">&ldquo;{query}&rdquo;</span>
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {detectedISBN
                    ? 'Este ISBN não está cadastrado. Cadastre agora como nova obra.'
                    : 'Esta será uma nova obra no acervo. Preencha os dados bibliográficos.'}
                </p>
                <div className="flex items-center gap-2 mt-5">
                  <Button onClick={startNewObra} className="gap-1.5">
                    <Plus className="size-3.5" />
                    Cadastrar nova obra
                  </Button>
                  <Button variant="ghost" onClick={() => { setQuery(''); setPhase('idle') }}>
                    Limpar busca
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─ new-obra ─ */}
          {phase === 'new-obra' && (
            <Card className="border border-border/60 bg-white shadow-none">
              <CardContent className="p-5 space-y-6">
                {/* Step indicator */}
                <div className="flex items-center justify-between">
                  <StepIndicator step={step} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-600"
                    onClick={() => setPhase(results.length > 0 ? 'found' : query ? 'not-found' : 'idle')}
                  >
                    Cancelar
                  </Button>
                </div>

                {/* ── Step 1: Identificação ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">Identificação</h3>
                      <p className="text-sm text-slate-400 mt-0.5">Informações principais da obra</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field id="titulo" label="Título" required>
                          <Input
                            id="titulo"
                            value={form.titulo}
                            onChange={e => set('titulo', e.target.value)}
                            placeholder="ex: A Bíblia e a Cosmovisão Cristã"
                            autoFocus
                          />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field id="subtitulo" label="Subtítulo">
                          <Input
                            id="subtitulo"
                            value={form.subtitulo}
                            onChange={e => set('subtitulo', e.target.value)}
                            placeholder="ex: Uma análise contemporânea"
                          />
                        </Field>
                      </div>
                      <Field id="isbn" label="ISBN">
                        <Input
                          id="isbn"
                          value={form.isbn}
                          onChange={e => set('isbn', e.target.value)}
                          placeholder="ex: 978-85-7742-012-3"
                          className={isISBN(form.isbn) ? 'border-emerald-300 focus-visible:ring-emerald-300' : ''}
                        />
                      </Field>
                      <Field id="tipoPublicacao" label="Tipo de publicação">
                        <Input
                          id="tipoPublicacao"
                          value={form.tipoPublicacao}
                          onChange={e => set('tipoPublicacao', e.target.value)}
                          placeholder="ex: Livro, Revista, Periódico"
                          list="tipo-opts"
                        />
                        <datalist id="tipo-opts">
                          {['Livro', 'Revista', 'Periódico', 'Tese', 'Monografia', 'Apostila'].map(t => (
                            <option key={t} value={t} />
                          ))}
                        </datalist>
                      </Field>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Catalogação ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">Catalogação</h3>
                      <p className="text-sm text-slate-400 mt-0.5">Classificação e assuntos da obra</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id="classificacao" label="CDD — Classificação Decimal">
                        <Input
                          id="classificacao"
                          value={form.classificacao}
                          onChange={e => set('classificacao', e.target.value)}
                          placeholder="ex: 230"
                          autoFocus
                        />
                      </Field>
                      <Field id="colecao" label="Coleção">
                        <Input
                          id="colecao"
                          value={form.colecao}
                          onChange={e => set('colecao', e.target.value)}
                          placeholder="ex: Série Apologética"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field id="assunto1" label="Assunto principal">
                          <Input
                            id="assunto1"
                            value={form.assunto1}
                            onChange={e => set('assunto1', e.target.value)}
                            placeholder="ex: Teologia Sistemática"
                          />
                        </Field>
                      </div>
                      <Field id="assunto2" label="Assunto secundário">
                        <Input
                          id="assunto2"
                          value={form.assunto2}
                          onChange={e => set('assunto2', e.target.value)}
                          placeholder="Opcional"
                        />
                      </Field>
                      <Field id="assunto3" label="Assunto terciário">
                        <Input
                          id="assunto3"
                          value={form.assunto3}
                          onChange={e => set('assunto3', e.target.value)}
                          placeholder="Opcional"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Publicação ── */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">Publicação</h3>
                      <p className="text-sm text-slate-400 mt-0.5">Dados de autor e editora</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field id="autor" label="Autor">
                          <Input
                            id="autor"
                            value={form.autor}
                            onChange={e => set('autor', e.target.value)}
                            placeholder="ex: Francis Schaeffer"
                            autoFocus
                          />
                        </Field>
                      </div>
                      <Field id="editora" label="Editora">
                        <Input
                          id="editora"
                          value={form.editora}
                          onChange={e => set('editora', e.target.value)}
                          placeholder="ex: Vida Nova"
                        />
                      </Field>
                      <Field id="edicao" label="Edição">
                        <Input
                          id="edicao"
                          value={form.edicao}
                          onChange={e => set('edicao', e.target.value)}
                          placeholder="ex: 2ª edição"
                        />
                      </Field>
                      <Field id="anoPublicacao" label="Ano de publicação">
                        <Input
                          id="anoPublicacao"
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={form.anoPublicacao}
                          onChange={e => set('anoPublicacao', e.target.value.replace(/\D/g, ''))}
                          placeholder="ex: 2023"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* ── Step 4: Exemplar ── */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">Primeiro Exemplar</h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        O código EX será gerado automaticamente pelo sistema
                      </p>
                    </div>

                    {/* Resumo da obra */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-border/60">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-1.5">Obra</p>
                      <p className="text-sm font-semibold text-slate-800">{form.titulo}</p>
                      {form.autor && <p className="text-xs text-slate-500">{form.autor}</p>}
                      {form.isbn && <p className="text-xs font-mono text-slate-400">ISBN {form.isbn}</p>}
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-100 rounded-lg">
                      <Wand2 className="size-4 text-brand-500 shrink-0" />
                      <p className="text-xs text-brand-700">
                        Código de exemplar (EX000001…) gerado automaticamente.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id="tombo" label="Tombo patrimonial">
                        <Input
                          id="tombo"
                          value={form.tombo}
                          onChange={e => set('tombo', e.target.value)}
                          placeholder="ex: 00124"
                          autoFocus
                        />
                      </Field>
                    </div>
                    <Field id="observacao" label="Observação">
                      <textarea
                        id="observacao"
                        rows={3}
                        className="w-full resize-y rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        placeholder="Estado físico, localização, origem, valor de aquisição…"
                        value={form.observacao}
                        onChange={e => set('observacao', e.target.value)}
                      />
                    </Field>
                  </div>
                )}

                {/* Error */}
                {saveErr && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="size-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{saveErr}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={step === 1}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="size-3.5" />
                    Voltar
                  </Button>

                  {step < 4 ? (
                    <Button
                      onClick={nextStep}
                      disabled={step === 1 && !form.titulo.trim()}
                      className="gap-1.5"
                    >
                      Continuar
                      <ArrowRight className="size-3.5" />
                    </Button>
                  ) : (
                    <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                      {saving
                        ? <><Loader2 className="size-3.5 animate-spin" /> Salvando…</>
                        : <><CheckCircle2 className="size-3.5" /> Salvar e abrir Obra</>
                      }
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── IMPORT SIDEBAR ── */}
        {showImport && (
          <div className="w-full md:w-72 shrink-0">
            <ImportCard />
          </div>
        )}
      </div>

      {/* Drawer: add exemplar to existing obra */}
      <AddExemplarDrawer
        open={!!addTarget}
        onClose={() => setAddTarget(null)}
        obra={addTarget}
      />
    </div>
  )
}
