import { NextRequest, NextResponse } from 'next/server'
import { ImportRequestSchema } from '@/src/types/import'
import { importarAcervo } from '@/src/services/acervo-import.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ImportRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const result = await importarAcervo(parsed.data.rows)

    // Tombo conflicts found — return 422 with the error list so the client can merge them
    if (result.erros.length > 0 && result.obrasCriadas === 0) {
      return NextResponse.json(
        { ok: false, erros: result.erros },
        { status: 422 },
      )
    }

    return NextResponse.json({
      ok: true,
      obrasCriadas: result.obrasCriadas,
      exemplaresCriados: result.exemplaresCriados,
      linhasIgnoradas: result.linhasIgnoradas,
      duracaoMs: result.duracaoMs,
      erros: result.erros,
    })
  } catch (err) {
    console.error('[POST /api/acervo/importar]', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: String(err) },
      { status: 500 },
    )
  }
}
