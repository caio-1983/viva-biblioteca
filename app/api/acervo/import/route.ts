import { NextRequest, NextResponse } from 'next/server'
import { importacaoService } from '@/src/services/importacao.service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Arquivo deve ser CSV' }, { status: 400 })
    }

    const content = await file.text()
    const result = await importacaoService.importar(content)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao importar CSV'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const csv = searchParams.get('csv')

    if (!csv) {
      return NextResponse.json({ error: 'Parâmetro csv é obrigatório' }, { status: 400 })
    }

    const analysis = await importacaoService.analisar(decodeURIComponent(csv))
    return NextResponse.json(analysis)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao analisar CSV'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
