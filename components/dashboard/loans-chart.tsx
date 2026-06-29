'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DashboardLoanChartPoint } from '@/lib/dashboard/dashboard.types'

interface LoansChartProps {
  data?: DashboardLoanChartPoint[]
  loading?: boolean
}

type Period = 7 | 30 | 90

function formatDateLabel(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

export function LoansChart({ data, loading }: LoansChartProps) {
  const [period, setPeriod] = useState<Period>(7)

  const chartData = useMemo(() => {
    if (!data) return []
    const since = new Date()
    since.setDate(since.getDate() - period)
    since.setHours(0, 0, 0, 0)

    return data
      .filter((point) => new Date(point.data) >= since)
      .map((point) => ({
        date: formatDateLabel(point.data),
        loans: point.total,
      }))
  }, [data, period])

  return (
    <Card className="border border-slate-200 bg-white h-full flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col flex-1 gap-4 p-6">
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-semibold text-slate-900">Empréstimos</h3>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value) as Period)}
            className={[
              'rounded-lg border border-slate-200 bg-white',
              'px-3 py-1.5 text-xs text-slate-600',
              'transition-colors duration-200',
              'hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100',
            ].join(' ')}
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </div>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="h-full min-h-[200px] w-full animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="loans"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  name="Empréstimos"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Card>
  )
}
