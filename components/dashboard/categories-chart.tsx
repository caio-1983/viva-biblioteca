'use client'

import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const data = [
  { name: 'Teologia', value: 38 },
  { name: 'Clássicos', value: 25 },
  { name: 'Vida Cristã', value: 18 },
  { name: 'Literatura', value: 10 },
  { name: 'Outros', value: 9 },
]

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']

export function CategoriesChart() {
  return (
    <Card className="border border-slate-200 p-6">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-900">
            Categorias Mais Emprestadas
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Distribuição por categoria
          </p>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span className="text-xs text-slate-600">
                  {entry.payload.name} ({entry.payload.value}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
