'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  UserRound,
  User,
  Phone,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface NewMemberFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormFields {
  nomeCompleto: string
  dataNascimento: string
  membro: boolean
  celular: string
  email: string
  cpf: string
  observacoes: string
}

const EMPTY_FORM: FormFields = {
  nomeCompleto: '',
  dataNascimento: '',
  membro: true,
  celular: '',
  email: '',
  cpf: '',
  observacoes: '',
}

export function NewMemberForm({ onSuccess, onCancel }: NewMemberFormProps) {
  const [formData, setFormData] = useState<FormFields>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFormData(EMPTY_FORM)
    setError(null)
    onCancel?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.nomeCompleto.trim()) {
      setError('Nome Completo é obrigatório.')
      return
    }
    if (!formData.dataNascimento) {
      setError('Data de Nascimento é obrigatória.')
      return
    }
    if (!formData.celular.trim()) {
      setError('Celular é obrigatório.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCompleto: formData.nomeCompleto,
          cpf: formData.cpf,
          dataNascimento: formData.dataNascimento,
          celular: formData.celular,
          email: formData.email,
          membro: formData.membro,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao cadastrar usuário')
      }

      setSuccess(true)
      setFormData(EMPTY_FORM)

      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">

        {/* Feedback — error */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Feedback — success */}
        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Usuário cadastrado com sucesso!</p>
          </div>
        )}

        {/* Page section header — título + botões na mesma linha */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <UserRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">
              Cadastro de Novo Usuário
            </h2>
            <p className="text-sm text-muted-foreground">
              Cadastre leitores para empréstimos e devoluções
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleReset}
            >
              {onCancel ? 'Cancelar' : 'Limpar'}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </Button>
          </div>
        </div>

        {/* Cards grid — 1 col / 2 col (md) / 3 col (xl) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

          {/* ── Card 1: Dados Pessoais ───────────────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Dados Pessoais
                  </CardTitle>
                  <CardDescription>Informações básicas do leitor</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Nome Completo */}
              <div className="space-y-1.5">
                <label
                  htmlFor="nomeCompleto"
                  className="text-sm font-medium text-foreground"
                >
                  Nome Completo{' '}
                  <span className="text-red-500" aria-label="obrigatório">
                    *
                  </span>
                </label>
                <Input
                  id="nomeCompleto"
                  name="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={handleChange}
                  placeholder="João da Silva"
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-1.5">
                <label
                  htmlFor="dataNascimento"
                  className="text-sm font-medium text-foreground"
                >
                  Data de Nascimento{' '}
                  <span className="text-red-500" aria-label="obrigatório">*</span>
                </label>
                <Input
                  id="dataNascimento"
                  name="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Tipo de Cadastro */}
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">
                  Tipo de Cadastro
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {([{ label: 'Membro', value: true }, { label: 'Não Membro', value: false }] as const).map(({ label, value }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={loading}
                      onClick={() => setFormData((p) => ({ ...p, membro: value }))}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap',
                        formData.membro === value
                          ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'border-border bg-background text-muted-foreground hover:border-blue-300 hover:text-foreground'
                      )}
                      aria-pressed={formData.membro === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Card 2: Contato ──────────────────────────────── */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Contato
                  </CardTitle>
                  <CardDescription>Informações para comunicação</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Celular */}
              <div className="space-y-1.5">
                <label
                  htmlFor="celular"
                  className="text-sm font-medium text-foreground"
                >
                  Celular{' '}
                  <span className="text-red-500" aria-label="obrigatório">*</span>
                </label>
                <Input
                  id="celular"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  placeholder="(11) 99999-1234"
                  required
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="leitor@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Card 3: Informações Adicionais ──────────────── */}
          <Card className="md:col-span-2 xl:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                  <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Informações Adicionais
                  </CardTitle>
                  <CardDescription>Dados complementares</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* CPF */}
              <div className="space-y-1.5">
                <label
                  htmlFor="cpf"
                  className="text-sm font-medium text-foreground"
                >
                  CPF{' '}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  disabled={loading}
                />
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <label
                  htmlFor="observacoes"
                  className="text-sm font-medium text-foreground"
                >
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Informações adicionais sobre o leitor..."
                  disabled={loading}
                  rows={4}
                  className="flex min-h-30 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </form>
  )
}
