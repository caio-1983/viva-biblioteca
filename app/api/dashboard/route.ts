import { NextResponse } from 'next/server'
import { dashboardService } from '@/lib/dashboard/dashboard.service'

export async function GET() {
  try {
    const data = await dashboardService.getData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[dashboard] falha ao carregar dados:', error)
    return NextResponse.json({ error: 'Falha ao carregar dados do dashboard' }, { status: 500 })
  }
}
