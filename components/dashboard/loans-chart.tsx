'use client'

import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const data = [
  { date: '17/06', loans: 12 },
  { date: '18/06', loans: 18 },
  { date: '19/06', loans: 15 },
  { date: '20/06', loans: 20 },
  { date: '21/06', loans: 14 },
  { date: '22/06', loans: 16 },
  { date: '23/06', loans: 10 },
]

export function LoansChart() {
  return (
    <Card className="border border-slate-200 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Empréstimos nos Últimos 7 Dias
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Evolução diária dos empréstimos
            </p>
          </div>
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-slate-300">
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
            <option>Últimos 90 dias</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="loans"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Empréstimos"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
