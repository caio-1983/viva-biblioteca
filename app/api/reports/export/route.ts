import { NextRequest, NextResponse } from 'next/server'
import { relatorioService } from '@/src/services/relatorio.service'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const tipo = request.nextUrl.searchParams.get('tipo') || 'emprestimos'
  const formato = request.nextUrl.searchParams.get('formato') || 'xlsx'

  try {
    let data: Record<string, unknown>[] = []
    let filename = ''

    if (tipo === 'acervo') {
      data = await relatorioService.exportarAcervo() as Record<string, unknown>[]
      filename = 'acervo'
    } else if (tipo === 'usuarios') {
      data = await relatorioService.exportarLeitores() as Record<string, unknown>[]
      filename = 'usuarios'
    } else {
      data = await relatorioService.exportarEmprestimos() as Record<string, unknown>[]
      filename = 'emprestimos'
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, filename)

    if (formato === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar:', error)
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 })
  }
}
