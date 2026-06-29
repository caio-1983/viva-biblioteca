import { prisma } from '@/lib/prisma'
import { ImportValidRow, ImportError, ImportResult } from '@/src/types/import'

export interface ImportServiceResult extends ImportResult {
  erros: ImportError[]
}

export async function importarAcervo(
  rows: ImportValidRow[],
): Promise<ImportServiceResult> {
  const start = Date.now()
  let obrasCriadas = 0
  let exemplaresCriados = 0
  const erros: ImportError[] = []

  // Check tombo uniqueness against DB in a single query
  const tombosNaoPlanilha = rows
    .filter((r) => r.tombo !== null)
    .map((r) => r.tombo!)

  if (tombosNaoPlanilha.length > 0) {
    const existentes = await prisma.exemplar.findMany({
      where: { tombo: { in: tombosNaoPlanilha } },
      select: { tombo: true },
    })
    const tombosExistentes = new Set(
      existentes.map((e) => e.tombo!.toLowerCase()),
    )

    for (const row of rows) {
      if (row.tombo && tombosExistentes.has(row.tombo.toLowerCase())) {
        erros.push({
          linha: row.linha,
          campo: 'Tombo',
          descricao: `Tombo "${row.tombo}" já existe no banco de dados`,
        })
      }
    }
  }

  // If any tombo conflict found, abort the whole import
  if (erros.length > 0) {
    return {
      obrasCriadas: 0,
      exemplaresCriados: 0,
      linhasIgnoradas: rows.length,
      duracaoMs: Date.now() - start,
      erros,
    }
  }

  // Import each row in its own transaction so partial failures don't roll back the whole batch
  for (const row of rows) {
    try {
      await prisma.$transaction(async (tx) => {
        const obra = await tx.obra.create({
          data: {
            titulo: row.titulo,
            subtitulo: row.subtitulo,
            autor: row.autor,
            edicao: row.edicao,
            anoPublicacao: row.anoPublicacao,
            editora: row.editora,
            isbn: row.isbn,
            classificacao: row.classificacao,
            cutter: row.cutter,
            assunto1: row.assunto1,
            assunto2: row.assunto2,
            assunto3: row.assunto3,
          },
        })

        const seq = await tx.sequencia.update({
          where: { nome: 'exemplar' },
          data: { valor: { increment: 1 } },
        })
        const codigoExemplar = `EX${String(seq.valor).padStart(6, '0')}`

        await tx.exemplar.create({
          data: {
            obraId: obra.id,
            codigoExemplar,
            tombo: row.tombo,
            observacao: row.observacao,
            status: 'DISPONIVEL',
            ativo: true,
          },
        })

        obrasCriadas++
        exemplaresCriados++
      })
    } catch (err) {
      erros.push({
        linha: row.linha,
        campo: 'Sistema',
        descricao: `Falha ao gravar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
      })
    }
  }

  const linhasIgnoradas = rows.length - obrasCriadas

  return {
    obrasCriadas,
    exemplaresCriados,
    linhasIgnoradas,
    duracaoMs: Date.now() - start,
    erros,
  }
}
