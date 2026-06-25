'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Search,
  RotateCcw,
  BookOpen,
  User,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  X,
} from 'lucide-react'

interface UserResult {
  id: number
  numeroCadastro: string
  nomeCompleto: string
}

interface EmprestimoAtivo {
  emprestimoId: number
  exemplarId: number
  codigoExemplar: string
  titulo: string
  usuarioId: number
  nomeCompleto: string
  numeroCadastro: string
  dataEmprestimo: string
  dataPrevistaDevolucao: string
}

// Empréstimo como retornado pelo endpoint /api/usuarios/[id]/emprestimos
interface EmprestimoUsuario {
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

// ─── Modo usuário: lista de empréstimos ativos ────────────────────────────────

function UserLoansView({
  userId,
  userName,
  numeroCadastro,
  onBack,
}: {
  userId: number
  userName: string
  numeroCadastro: string
  onBack: () => void
}) {
  const [emprestimos, setEmprestimos] = useState<EmprestimoUsuario[]>([])
  const [loading, setLoading] = useState(true)
  const [returning, setReturning] = useState<number | null>(null)
  const [returned, setReturned] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const loadEmprestimos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/usuarios/${userId}/emprestimos`)
      const data: EmprestimoUsuario[] = await res.json()
      setEmprestimos(Array.isArray(data) ? data.filter((e) => e.status === 'ATIVO') : [])
    } catch {
      setEmprestimos([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadEmprestimos() }, [loadEmprestimos])

  const handleDevolver = async (e: EmprestimoUsuario) => {
    setReturning(e.id)
    setError(null)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emprestimoId: e.id, exemplarId: e.exemplarId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao registrar devolução')
      }

      setReturned((prev) => new Set([...prev, e.id]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setReturning(null)
    }
  }

  const ativos = emprestimos.filter((e) => !returned.has(e.id))

  return (
    <div className="space-y-6">

      {/* Header do usuário */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
          <User className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">{userName}</h2>
          <p className="font-mono text-sm text-muted-foreground">{numeroCadastro}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p><span className="font-semibold text-foreground">{ativos.length}</span> pendente{ativos.length !== 1 ? 's' : ''}</p>
          {returned.size > 0 && (
            <p className="text-green-600 dark:text-green-400">
              <span className="font-semibold">{returned.size}</span> devolvido{returned.size !== 1 ? 's' : ''} agora
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : emprestimos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum empréstimo ativo</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Este usuário não possui livros para devolver</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Devolvidos nesta sessão */}
          {emprestimos.filter((e) => returned.has(e.id)).map((e) => (
            <div key={e.id} className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-800/50 dark:bg-green-900/20">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-green-700 dark:text-green-300">{e.titulo}</p>
                <p className="font-mono text-xs text-green-600/70 dark:text-green-400/60">{e.codigoExemplar} · Devolvido · exemplar agora DISPONÍVEL</p>
              </div>
            </div>
          ))}

          {/* Ativos */}
          {ativos.map((e) => {
            const diasAtraso = calcDiasAtraso(e.dataPrevistaDevolucao)
            const atrasado = diasAtraso > 0
            const isReturning = returning === e.id

            return (
              <div
                key={e.id}
                className={cn(
                  'flex items-center gap-4 rounded-xl border px-5 py-4',
                  atrasado
                    ? 'border-red-200 bg-red-50/40 dark:border-red-800/50 dark:bg-red-900/10'
                    : 'border-border bg-card'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-foreground">{e.titulo}</p>
                    <span className={cn(
                      'shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      atrasado
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    )}>
                      {atrasado
                        ? <><AlertTriangle className="h-3 w-3" />{diasAtraso} dia{diasAtraso !== 1 ? 's' : ''} de atraso</>
                        : <><Clock className="h-3 w-3" />No prazo</>
                      }
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{e.codigoExemplar}</span>
                    <span>Empréstimo: {formatDate(e.dataEmprestimo)}</span>
                    <span>Previsto: {formatDate(e.dataPrevistaDevolucao)}</span>
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
  )
}

// ─── Modo busca por exemplar ──────────────────────────────────────────────────

function ExemplarSearchView() {
  const [exemplar, setExemplar] = useState('')
  const [searching, setSearching] = useState(false)
  const [emprestimo, setEmprestimo] = useState<EmprestimoAtivo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ titulo: string; exemplar: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = exemplar.trim().toUpperCase()
    if (!q) return
    setSearching(true)
    setEmprestimo(null)
    setNotFound(false)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/returns?exemplar=${encodeURIComponent(q)}`)
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erro'); return }
      setEmprestimo(await res.json())
    } catch { setError('Erro de conexão') }
    finally { setSearching(false) }
  }

  const handleDevolver = async () => {
    if (!emprestimo) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emprestimoId: emprestimo.emprestimoId, exemplarId: emprestimo.exemplarId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Erro') }
      setSuccess({ titulo: emprestimo.titulo, exemplar: emprestimo.codigoExemplar })
      setEmprestimo(null)
      setExemplar('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally { setLoading(false) }
  }

  const diasAtraso = emprestimo ? calcDiasAtraso(emprestimo.dataPrevistaDevolucao) : 0
  const atrasado = diasAtraso > 0

  return (
    <div className="space-y-6">
      {/* Busca */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
              <Search className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Buscar Exemplar</CardTitle>
              <CardDescription>Digite o número do exemplar para localizar o empréstimo ativo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                className="pl-9 font-mono uppercase"
                placeholder="EX000001"
                value={exemplar}
                onChange={(e) => { setExemplar(e.target.value); setNotFound(false); setEmprestimo(null); setError(null); setSuccess(null) }}
                disabled={searching || loading}
                autoFocus
              />
            </div>
            <Button type="submit" disabled={searching || !exemplar.trim()} className="gap-2 bg-green-600 text-white hover:bg-green-700">
              <Search className="h-4 w-4" />
              {searching ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{error}</p>
        </div>
      )}

      {notFound && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Nenhum empréstimo ativo para <span className="font-mono font-semibold">{exemplar.toUpperCase()}</span>.</p>
        </div>
      )}

      {success && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-green-200 bg-green-50 py-12 text-center dark:border-green-800/50 dark:bg-green-900/20">
          <CheckCircle2 className="mb-3 h-10 w-10 text-green-600 dark:text-green-400" />
          <p className="text-base font-semibold text-green-700 dark:text-green-300">Devolução registrada com sucesso!</p>
          <p className="mt-1 text-sm text-green-600/80">{success.titulo} · <span className="font-mono text-xs">{success.exemplar}</span></p>
          <Button className="mt-6 gap-2 bg-green-600 text-white hover:bg-green-700" onClick={() => { setSuccess(null); setTimeout(() => inputRef.current?.focus(), 50) }}>
            <RotateCcw className="h-4 w-4" />Nova Devolução
          </Button>
        </div>
      )}

      {emprestimo && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div><CardTitle className="text-base font-semibold">Exemplar</CardTitle><CardDescription>Dados do livro</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Número</p><p className="font-mono font-semibold">{emprestimo.codigoExemplar}</p></div>
                <div><p className="text-xs text-muted-foreground">Título</p><p className="font-semibold leading-snug">{emprestimo.titulo}</p></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div><CardTitle className="text-base font-semibold">Usuário</CardTitle><CardDescription>Quem está devolvendo</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-semibold leading-snug">{emprestimo.nomeCompleto}</p></div>
                <div><p className="text-xs text-muted-foreground">Nº Cadastro</p><p className="font-mono font-semibold">{emprestimo.numeroCadastro}</p></div>
              </CardContent>
            </Card>

            <Card className={cn('md:col-span-2 xl:col-span-1', atrasado && 'border-red-300 dark:border-red-800')}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', atrasado ? 'bg-red-50 dark:bg-red-900/20' : 'bg-violet-50 dark:bg-violet-900/20')}>
                    <CalendarDays className={cn('h-4 w-4', atrasado ? 'text-red-600 dark:text-red-400' : 'text-violet-600 dark:text-violet-400')} />
                  </div>
                  <div><CardTitle className="text-base font-semibold">Datas</CardTitle><CardDescription>Período do empréstimo</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-xs text-muted-foreground">Data do Empréstimo</p><p className="font-semibold">{formatDate(emprestimo.dataEmprestimo)}</p></div>
                <div><p className="text-xs text-muted-foreground">Devolução Prevista</p><p className="font-semibold">{formatDate(emprestimo.dataPrevistaDevolucao)}</p></div>
                <div className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium', atrasado ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300')}>
                  {atrasado ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Clock className="h-4 w-4 shrink-0" />}
                  {atrasado ? <span><span className="font-bold">{diasAtraso} dia{diasAtraso !== 1 ? 's' : ''}</span> de atraso</span> : <span>No prazo</span>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end gap-3 rounded-xl border border-border bg-muted/20 px-6 py-4">
            <p className="flex-1 text-sm text-muted-foreground">
              Confirme a devolução de <span className="font-mono font-semibold text-foreground">{emprestimo.codigoExemplar}</span>. O status será alterado para <span className="font-semibold text-green-600">DISPONÍVEL</span>.
            </p>
            <Button onClick={handleDevolver} disabled={loading} className="gap-2 bg-green-600 text-white hover:bg-green-700">
              <RotateCcw className="h-4 w-4" />
              {loading ? 'Registrando...' : 'Registrar Devolução'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Busca por usuário ────────────────────────────────────────────────────────

function UserSearchView() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<UserResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selected) return
    if (search.trim().length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch('/api/usuarios')
        if (res.ok) {
          const all: UserResult[] = await res.json()
          const q = search.toLowerCase()
          setResults(all.filter((u) => u.nomeCompleto.toLowerCase().includes(q)).slice(0, 8))
        }
      } finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, selected])

  const selectUser = (u: UserResult) => {
    setSelected(u)
    setResults([])
    setSearch(u.nomeCompleto)
  }

  const clearUser = () => {
    setSelected(null)
    setSearch('')
    setResults([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Buscar Usuário</CardTitle>
              <CardDescription>Digite o nome para localizar os empréstimos ativos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                className="pl-9 pr-9"
                placeholder="Nome do usuário..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (selected) setSelected(null) }}
                disabled={!!selected}
                autoFocus
              />
              {(search || selected) && (
                <button
                  onClick={clearUser}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Limpar"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {results.length > 0 && !selected && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
                {searching && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Buscando...</div>
                )}
                {results.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                      <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{u.nomeCompleto}</p>
                      <p className="font-mono text-xs text-muted-foreground">{u.numeroCadastro}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {search.trim().length >= 2 && !searching && results.length === 0 && !selected && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover px-3 py-3 shadow-lg">
                <p className="text-sm text-muted-foreground">Nenhum usuário encontrado para <span className="font-medium text-foreground">"{search}"</span></p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <UserLoansView
          userId={selected.id}
          userName={selected.nomeCompleto}
          numeroCadastro={selected.numeroCadastro}
          onBack={clearUser}
        />
      )}
    </div>
  )
}

// ─── Componente raiz ──────────────────────────────────────────────────────────

type Mode = 'exemplar' | 'usuario'

export function ReturnsForm() {
  const router = useRouter()
  const params = useSearchParams()

  const userId = params.get('userId')
  const nome   = params.get('nome') ?? ''
  const cadastro = params.get('cadastro') ?? ''

  const [mode, setMode] = useState<Mode>('exemplar')

  // navegação via URL param (ex: vindo da lista de usuários)
  if (userId) {
    return (
      <UserLoansView
        userId={Number(userId)}
        userName={nome}
        numeroCadastro={cadastro}
        onBack={() => router.back()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Toggle de modo */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
        <button
          onClick={() => setMode('exemplar')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            mode === 'exemplar'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BookOpen className="h-4 w-4" />
          Nº do Exemplar
        </button>
        <button
          onClick={() => setMode('usuario')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            mode === 'usuario'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <User className="h-4 w-4" />
          Nome do Usuário
        </button>
      </div>

      {mode === 'exemplar' ? <ExemplarSearchView /> : <UserSearchView />}
    </div>
  )
}
