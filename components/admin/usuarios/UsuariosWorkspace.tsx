'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, Lock, Power, Trash2, Search, Users } from 'lucide-react'
import { Button }       from '@/components/ui/button'
import { Input }        from '@/components/ui/input'
import { StatusBadge }  from '@/components/ui/status-badge'
import { ActionMenu }   from '@/components/ui/action-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton }     from '@/components/ui/loading-state'
import { useToast }     from '@/components/ui/toast'
import { UsuarioDialog, type SystemUser, type Role } from './UsuarioDialog'
import { AlterarSenhaDialog } from './AlterarSenhaDialog'

// ── helpers ────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN:         'Administrador',
  BIBLIOTECARIO: 'Bibliotecário',
  ATENDENTE:     'Auxiliar',
  CONSULTA:      'Consulta',
}
const roleLabel = (nome: string) => ROLE_LABELS[nome] ?? nome

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── component ──────────────────────────────────────────────────────────────────

export function UsuariosWorkspace() {
  const { toast } = useToast()
  const [users,   setUsers]   = useState<SystemUser[]>([])
  const [roles,   setRoles]   = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  // dialogs
  const [dialogOpen,  setDialogOpen]  = useState(false)
  const [editUser,    setEditUser]    = useState<SystemUser | null>(null)
  const [senhaUser,   setSenhaUser]   = useState<SystemUser | null>(null)
  const [statusUser,  setStatusUser]  = useState<SystemUser | null>(null)
  const [deleteUser,  setDeleteUser]  = useState<SystemUser | null>(null)

  // ── data loading ─────────────────────────────────────────────────────────────

  const loadUsers = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const qs  = q ? `?search=${encodeURIComponent(q)}` : ''
      const res = await fetch(`/api/sistema/usuarios${qs}`)
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch {
      toast({ variant: 'error', title: 'Erro ao carregar usuários' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/sistema/roles')
      if (res.ok) setRoles(await res.json())
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => { loadUsers(); loadRoles() }, [loadUsers, loadRoles])

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => loadUsers(search || undefined), 300)
    return () => clearTimeout(t)
  }, [search, loadUsers])

  // ── actions ───────────────────────────────────────────────────────────────────

  function openCreate() { setEditUser(null); setDialogOpen(true) }
  function openEdit(u: SystemUser) { setEditUser(u); setDialogOpen(true) }

  function handleSaved() {
    setDialogOpen(false)
    toast({ variant: 'success', title: editUser ? 'Usuário atualizado' : 'Usuário criado' })
    loadUsers(search || undefined)
  }

  async function handleToggleStatus() {
    if (!statusUser) return
    try {
      const res = await fetch(`/api/sistema/usuarios/${statusUser.id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ativo: !statusUser.ativo }),
      })
      if (!res.ok) throw new Error()
      toast({ variant: 'success', title: statusUser.ativo ? 'Usuário desativado' : 'Usuário reativado' })
      await loadUsers(search || undefined)
    } catch {
      toast({ variant: 'error', title: 'Erro ao alterar status' })
    } finally {
      setStatusUser(null)
    }
  }

  async function handleDelete() {
    if (!deleteUser) return
    try {
      const res = await fetch(`/api/sistema/usuarios/${deleteUser.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro')
      }
      toast({ variant: 'success', title: 'Usuário excluído' })
      await loadUsers(search || undefined)
    } catch (e) {
      toast({ variant: 'error', title: e instanceof Error ? e.message : 'Erro ao excluir' })
    } finally {
      setDeleteUser(null)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, login ou e-mail…"
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button variant="ghost" size="icon" className="size-9 shrink-0" onClick={() => loadUsers(search || undefined)}>
          <RefreshCw className="size-3.5" />
        </Button>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={openCreate}>
          <Plus className="size-3.5" />
          Novo usuário
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>

      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="size-10 text-slate-200 mb-3" />
          <p className="text-sm font-medium text-slate-500">Nenhum usuário encontrado</p>
          {search && (
            <p className="text-xs text-slate-400 mt-1">
              Tente outro termo ou{' '}
              <button onClick={() => setSearch('')} className="underline hover:text-slate-600">limpe a busca</button>
            </p>
          )}
        </div>

      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-slate-50/60">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Nome</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Login</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Perfil</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Último acesso</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 leading-tight">{u.nome}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 font-mono text-xs text-slate-600">{u.login}</td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    {u.roles[0] ? (
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                        {roleLabel(u.roles[0].nome)}
                      </span>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={u.ativo ? 'disponivel' : 'inativo'}
                      label={u.ativo ? 'Ativo' : 'Inativo'}
                      dot={u.ativo}
                    />
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3 text-xs text-slate-400 tabular-nums">
                    {fmtDate(u.ultimoLogin)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <ActionMenu
                      align="end"
                      items={[
                        { label: 'Editar',         icon: <Pencil className="size-3.5" />, onClick: () => openEdit(u) },
                        { label: 'Alterar senha',  icon: <Lock   className="size-3.5" />, onClick: () => setSenhaUser(u) },
                        {
                          label: u.ativo ? 'Desativar' : 'Reativar',
                          icon:  <Power className="size-3.5" />,
                          onClick: () => setStatusUser(u),
                          separator: true,
                        },
                        {
                          label: 'Excluir',
                          icon: <Trash2 className="size-3.5" />,
                          onClick: () => setDeleteUser(u),
                          destructive: true,
                          disabled: u.ativo,
                          separator: true,
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Dialogs ── */}
      <UsuarioDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaved}
        user={editUser}
        roles={roles}
      />

      <AlterarSenhaDialog
        open={!!senhaUser}
        onClose={() => setSenhaUser(null)}
        onSave={() => {
          setSenhaUser(null)
          toast({ variant: 'success', title: 'Senha alterada com sucesso' })
        }}
        userId={senhaUser?.id ?? ''}
        userName={senhaUser?.nome ?? ''}
      />

      <ConfirmDialog
        open={!!statusUser}
        onClose={() => setStatusUser(null)}
        onConfirm={handleToggleStatus}
        title={statusUser?.ativo ? 'Desativar usuário' : 'Reativar usuário'}
        description={
          statusUser?.ativo
            ? `Desativar "${statusUser.nome}"? Ele não conseguirá mais acessar o sistema.`
            : `Reativar "${statusUser?.nome}"? Ele voltará a ter acesso ao sistema.`
        }
        intent={statusUser?.ativo ? 'destructive' : 'confirm'}
        confirmLabel={statusUser?.ativo ? 'Desativar' : 'Reativar'}
      />

      <ConfirmDialog
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Excluir usuário"
        description={`Excluir permanentemente "${deleteUser?.nome}"? Esta ação não pode ser desfeita.`}
        intent="destructive"
        confirmLabel="Excluir"
      />
    </div>
  )
}
