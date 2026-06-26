'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Settings, Upload, Users, Tag, HardDrive, ClipboardList, Plug,
  Save, RotateCcw, CheckCircle2, AlertTriangle, Loader2, FileText,
  Clock, Database, Barcode, Globe, Zap, BookOpen, Search as SearchIcon,
  ChevronRight, X, Plus, Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { PageHeader }         from '@/components/ui/page-header'
import { Section }            from '@/components/ui/section'
import { Card, CardContent }  from '@/components/ui/card'
import { Button }             from '@/components/ui/button'
import { Input }              from '@/components/ui/input'
import { Label }              from '@/components/ui/label'
import { StatusBadge }        from '@/components/ui/status-badge'
import { Drawer }             from '@/components/ui/drawer'
import { ConfirmDialog }      from '@/components/ui/confirm-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Configuracao {
  id: number
  prazoEmprestimoDias: number
  maxEmprestimos: number
  pastaBackup: string | null
  pastaExportacao: string | null
  updatedAt: string
}

interface ImportResult {
  total: number
  imported: number
  skipped: number
  errors: Array<{ row: number; reason: string }>
  columns: { found: string[]; mapped: string[]; ignored: string[] }
}

// ─── SectionCard — layout shell ───────────────────────────────────────────────

function SectionCard({
  icon, title, description, badge, children, id,
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge?: 'ativo' | 'parcial' | 'em-breve'
  children?: React.ReactNode
  id?: string
}) {
  const BADGE = {
    'ativo':    { status: 'disponivel' as const, label: 'Ativo'     },
    'parcial':  { status: 'reservado'  as const, label: 'Parcial'   },
    'em-breve': { status: 'inativo'    as const, label: 'Em breve'  },
  }

  return (
    <Card id={id} className="border border-border/60 bg-white shadow-none overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border/50 bg-slate-50/60">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-white border border-border/60 flex items-center justify-center shrink-0 mt-0.5 text-slate-500">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
        {badge && (
          <StatusBadge
            status={BADGE[badge].status}
            label={BADGE[badge].label}
            dot={badge === 'ativo'}
          />
        )}
      </div>

      {/* Body */}
      {children && (
        <CardContent className="p-5">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

// ─── SettingRow — single config row (Vercel-style) ────────────────────────────

function SettingRow({
  label, description, children, disabled, coming,
}: {
  label: string
  description?: string
  children: React.ReactNode
  disabled?: boolean
  coming?: boolean
}) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-border/40 last:border-0',
      disabled && 'opacity-50'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          {coming && (
            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-medium">Em breve</span>
          )}
        </div>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="w-full sm:w-52 shrink-0">
        {children}
      </div>
    </div>
  )
}

// ─── PlaceholderRow — future feature row ──────────────────────────────────────

function ComingSoonItem({ icon, label, description }: {
  icon: React.ReactNode; label: string; description: string
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0 opacity-60">
      <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded shrink-0">Em breve</span>
    </div>
  )
}

// ─── ImportDrawer ─────────────────────────────────────────────────────────────

function ImportDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file,      setFile]      = useState<File | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const [importing, setImporting] = useState(false)
  const [result,    setResult]    = useState<ImportResult | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFile(null); setResult(null); setError(null); setImporting(false)
  }

  useEffect(() => { if (!open) reset() }, [open])

  function handleFile(f: File) {
    if (!f.name.endsWith('.csv')) { setError('O arquivo deve ser CSV.'); return }
    setFile(f); setError(null); setResult(null)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleImport() {
    if (!file) return
    setImporting(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/acervo/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao importar')
      setResult(data as ImportResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setImporting(false)
    }
  }

  const fmtSize = (b: number) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Importar CSV"
      description="Colunas esperadas: TÍTULO; Autor; Editora; ISBN; Ano; Assunto; Tombo; Classificação"
      width="md"
      footer={
        result ? (
          <Button onClick={onClose}>Concluir</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleImport} disabled={!file || importing} className="gap-1.5">
              {importing
                ? <><Loader2 className="size-3.5 animate-spin" /> Importando…</>
                : <><Upload className="size-3.5" /> Importar</>
              }
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        {/* Result */}
        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Importação concluída</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {result.imported} importado{result.imported !== 1 ? 's' : ''} ·{' '}
                  {result.skipped} ignorado{result.skipped !== 1 ? 's' : ''} ·{' '}
                  {result.errors.length} erro{result.errors.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Total', value: result.total, color: 'text-slate-700' },
                { label: 'Importados', value: result.imported, color: 'text-emerald-600' },
                { label: 'Ignorados', value: result.skipped, color: 'text-amber-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 bg-slate-50 rounded-lg border border-border/60">
                  <p className={cn('text-xl font-bold', color)}>{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Erros</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-slate-500">
                    <span className="font-mono text-slate-400">Linha {e.row}: </span>{e.reason}
                  </p>
                ))}
              </div>
            )}

            {result.columns.ignored.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700 font-medium">Colunas não mapeadas</p>
                <p className="text-xs text-amber-600 mt-0.5">{result.columns.ignored.join(', ')}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Download template */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-border/60">
              <div>
                <p className="text-sm font-medium text-slate-700">Modelo de planilha</p>
                <p className="text-xs text-slate-400">CSV com as colunas corretas</p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" disabled>
                <Download className="size-3.5" />
                Baixar modelo
              </Button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                dragging ? 'border-brand-400 bg-brand-50'
                         : file ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="size-8 text-emerald-500" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
                    <p className="text-xs text-emerald-500">{fmtSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="size-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Arraste o CSV aqui</p>
                  <p className="text-xs text-slate-400 mt-1">ou clique para selecionar</p>
                </>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="size-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Drawer>
  )
}

// ─── AdminWorkspace ───────────────────────────────────────────────────────────

export function AdminWorkspace() {
  // Config state
  const [config,    setConfig]    = useState<Configuracao | null>(null)
  const [loadErr,   setLoadErr]   = useState(false)
  const [prazo,     setPrazo]     = useState('')
  const [maxEmpr,   setMaxEmpr]   = useState('')
  const [backup,    setBackup]    = useState('')
  const [exportDir, setExportDir] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saveOk,    setSaveOk]    = useState(false)
  const [saveErr,   setSaveErr]   = useState<string | null>(null)
  const [dirty,     setDirty]     = useState(false)

  // Import drawer
  const [importOpen, setImportOpen] = useState(false)

  // Backup confirm
  const [backupConfirmOpen, setBackupConfirmOpen] = useState(false)
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)

  // Load config
  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/configuracoes')
      if (!res.ok) throw new Error()
      const data: Configuracao = await res.json()
      setConfig(data)
      setPrazo(String(data.prazoEmprestimoDias))
      setMaxEmpr(String(data.maxEmprestimos))
      setBackup(data.pastaBackup ?? '')
      setExportDir(data.pastaExportacao ?? '')
    } catch {
      setLoadErr(true)
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  function markDirty() { setDirty(true); setSaveOk(false); setSaveErr(null) }

  async function handleSaveConfig() {
    const p = parseInt(prazo, 10)
    const m = parseInt(maxEmpr, 10)
    if (isNaN(p) || p < 1 || p > 365) { setSaveErr('Prazo deve ser entre 1 e 365 dias.'); return }
    if (isNaN(m) || m < 1 || m > 99)  { setSaveErr('Limite deve ser entre 1 e 99.'); return }

    setSaving(true); setSaveErr(null); setSaveOk(false)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prazoEmprestimoDias: p,
          maxEmprestimos: m,
          pastaBackup:    backup    || null,
          pastaExportacao: exportDir || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Erro ao salvar')
      }
      const updated: Configuracao = await res.json()
      setConfig(updated)
      setDirty(false)
      setSaveOk(true)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (!config) return
    setPrazo(String(config.prazoEmprestimoDias))
    setMaxEmpr(String(config.maxEmprestimos))
    setBackup(config.pastaBackup ?? '')
    setExportDir(config.pastaExportacao ?? '')
    setDirty(false); setSaveOk(false); setSaveErr(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-16 max-w-3xl">

      <PageHeader
        title="Administração"
        description="Configurações globais, importações, usuários e integrações do sistema"
      />

      {/* ── 1. CONFIGURAÇÕES GERAIS ── */}
      <SectionCard
        id="config-gerais"
        icon={<Settings className="size-4" />}
        title="Configurações Gerais"
        description="Parâmetros de circulação e operação da biblioteca"
        badge="ativo"
      >
        {loadErr ? (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="size-4" />
            Não foi possível carregar as configurações.{' '}
            <button onClick={loadConfig} className="underline">Tentar novamente</button>
          </div>
        ) : (
          <div className="space-y-0 -my-1">
            {/* Prazo de empréstimo */}
            <SettingRow
              label="Prazo padrão de empréstimo"
              description="Dias concedidos em cada novo empréstimo"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={prazo}
                  onChange={e => { setPrazo(e.target.value); markDirty() }}
                  className="w-24 text-center"
                  disabled={saving || !config}
                />
                <span className="text-xs text-slate-400 shrink-0">dias</span>
              </div>
            </SettingRow>

            {/* Máximo de empréstimos */}
            <SettingRow
              label="Empréstimos simultâneos"
              description="Limite de exemplares por leitor ao mesmo tempo"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={maxEmpr}
                  onChange={e => { setMaxEmpr(e.target.value); markDirty() }}
                  className="w-24 text-center"
                  disabled={saving || !config}
                />
                <span className="text-xs text-slate-400 shrink-0">exemplares</span>
              </div>
            </SettingRow>

            {/* Máximo de renovações — futuro */}
            <SettingRow
              label="Máximo de renovações"
              description="Vezes que um empréstimo pode ser renovado"
              coming
              disabled
            >
              <Input disabled placeholder="ex: 2" className="w-24 text-center" />
            </SettingRow>

            {/* Dias para aviso de atraso — futuro */}
            <SettingRow
              label="Aviso de vencimento"
              description="Enviar alerta quantos dias antes do prazo"
              coming
              disabled
            >
              <div className="flex items-center gap-2">
                <Input disabled placeholder="ex: 3" className="w-24 text-center" />
                <span className="text-xs text-slate-300 shrink-0">dias</span>
              </div>
            </SettingRow>

            {/* Pasta de backup */}
            <SettingRow
              label="Pasta de backup"
              description="Diretório local para arquivos de backup"
            >
              <Input
                value={backup}
                onChange={e => { setBackup(e.target.value); markDirty() }}
                placeholder="ex: C:\Backup\Biblioteca"
                disabled={saving || !config}
                className="text-xs font-mono"
              />
            </SettingRow>

            {/* Pasta de exportação */}
            <SettingRow
              label="Pasta de exportação"
              description="Diretório para relatórios e exportações"
            >
              <Input
                value={exportDir}
                onChange={e => { setExportDir(e.target.value); markDirty() }}
                placeholder="ex: C:\Exportações"
                disabled={saving || !config}
                className="text-xs font-mono"
              />
            </SettingRow>

            {/* Idioma — futuro */}
            <SettingRow label="Idioma da interface" coming disabled>
              <Input disabled placeholder="Português (Brasil)" />
            </SettingRow>

            {/* Fuso horário — futuro */}
            <SettingRow label="Fuso horário" coming disabled>
              <Input disabled placeholder="America/Sao_Paulo" />
            </SettingRow>

            {/* Feedback + actions */}
            <div className="pt-4 flex items-center justify-between gap-3">
              <div>
                {saveOk && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                    <CheckCircle2 className="size-4" /> Configurações salvas
                  </span>
                )}
                {saveErr && (
                  <span className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertTriangle className="size-4" /> {saveErr}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={!dirty || saving}
                  className="gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  Descartar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveConfig}
                  disabled={!dirty || saving || !config}
                  className="gap-1.5"
                >
                  {saving
                    ? <><Loader2 className="size-3.5 animate-spin" /> Salvando…</>
                    : <><Save className="size-3.5" /> Salvar</>
                  }
                </Button>
              </div>
            </div>

            {config && (
              <p className="text-[11px] text-slate-300 pt-1">
                Última atualização: {new Date(config.updatedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── 2. IMPORTAÇÕES ── */}
      <SectionCard
        id="importacoes"
        icon={<Upload className="size-4" />}
        title="Importações"
        description="Importe acervo em lote via CSV ou formatos bibliotecários"
        badge="parcial"
      >
        <div className="space-y-0 -my-1">
          {/* CSV — ativo */}
          <div className="flex items-center justify-between py-4 border-b border-border/40">
            <div className="flex items-start gap-3">
              <FileText className="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700">Importar CSV / Planilha</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Colunas: TÍTULO; Autor; Editora; ISBN; Ano; Assunto; Tombo; Classificação
                </p>
              </div>
            </div>
            <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setImportOpen(true)}>
              <Upload className="size-3.5" />
              Importar
            </Button>
          </div>

          {/* Histórico — placeholder */}
          <div className="py-4 border-b border-border/40">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Histórico de importações</p>
              <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded">Em breve</span>
            </div>
            <p className="text-xs text-slate-300 italic">Nenhuma importação registrada nesta sessão.</p>
          </div>

          <ComingSoonItem
            icon={<Database className="size-3.5" />}
            label="Importar MARC21"
            description="Formato padrão ISO 2709 para intercâmbio bibliográfico"
          />
          <ComingSoonItem
            icon={<Globe className="size-3.5" />}
            label="Importar via Z39.50"
            description="Protocolo de busca em catálogos bibliográficos remotos"
          />
          <ComingSoonItem
            icon={<Barcode className="size-3.5" />}
            label="Importar por ISBN"
            description="Consulta automática em bases públicas (Open Library, Google Books)"
          />
        </div>
      </SectionCard>

      {/* ── 3. USUÁRIOS DO SISTEMA ── */}
      <SectionCard
        id="usuarios-sistema"
        icon={<Users className="size-4" />}
        title="Usuários do Sistema"
        description="Perfis, permissões e controle de acesso ao sistema"
        badge="em-breve"
      >
        <div className="space-y-0 -my-1">
          {/* Perfis previstos */}
          <div className="py-4 border-b border-border/40">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Perfis previstos</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Administrador', desc: 'Acesso total'          },
                { label: 'Bibliotecário', desc: 'Catalogação e circulação' },
                { label: 'Auxiliar',      desc: 'Circulação somente'    },
                { label: 'Consulta',      desc: 'Somente leitura'       },
              ].map(({ label, desc }) => (
                <div key={label} className="p-3 rounded-lg bg-slate-50 border border-border/60">
                  <p className="text-xs font-semibold text-slate-700">{label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="py-4 space-y-2 opacity-60">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Gerenciamento de usuários do sistema</p>
              <Button size="sm" variant="outline" disabled className="gap-1.5">
                <Plus className="size-3.5" />
                Novo usuário
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Requer implementação de autenticação e tabela de usuários do sistema (distinta dos leitores).
            </p>
            <code className="block text-[11px] bg-slate-100 text-slate-500 px-2 py-1.5 rounded font-mono">
              GET /api/sistema/usuarios · POST /api/sistema/usuarios · PUT /api/sistema/usuarios/:id
            </code>
          </div>
        </div>
      </SectionCard>

      {/* ── 4. ETIQUETAS ── */}
      <SectionCard
        id="etiquetas"
        icon={<Tag className="size-4" />}
        title="Etiquetas e Impressão"
        description="Modelos de etiquetas para exemplares e códigos de barras"
        badge="em-breve"
      >
        <div className="space-y-0 -my-1">
          <ComingSoonItem
            icon={<Barcode className="size-3.5" />}
            label="Etiqueta com código EX"
            description="Etiqueta padrão com código do exemplar (EX000001)"
          />
          <ComingSoonItem
            icon={<Barcode className="size-3.5" />}
            label="Etiqueta de código de barras"
            description="Impressão de código de barras por exemplar"
          />
          <ComingSoonItem
            icon={<FileText className="size-3.5" />}
            label="Etiqueta de tombo"
            description="Etiqueta patrimonial com número de tombo"
          />
          <div className="py-3 opacity-60">
            <p className="text-xs text-slate-400">
              Futuras funcionalidades: seleção de impressora, configuração de tamanho, impressão em lote,
              modelos personalizados.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── 5. BACKUP ── */}
      <SectionCard
        id="backup"
        icon={<HardDrive className="size-4" />}
        title="Backup e Restauração"
        description="Gerenciamento de backup do banco de dados"
        badge="parcial"
      >
        <div className="space-y-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tipo de banco',  value: 'SQLite (local)'        },
              { label: 'Último backup',  value: '—'                     },
              { label: 'Arquivo',        value: config?.pastaBackup || '—' },
              { label: 'Exportação',     value: config?.pastaExportacao || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-slate-50 rounded-lg border border-border/60">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">{label}</p>
                <p className="text-sm text-slate-700 mt-0.5 font-mono text-xs truncate">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setBackupConfirmOpen(true)}
            >
              <HardDrive className="size-3.5" />
              Gerar backup
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-slate-500"
              onClick={() => setRestoreConfirmOpen(true)}
            >
              <RotateCcw className="size-3.5" />
              Restaurar backup
            </Button>
            <span className="text-xs text-slate-400 ml-auto">Interface preparada — funcionalidade requer implementação</span>
          </div>
        </div>
      </SectionCard>

      {/* ── 6. AUDITORIA ── */}
      <SectionCard
        id="auditoria"
        icon={<ClipboardList className="size-4" />}
        title="Auditoria"
        description="Rastreabilidade de ações e eventos do sistema"
        badge="em-breve"
      >
        <div className="space-y-0 -my-1">
          <ComingSoonItem
            icon={<Clock className="size-3.5" />}
            label="Últimos acessos"
            description="Log de login e sessões de usuários do sistema"
          />
          <ComingSoonItem
            icon={<ClipboardList className="size-3.5" />}
            label="Últimas alterações"
            description="Histórico de edições em obras, exemplares e usuários"
          />
          <ComingSoonItem
            icon={<Upload className="size-3.5" />}
            label="Importações realizadas"
            description="Registro de todas as importações CSV e MARC21"
          />
          <ComingSoonItem
            icon={<AlertTriangle className="size-3.5" />}
            label="Exclusões e baixas"
            description="Trilha de auditoria para operações destrutivas"
          />
          <div className="py-3 opacity-60">
            <code className="text-[11px] bg-slate-100 text-slate-500 px-2 py-1.5 rounded font-mono block">
              GET /api/auditoria?tipo=&periodo=&usuario=
            </code>
          </div>
        </div>
      </SectionCard>

      {/* ── 7. INTEGRAÇÕES ── */}
      <SectionCard
        id="integracoes"
        icon={<Plug className="size-4" />}
        title="Integrações"
        description="Conexões com serviços externos e bases bibliográficas"
        badge="em-breve"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: <BookOpen className="size-4" />, name: 'Biblioteca Nacional', desc: 'Pesquisa e importação de registros' },
            { icon: <SearchIcon className="size-4" />, name: 'Google Books',      desc: 'Dados bibliográficos por ISBN'      },
            { icon: <Globe className="size-4" />,     name: 'Open Library',       desc: 'Base aberta de metadados'           },
            { icon: <Database className="size-4" />,  name: 'Z39.50',             desc: 'Protocolo de catálogos remotos'     },
            { icon: <FileText className="size-4" />,  name: 'MARC21',             desc: 'Importação e exportação ISO 2709'   },
            { icon: <Zap className="size-4" />,       name: 'OCR',                desc: 'Leitura de ficha catalográfica'     },
          ].map(({ icon, name, desc }) => (
            <div
              key={name}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-slate-50/60 opacity-60"
            >
              <div className="size-8 rounded-lg bg-white border border-border/60 flex items-center justify-center shrink-0 text-slate-400">
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700">{name}</p>
                <p className="text-xs text-slate-400 truncate">{desc}</p>
              </div>
              <span className="text-[10px] bg-white border border-border text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                Em breve
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Overlays ── */}
      <ImportDrawer open={importOpen} onClose={() => setImportOpen(false)} />

      <ConfirmDialog
        open={backupConfirmOpen}
        onClose={() => setBackupConfirmOpen(false)}
        onConfirm={() => { setBackupConfirmOpen(false) }}
        title="Gerar backup"
        description="Salvar uma cópia do banco de dados no diretório configurado. Esta funcionalidade requer implementação no servidor."
        intent="confirm"
        confirmLabel="Entendido"
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={() => { setRestoreConfirmOpen(false) }}
        title="Restaurar backup"
        description="A restauração substituirá todos os dados atuais. Esta funcionalidade requer implementação no servidor."
        intent="destructive"
        confirmLabel="Entendido"
        cancelLabel="Cancelar"
      />
    </div>
  )
}
