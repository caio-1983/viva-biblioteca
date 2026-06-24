import { NextResponse } from 'next/server'
import { acervoService } from '@/src/services/acervo.service'

export async function GET() {
  try {
    const stats = await acervoService.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter estatísticas'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
