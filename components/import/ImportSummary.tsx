import Link from 'next/link'
import { CheckCircle2, BookOpen, Library, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImportResult } from '@/src/types/import'

interface ImportSummaryProps {
  result: ImportResult
  onNewImport: () => void
}

export function ImportSummary({ result, onNewImport }: ImportSummaryProps) {
  const seconds = (result.duracaoMs / 1000).toFixed(1)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-5 bg-green-50 rounded-xl border border-green-200">
        <div className="rounded-full bg-green-100 p-2 flex-shrink-0">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="font-bold text-green-800 text-lg">Importação concluída!</p>
          <p className="text-sm text-green-600 mt-0.5">
            O acervo foi atualizado com sucesso.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SummaryCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Obras criadas"
          value={result.obrasCriadas}
          colorClass="bg-blue-50 border-blue-200 text-blue-800"
        />
        <SummaryCard
          icon={<Library className="h-4 w-4" />}
          label="Exemplares criados"
          value={result.exemplaresCriados}
          colorClass="bg-blue-50 border-blue-200 text-blue-800"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Linhas ignoradas"
          value={result.linhasIgnoradas}
          colorClass={
            result.linhasIgnoradas > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          label="Tempo de execução"
          value={`${seconds}s`}
          colorClass="bg-slate-50 border-slate-200 text-slate-700"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onNewImport}
          className="flex-1"
        >
          Nova importação
        </Button>
        <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/acervo/consulta">Ver catálogo</Link>
        </Button>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  colorClass: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <div className="flex items-center gap-2 mb-3 opacity-75">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
