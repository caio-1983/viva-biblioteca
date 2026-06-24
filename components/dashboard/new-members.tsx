'use client'

import { Card } from '@/components/ui/card'
import { UserPlus } from 'lucide-react'

interface NewMember {
  name: string
  date: string
}

const newMembers: NewMember[] = [
  {
    name: 'Lucas Ferreira',
    date: 'Cadastrado em 22/06/2026',
  },
  {
    name: 'Juliana Martins',
    date: 'Cadastrado em 21/06/2026',
  },
  {
    name: 'Carlos Eduardo',
    date: 'Cadastrado em 19/06/2026',
  },
  {
    name: 'Beatriz Lima',
    date: 'Cadastrado em 18/06/2026',
  },
]

export function NewMembers() {
  return (
    <Card className="border border-slate-200 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Novos Membros</h3>
            <p className="mt-1 text-sm text-slate-600">
              {newMembers.length} cadastros recentes
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
            <UserPlus className="h-5 w-5 text-purple-600" />
          </div>
        </div>

        <div className="space-y-3">
          {newMembers.map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                  <span className="text-xs font-semibold text-purple-600">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {member.name}
                  </p>
                  <p className="text-xs text-slate-500">{member.date}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  Ativo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
