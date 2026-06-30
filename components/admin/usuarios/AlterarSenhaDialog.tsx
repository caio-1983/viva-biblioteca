'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'

interface Props {
  open: boolean
  onClose: () => void
  onSave: () => void
  userId: string
  userName: string
}

export function AlterarSenhaDialog({ open, onClose, onSave, userId, userName }: Props) {
  const [senha,       setSenha]       = useState('')
  const [confirmar,   setConfirmar]   = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [errors,      setErrors]      = useState<{ senha?: string; confirmar?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (!open) { setSenha(''); setConfirmar(''); setErrors({}); setServerError(null); setShowPw(false) }
  }, [open])

  function validate(): boolean {
    const e: { senha?: string; confirmar?: string } = {}
    if (!senha)             e.senha     = 'Obrigatório'
    else if (senha.length < 8) e.senha  = 'Mínimo 8 caracteres'
    if (!confirmar)         e.confirmar = 'Obrigatório'
    else if (senha !== confirmar) e.confirmar = 'Senhas não coincidem'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    setServerError(null)
    try {
      const res = await fetch(`/api/sistema/usuarios/${userId}/senha`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ senha }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setServerError(data.error ?? 'Erro ao alterar senha')
        return
      }
      onSave()
    } catch {
      setServerError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !saving) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <p className="text-sm text-slate-500">
            Definir nova senha para <span className="font-medium text-slate-700">{userName}</span>
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="ap-senha">Nova senha <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="ap-senha"
                type={showPw ? 'text' : 'password'}
                value={senha}
                onChange={e => { setSenha(e.target.value); setErrors(prev => ({ ...prev, senha: undefined })) }}
                placeholder="Mínimo 8 caracteres"
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
            <Label htmlFor="ap-confirmar">Confirmar nova senha <span className="text-red-500">*</span></Label>
            <Input
              id="ap-confirmar"
              type={showPw ? 'text' : 'password'}
              value={confirmar}
              onChange={e => { setConfirmar(e.target.value); setErrors(prev => ({ ...prev, confirmar: undefined })) }}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
            />
            {errors.confirmar && <p className="text-xs text-red-500">{errors.confirmar}</p>}
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
