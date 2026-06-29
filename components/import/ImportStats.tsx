import { FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportStatsProps {
  totalLinhas: number
  linhasValidas: number
  totalErros: number
}

export function ImportStats({
  totalLinhas,
  linhasValidas,
  totalErros,
}: ImportStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        icon={<FileText className="h-5 w-5 text-slate-500" />}
        label="Linhas encontradas"
        value={totalLinhas}
        className="bg-slate-50 border-slate-200"
        valueClassName="text-slate-800"
      />
      <StatCard
        icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        label="Registros válidos"
        value={linhasValidas}
        className="bg-green-50 border-green-200"
        valueClassName="text-green-700"
      />
      <StatCard
        icon={<AlertCircle className="h-5 w-5 text-red-500" />}
        label="Erros encontrados"
        value={totalErros}
        className={cn(
          'border',
          totalErros > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200',
        )}
        valueClassName={totalErros > 0 ? 'text-red-700' : 'text-slate-800'}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  className,
  valueClassName,
}: {
  icon: React.ReactNode
  label: string
  value: number
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={cn('rounded-xl border p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <p className={cn('text-3xl font-bold', valueClassName)}>{value}</p>
    </div>
  )
}
