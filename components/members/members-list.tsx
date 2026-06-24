'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Search,
  Plus,
  Phone,
  Mail,
  BookOpen,
  Edit2,
  History,
  Trash2,
  Users,
  UserCheck,
  UserX,
  MoreHorizontal,
} from 'lucide-react'

interface Usuario {
  id: number
  numeroCadastro: string
  nomeCompleto: string
  cpf?: string | null
  dataNascimento?: string | null
  celular?: string | null
  email?: string | null
  membro: boolean
  ativo: boolean
  createdAt: string
  _count?: { emprestimos: number }
}

interface MembersListProps {
  refreshTrigger?: number
  onNewUser?: () => void
}

type Filter = 'todos' | 'membros' | 'nao-membros'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'membros', label: 'Membros' },
  { key: 'nao-membros', label: 'Não Membros' },
]

const AVATAR_PALETTE = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getAvatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

export function MembersList({ refreshTrigger, onNewUser }: MembersListProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/usuarios')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch {
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsuarios() }, [refreshTrigger])

  // Close dropdown on outside click
  useEffect(() => {
    if (openDropdown === null) return
    const close = () => setOpenDropdown(null)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openDropdown])

  const handleDelete = async (id: number, nome: string) => {
    setOpenDropdown(null)
    if (!confirm(`Deseja realmente remover ${nome}?`)) return
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setUsuarios((prev) => prev.filter((u) => u.id !== id))
    } catch {
      alert('Erro ao remover usuário')
    }
  }

  const filtered = usuarios.filter((u) => {
    const matchesFilter =
      filter === 'todos' ||
      (filter === 'membros' && u.membro) ||
      (filter === 'nao-membros' && !u.membro)

    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !q ||
      u.nomeCompleto.toLowerCase().includes(q) ||
      u.numeroCadastro.toLowerCase().includes(q) ||
      (u.cpf ?? '').includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)

    return matchesFilter && matchesSearch
  })

  const totalMembros = usuarios.filter((u) => u.membro).length
  const totalNaoMembros = usuarios.filter((u) => !u.membro).length

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Usuários</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os leitores cadastrados da biblioteca
          </p>
        </div>
        <Button
          onClick={onNewUser}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* ── Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
                {usuarios.length}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Total Usuários</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
                {totalMembros}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Membros</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
              <UserX className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
                {totalNaoMembros}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Não Membros</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Filters ─────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex shrink-0 rounded-lg border border-border bg-muted/30 p-1 gap-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filter === key
                  ? 'bg-white text-foreground shadow-sm dark:bg-slate-800'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Card Grid ────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {searchTerm || filter !== 'todos'
              ? 'Nenhum usuário encontrado'
              : 'Nenhum usuário cadastrado'}
          </p>
          {!searchTerm && filter === 'todos' && (
            <p className="mt-1 text-xs text-muted-foreground/60">
              Clique em "Novo Usuário" para cadastrar o primeiro leitor
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
            {searchTerm || filter !== 'todos' ? ' encontrado' + (filtered.length !== 1 ? 's' : '') : ''}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((usuario) => {
              const initials = getInitials(usuario.nomeCompleto)
              const avatarColor = getAvatarColor(usuario.nomeCompleto)
              const loanCount = usuario._count?.emprestimos ?? 0

              return (
                <Card
                  key={usuario.id}
                  className="group flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md"
                >
                  <CardContent className="flex flex-1 flex-col p-0">

                    {/* Top: avatar + nome + badge */}
                    <div className="flex items-start gap-3 p-4 pb-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                          avatarColor
                        )}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground leading-snug">
                          {usuario.nomeCompleto}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {usuario.numeroCadastro}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          usuario.membro
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {usuario.membro ? 'Membro' : 'Não Membro'}
                      </span>
                    </div>

                    <div className="mx-4 border-t border-border/60" />

                    {/* Contact + stats */}
                    <div className="flex-1 space-y-2 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{usuario.celular || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{usuario.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {loanCount} empréstimo{loanCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mx-4 border-t border-border/60" />

                    {/* Footer actions */}
                    <div className="flex items-center gap-1 px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <History className="h-3.5 w-3.5" />
                        Histórico
                      </Button>

                      {/* Dropdown */}
                      <div className="relative ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenDropdown(
                              openDropdown === usuario.id ? null : usuario.id
                            )
                          }}
                          aria-label="Mais opções"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {openDropdown === usuario.id && (
                          <div
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute bottom-full right-0 z-50 mb-1 w-40 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
                          >
                            <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors">
                              <Edit2 className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors">
                              <History className="h-3.5 w-3.5" />
                              Ver Detalhes
                            </button>
                            <div className="mx-2 my-1 border-t border-border/60" />
                            <button
                              onClick={() =>
                                handleDelete(usuario.id, usuario.nomeCompleto)
                              }
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

    </div>
  )
}
