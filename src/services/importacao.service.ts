import { exemplarRepository } from '@/src/repositories/exemplar.repository'
import { ExemplarCreate } from '@/src/types/exemplar'

interface CsvRow {
  [key: string]: string
}

interface ImportResult {
  total: number
  imported: number
  skipped: number
  errors: Array<{ row: number; reason: string }>
  columns: {
    found: string[]
    mapped: string[]
    ignored: string[]
  }
}

const COLUMN_MAPPING: Record<string, keyof ExemplarCreate> = {
  TÍTULO: 'titulo',
  'Subtítulo': 'subtitulo',
  Autor: 'autor',
  Edição: 'edicao',
  Ano: 'dataPublicacao',
  Editora: 'editora',
  Tombo: 'tombo',
  Classificação: 'classificacao',
  Assunto: 'assunto1',
  Observação: 'observacao',
  ISBN: 'isbn',
}

function parseYear(yearStr: string): Date | null {
  if (!yearStr) return null
  const year = parseInt(yearStr, 10)
  if (isNaN(year)) return null
  return new Date(`${year}-01-01`)
}

function parseCSV(content: string): CsvRow[] {
  const lines = content.trim().split('\n')
  if (lines.length === 0) throw new Error('CSV vazio')

  const headers = lines[0].split(';').map((h) => h.trim())
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';')
    const row: CsvRow = {}
    headers.forEach((header, index) => {
      if (header) row[header] = (values[index] || '').trim()
    })
    if (row.TÍTULO?.trim()) rows.push(row)
  }

  return rows
}

function mapRowToExemplar(row: CsvRow): ExemplarCreate {
  return {
    titulo: row.TÍTULO || '',
    subtitulo: row['Subtítulo'] || null,
    autor: row.Autor || null,
    edicao: row.Edição || null,
    editora: row.Editora || null,
    tombo: row.Tombo || null,
    classificacao: row.Classificação || null,
    assunto1: row.Assunto || null,
    observacao: row.Observação || null,
    isbn: row.ISBN || null,
    tipoPublicacao: null,
    assunto2: null,
    assunto3: null,
    colecao: null,
    dataPublicacao: row.Ano ? parseYear(row.Ano) : null,
  }
}

export class ImportacaoService {
  async analisar(content: string) {
    const rows = parseCSV(content)
    if (rows.length === 0) throw new Error('Nenhuma linha válida encontrada no CSV')

    const headers = Object.keys(rows[0])
    return {
      totalRows: rows.length,
      columns: {
        found: headers,
        mapped: headers.filter((h) => COLUMN_MAPPING[h]),
        ignored: headers.filter((h) => !COLUMN_MAPPING[h]),
      },
    }
  }

  async importar(content: string): Promise<ImportResult> {
    const rows = parseCSV(content)
    const headers = Object.keys(rows[0] || {})

    const result: ImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      errors: [],
      columns: {
        found: headers,
        mapped: headers.filter((h) => COLUMN_MAPPING[h]),
        ignored: headers.filter((h) => !COLUMN_MAPPING[h]),
      },
    }

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]
        if (!row.TÍTULO?.trim()) { result.skipped++; continue }

        const tombo = row.Tombo?.trim()
        if (tombo) {
          const existing = await exemplarRepository.findByTombo(tombo)
          if (existing) { result.skipped++; continue }
        }

        const data = mapRowToExemplar(row)
        if (!data.titulo?.trim()) {
          result.errors.push({ row: i + 2, reason: 'Título obrigatório vazio' })
          continue
        }

        await exemplarRepository.create(data)
        result.imported++
      } catch (error) {
        result.errors.push({
          row: i + 2,
          reason: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    return result
  }
}

export const importacaoService = new ImportacaoService()
