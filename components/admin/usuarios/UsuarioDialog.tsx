'use client'

import { useState, useEffect } from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'

export interface Role { id: string; nome: string }

export interface SystemUser {
  id: string
  nome: string
  login: string
  email: string
  ativo: boolean
  ultimoLogin: string | null
  createdAt: string
  roles: Array<{ id: string; nome: string }>
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: () => void
  user?: SystemUser | null
  roles: Role[]
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN:        'Administrador',
  BIBLIOTECARIO: 'Bibliotecário',
  ATENDENTE:    'Auxiliar',
  CONSULTA:     'Consulta',
}
const roleLabel = (nome: string) => ROLE_LABELS[nome] ?? nome

const INITIAL = {
  nome: '', login: '', email: '', roleId: '', ativo: 'ativo', senha: '', confirmar: '',
}
type Form = typeof INITIAL

export function UsuarioDialog({ open, onClose, onSave, user, roles }: Props) {
  const isEdit = !!user
  const [form,        setForm]        = useState<Form>(INITIAL)
  const [errors,      setErrors]      = useState<Partial<Record<keyof Form, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [showPw,      setShowPw]      = useState(false)

  useEffect(() => {
    if (!open) return
    if (user) {
      setForm({
        nome:      user.nome,
        login:     user.login,
        email:     user.email,
        roleId:    user.roles[0]?.id ?? '',
        ativo:     user.ativo ? 'ativo' : 'inativo',
        senha:     '',
        confirmar: '',
      })
    } else {
      setForm({ ...INITIAL, roleId: roles[0]?.id ?? '' })
    }
    setErrors({})
    setServerError(null)
    setShowPw(false)
  }, [open, user, roles])

  function field(key: keyof Form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof Form, string>> = {}
    if (!form.nome.trim())  e.nome  = 'Obrigatório'
    if (!form.login.trim()) e.login = 'Obrigatório'
    if (!form.roleId)       e.roleId = 'Selecione um perfil'
    if (!form.email.trim()) {
      e.email = 'Obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'E-mail inválido'
    }
    if (!isEdit) {
      if (!form.senha)                 e.senha     = 'Obrigatório'
      else if (form.senha.length < 8)  e.senha     = 'Mínimo 8 caracteres'
      if (!form.confirmar)             e.confirmar = 'Obrigatório'
      else if (form.senha !== form.confirmar) e.confirmar = 'Senhas não coincidem'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    setServerError(null)
    try {
      const body: Record<string, unknown> = {
        nome:  form.nome.trim(),
        login: form.login.trim(),
        email: form.email.trim(),
        roleId: form.roleId,
        ativo: form.ativo === 'ativo',
      }
      if (!isEdit) body.senha = form.senha

      const url    = isEdit ? `/api/sistema/usuarios/${user!.id}` : '/api/sistema/usuarios'
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'LOGIN_TAKEN') setErrors(prev => ({ ...prev, login: 'Login já está em uso' }))
        else if (data.code === 'EMAIL_TAKEN') setErrors(prev => ({ ...prev, email: 'E-mail já está em uso' }))
        else setServerError(data.error ?? 'Erro ao salvar')
        return
      }
      onSave()
    } catch {
      setServerError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const selectCls = [
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
    'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ].join(' ')

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !saving) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="u-nome">Nome completo <span className="text-red-500">*</span></Label>
            <Input id="u-nome" value={form.nome} onChange={e => field('nome', e.target.value)} placeholder="Nome completo" />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
          </div>

          {/* Login */}
          <div className="space-y-1.5">
            <Label htmlFor="u-login">Login <span className="text-red-500">*</span></Label>
            <Input id="u-login" value={form.login} onChange={e => field('login', e.target.value)} placeholder="ex: joao.silva" autoComplete="off" />
            {errors.login && <p className="text-xs text-red-500">{errors.login}</p>}
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Label htmlFor="u-email">E-mail <span className="text-red-500">*</span></Label>
            <Input id="u-email" type="email" value={form.email} onChange={e => field('email', e.target.value)} placeholder="usuario@exemplo.com" />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Senha — somente na criação */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-senha">Senha <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="u-senha"
                    type={showPw ? 'text' : 'password'}
                    value={form.senha}
                    onChange={e => field('senha', e.target.value)}
                    placeholder="Mín. 8 caracteres"
                    className="pr-9"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.senha && <p className="text-xs text-red-500">{errors.senha}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-confirmar">Confirmar <span className="text-red-500">*</span></Label>
                <Input
                  id="u-confirmar"
                  type={showPw ? 'text' : 'password'}
                  value={form.confirmar}
                  onChange={e => field('confirmar', e.target.value)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                />
                {errors.confirmar && <p className="text-xs text-red-500">{errors.confirmar}</p>}
              </div>
            </div>
          )}

          {/* Perfil + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-role">Perfil <span className="text-red-500">*</span></Label>
              <select id="u-role" value={form.roleId} onChange={e => field('roleId', e.target.value)} className={selectCls}>
                <option value="">Selecionar…</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{roleLabel(r.nome)}</option>
                ))}
              </select>
              {errors.roleId && <p className="text-xs text-red-500">{errors.roleId}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-status">Status</Label>
              <select id="u-status" value={form.ativo} onChange={e => field('ativo', e.target.value)} className={selectCls}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5 min-w-24">
            {saving ? <><Loader2 className="size-3.5 animate-spin" /> Salvando…</> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
