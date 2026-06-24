'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  BookMarked,
  Clock,
  Users,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface DiaData {
  data: string
  total: number
}

interface Atrasado {
  titulo: string
  numeroExemplar: string
  nomeCompleto: string
  numeroCadastro: string
  dataPrevistaDevolucao: string
  diasAtraso: number
}

interface MaisEmprestado {
  titulo: string
  autor: string | null
  numeroExemplar: string
  totalEmprestimos: number
}

interface ReportStats {
  acervo: { total: number; disponivel: number; emprestado: number }
  usuarios: { total: number }
  emprestimos: {
    ativos: number
    emAtraso: number
    total: number
    porDia: DiaData[]
    atrasados: Atrasado[]
    maisEmprestados: MaisEmprestado[]
  }
  assuntos: { nome: string; total: number }[]
}

const CHART_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
]

function formatDayLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

const EXPORT_ITEMS = [
  { tipo: 'acervo', label: 'Acervo' },
  { tipo: 'usuarios', label: 'Usuários' },
  { tipo: 'emprestimos', label: 'Empréstimos' },
]

export function ReportsView() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<7 | 30 | 90>(30)
  const [exportLoading, setExportLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const chartData = useMemo(() => {
    if (!stats) return []
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - period)
    return stats.emprestimos.porDia
      .filter(d => new Date(d.data) >= cutoff)
      .map(d => ({ data: formatDayLabel(d.data), total: d.total }))
  }, [stats, period])

  async function handleExport(tipo: string, formato: string) {
    const key = `${tipo}-${formato}`
    setExportLoading(key)
    try {
      const res = await fetch(`/api/reports/export?tipo=${tipo}&formato=${formato}`)
      if (!res.ok) throw new Error('Erro ao exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tipo}.${formato}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setExportLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        Erro ao carregar relatórios.
      </div>
    )
  }

  const kpis = [
    {
      title: 'Total do Acervo',
      value: stats.acervo.total,
      sub: `${stats.acervo.disponivel} disponíveis`,
      icon: BookOpen,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      grad: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Emprestados',
      value: stats.emprestimos.ativos,
      sub: 'em circulação',
      icon: BookMarked,
      bg: 'bg-green-50',
      text: 'text-green-700',
      grad: 'from-green-500 to-green-600',
    },
    {
      title: 'Em Atraso',
      value: stats.emprestimos.emAtraso,
      sub: 'devoluções pendentes',
      icon: Clock,
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      grad: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Membros Ativos',
      value: stats.usuarios.total,
      sub: `${stats.emprestimos.total} empréstimos no total`,
      icon: Users,
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      grad: 'from-purple-500 to-purple-600',
    },
  ]

  return (
    <div className="space-y-10 pb-12">

      {/* KPI Cards */}
      <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <Card
              key={i}
              className={cn(
                'overflow-hidden border border-slate-200 hover:shadow-md transition-shadow',
                kpi.bg,
              )}
            >
              <div className="p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {kpi.title}
                    </p>
                    <p className={cn('mt-3 text-4xl font-bold', kpi.text)}>
                      {kpi.value.toLocaleString('pt-BR')}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{kpi.sub}</p>
                  </div>
                  <div className={cn('p-3 rounded-lg bg-linear-to-br', kpi.grad)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </section>

      {/* Chart + Overdue */}
      <section className="grid gap-8 grid-cols-1 md:grid-cols-3">
        <Card className="md:col-span-2 border border-slate-200 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Empréstimos por Período</h3>
                <p className="mt-1 text-sm text-slate-600">Evolução diária</p>
              </div>
              <select
                value={period}
                onChange={e => setPeriod(Number(e.target.value) as 7 | 30 | 90)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-slate-300 focus:outline-none"
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={90}>Últimos 90 dias</option>
              </select>
            </div>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-slate-400 text-sm">
                Nenhum empréstimo neste período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="data" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                    formatter={(value: number) => [value, 'Empréstimos']}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Empréstimos"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="md:col-span-1 border border-slate-200 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Em Atraso</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {stats.emprestimos.atrasados.length} pendentes
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {stats.emprestimos.atrasados.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  Nenhum atraso. 🎉
                </p>
              ) : (
                stats.emprestimos.atrasados.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate text-sm">{item.titulo}</p>
                      <p className="text-xs text-slate-500 truncate">{item.nomeCompleto}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-semibold text-red-600 text-sm">
                        {item.diasAtraso} {item.diasAtraso === 1 ? 'dia' : 'dias'}
                      </p>
                      <p className="text-xs text-slate-400">atraso</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* Top Books + Subjects */}
      <section className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        <Card className="border border-slate-200 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900">Livros Mais Emprestados</h3>
            </div>
            {stats.emprestimos.maisEmprestados.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">
                Nenhum empréstimo registrado ainda.
              </p>
            ) : (
              <div className="space-y-1">
                {stats.emprestimos.maisEmprestados.map((book, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate text-sm">{book.titulo}</p>
                      {book.autor && (
                        <p className="text-xs text-slate-500 truncate">{book.autor}</p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      {book.totalEmprestimos}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="border border-slate-200 p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900">Acervo por Assunto</h3>
              <p className="mt-1 text-sm text-slate-600">Distribuição dos exemplares</p>
            </div>
            {stats.assuntos.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-slate-400 text-sm">
                Nenhum assunto cadastrado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.assuntos}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="nome"
                  >
                    {stats.assuntos.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                    formatter={(value: number, name: string) => [`${value} exemplares`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </section>

      {/* Exports */}
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900">Exportar Dados</h2>
          <p className="text-sm text-slate-600 mt-1">
            Gere arquivos para sincronização e backup externo
          </p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {EXPORT_ITEMS.map(({ tipo, label }) => {
            const xlsxKey = `${tipo}-xlsx`
            const csvKey = `${tipo}-csv`
            return (
              <Card key={tipo} className="border border-slate-200 p-6">
                <div className="space-y-4">
                  <p className="font-semibold text-slate-900">{label}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleExport(tipo, 'xlsx')}
                      disabled={exportLoading === xlsxKey}
                    >
                      {exportLoading === xlsxKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      )}
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleExport(tipo, 'csv')}
                      disabled={exportLoading === csvKey}
                    >
                      {exportLoading === csvKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-500" />
                      )}
                      CSV
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
