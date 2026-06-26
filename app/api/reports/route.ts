import { NextResponse } from 'next/server'
import { relatorioService } from '@/src/services/relatorio.service'

export async function GET() {
  try {
    const data = await relatorioService.getDashboard()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error)
    return NextResponse.json({ error: 'Erro ao buscar relatórios' }, { status: 500 })
  }
}
