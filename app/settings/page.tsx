'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePageTitle } from '@/components/page-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, RotateCcw } from 'lucide-react'

interface Configuracao {
  id: number
  prazoEmprestimoDias: number
  maxEmprestimos: number
  pastaBackup: string | null
  pastaExportacao: string | null
  updatedAt: string
}

type FormFields = {
  prazoEmprestimoDias: string
  maxEmprestimos: string
  pastaBackup: string
  pastaExportacao: string
}

function toForm(c: Configuracao): FormFields {
  return {
    prazoEmprestimoDias: String(c.prazoEmprestimoDias),
    maxEmprestimos: String(c.maxEmprestimos),
    pastaBackup: c.pastaBackup ?? '',
    pastaExportacao: c.pastaExportacao ?? '',
  }
}

export default function SettingsPage() {
  const { setPageInfo } = usePageTitle()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [original, setOriginal] = useState<FormFields | null>(null)
  const [form, setForm] = useState<FormFields>({
    prazoEmprestimoDias: '14',
    maxEmprestimos: '3',
    pastaBackup: '',
    pastaExportacao: '',
  })

  useEffect(() => {
    setPageInfo('Configurações', 'Parâmetros de operação da biblioteca')
  }, [setPageInfo])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/configuracoes')
      if (!res.ok) throw new Error('Erro ao carregar configurações')
      const data: Configuracao = await res.json()
      const fields = toForm(data)
      setForm(fields)
      setOriginal(fields)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleReset = () => {
    if (original) setForm(original)
    setSaved(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const prazo = parseInt(form.prazoEmprestimoDias, 10)
    const max = parseInt(form.maxEmprestimos, 10)

    if (isNaN(prazo) || prazo < 1 || prazo > 365) {
      setError('Prazo de empréstimo deve ser entre 1 e 365 dias.')
      setSaving(false)
      return
    }
    if (isNaN(max) || max < 1 || max > 99) {
      setError('Limite de empréstimos simultâneos deve ser entre 1 e 99.')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prazoEmprestimoDias: prazo,
          maxEmprestimos: max,
          pastaBackup: form.pastaBackup || null,
          pastaExportacao: form.pastaExportacao || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao salvar')
      }
      const updated: Configuracao = await res.json()
      const fields = toForm(updated)
      setForm(fields)
      setOriginal(fields)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Carregando configurações…
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">

      {/* Circulação */}
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Circulação</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Regras padrão para empréstimos</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prazoEmprestimoDias">Prazo de empréstimo (dias)</Label>
            <Input
              id="prazoEmprestimoDias"
              name="prazoEmprestimoDias"
              type="number"
              min={1}
              max={365}
              value={form.prazoEmprestimoDias}
              onChange={handleChange}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">Prazo padrão aplicado a novos empréstimos</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maxEmprestimos">Limite de empréstimos simultâneos</Label>
            <Input
              id="maxEmprestimos"
              name="maxEmprestimos"
              type="number"
              min={1}
              max={99}
              value={form.maxEmprestimos}
              onChange={handleChange}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">Máximo de exemplares por usuário ao mesmo tempo</p>
          </div>
        </div>
      </Card>

      {/* Arquivos */}
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Arquivos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Pastas para backup e exportação</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pastaBackup">Pasta de backup</Label>
            <Input
              id="pastaBackup"
              name="pastaBackup"
              type="text"
              value={form.pastaBackup}
              onChange={handleChange}
              disabled={saving}
              placeholder="Ex: C:\Backup\Biblioteca"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pastaExportacao">Pasta de exportação</Label>
            <Input
              id="pastaExportacao"
              name="pastaExportacao"
              type="text"
              value={form.pastaExportacao}
              onChange={handleChange}
              disabled={saving}
              placeholder="Ex: C:\Exportações\Biblioteca"
            />
          </div>
        </div>
      </Card>

      {/* Feedback + ações */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {saved && !error && (
        <p className="text-sm text-green-600 dark:text-green-400">Configurações salvas com sucesso.</p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={saving || loading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Descartar alterações
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando…' : 'Salvar configurações'}
        </Button>
      </div>
    </form>
  )
}
