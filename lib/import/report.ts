import { ImportError } from '@/src/types/import'

function escapeCsvCell(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function generateErrorCsv(errors: ImportError[]): string {
  const header = 'Linha,Campo,Descrição do Erro\n'
  const rows = errors
    .map(
      (e) =>
        `${escapeCsvCell(e.linha)},${escapeCsvCell(e.campo)},${escapeCsvCell(e.descricao)}`,
    )
    .join('\n')
  return header + rows
}

export function downloadErrorCsv(
  errors: ImportError[],
  filename = 'erros-importacao.csv',
): void {
  // BOM for Excel to open UTF-8 CSV correctly
  const csv = '﻿' + generateErrorCsv(errors)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
