'use client'

import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { DashboardCategory } from '@/lib/dashboard/dashboard.types'

interface CategoriesChartProps {
  data?: DashboardCategory[]
  loading?: boolean
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#84cc16', '#f43f5e']

export function CategoriesChart({ data, loading }: CategoriesChartProps) {
  const chartData = data ?? []

  return (
    <Card className="border border-slate-200 p-6 bg-white h-full flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col flex-1 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Categorias Mais Emprestadas</h3>
          <p className="text-xs text-slate-500 mt-0.5">Distribuição por assunto</p>
        </div>

        {loading ? (
          <div className="flex-1 min-h-[220px] animate-pulse rounded-lg bg-slate-100" />
        ) : chartData.length === 0 ? (
          <div className="flex flex-1 min-h-[220px] items-center justify-center">
            <p className="text-xs text-slate-400">Sem dados de categorias.</p>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-6">
            <div className="flex-1 min-w-0">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="nome"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(_value: unknown, _name: unknown, entry: any) => [
                      `${entry?.payload?.percentual ?? 0}%`,
                      'Participação',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda personalizada */}
            <div className="w-36 flex-shrink-0 space-y-2.5">
              {chartData.map((item, index) => (
                <div key={item.nome} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-slate-600 truncate">{item.nome}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 flex-shrink-0">
                    {item.percentual}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
