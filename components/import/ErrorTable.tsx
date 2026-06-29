'use client'

import { useState } from 'react'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImportError } from '@/src/types/import'
import { downloadErrorCsv } from '@/lib/import/report'

interface ErrorTableProps {
  errors: ImportError[]
}

const MAX_VISIBLE = 10

export function ErrorTable({ errors }: ErrorTableProps) {
  const [expanded, setExpanded] = useState(false)

  if (errors.length === 0) return null

  const visible = expanded ? errors : errors.slice(0, MAX_VISIBLE)
  const hasMore = errors.length > MAX_VISIBLE

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {errors.length} erro{errors.length !== 1 ? 's' : ''} encontrado
          {errors.length !== 1 ? 's' : ''}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadErrorCsv(errors)}
          className="gap-2 text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      <div className="rounded-xl border border-red-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-red-50 border-b border-red-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase tracking-wider w-16">
                Linha
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase tracking-wider w-36">
                Campo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase tracking-wider">
                Descrição do Erro
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-50 bg-white">
            {visible.map((error, i) => (
              <tr key={i} className="hover:bg-red-50/50 transition-colors">
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                  {error.linha}
                </td>
                <td className="px-4 py-3 text-slate-700 font-medium">
                  {error.campo}
                </td>
                <td className="px-4 py-3 text-slate-600">{error.descricao}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasMore && (
          <div className="border-t border-red-100 bg-red-50/50 px-4 py-3">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1.5 text-xs text-red-700 hover:text-red-900 font-medium transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Mostrar mais {errors.length - MAX_VISIBLE} erro
                  {errors.length - MAX_VISIBLE !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
