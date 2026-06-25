import { NextResponse } from 'next/server'
import { exemplarService } from '@/src/services/exemplar.service'

export async function GET() {
  try {
    const nextId = await exemplarService.getProximaSequencia()
    return NextResponse.json({ nextId })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar próximo ID' }, { status: 500 })
  }
}
