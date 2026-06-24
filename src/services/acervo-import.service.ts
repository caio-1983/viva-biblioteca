import { acervoRepository } from '@/src/repositories/acervo.repository'
import { AcervoCreate } from '@/src/types/acervo'

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

export class AcervoImportService {
  private readonly columnMapping: Record<string, keyof AcervoCreate> = {
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

  async parseCSV(content: string): Promise<CsvRow[]> {
    const lines = content.trim().split('\n')
    if (lines.length === 0) {
      throw new Error('CSV vazio')
    }

    const headers = lines[0].split(';').map((h) => h.trim())
    const rows: CsvRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';')
      const row: CsvRow = {}

      headers.forEach((header, index) => {
        if (header) {
          row[header] = (values[index] || '').trim()
        }
      })

      if (row.TÍTULO?.trim()) {
        rows.push(row)
      }
    }

    return rows
  }

  async analyzeCSV(content: string) {
    const rows = await this.parseCSV(content)
    if (rows.length === 0) {
      throw new Error('Nenhuma linha válida encontrada no CSV')
    }

    const headers = Object.keys(rows[0])
    const found = headers
    const mapped = headers.filter((h) => this.columnMapping[h])
    const ignored = headers.filter((h) => !this.columnMapping[h])

    return {
      totalRows: rows.length,
      columns: { found, mapped, ignored },
    }
  }

  private mapRowToAcervo(row: CsvRow): AcervoCreate {
    const acervo: AcervoCreate = {
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
      dataPublicacao: row.Ano ? this.parseYear(row.Ano) : null,
    }

    return acervo
  }

  private parseYear(yearStr: string): Date | null {
    if (!yearStr) return null
    const year = parseInt(yearStr, 10)
    if (isNaN(year)) return null
    return new Date(`${year}-01-01`)
  }

  async importCSV(content: string): Promise<ImportResult> {
    const rows = await this.parseCSV(content)
    const headers = Object.keys(rows[0] || {})

    const found = headers
    const mapped = headers.filter((h) => this.columnMapping[h])
    const ignored = headers.filter((h) => !this.columnMapping[h])

    const result: ImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      errors: [],
      columns: { found, mapped, ignored },
    }

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]

        if (!row.TÍTULO?.trim()) {
          result.skipped++
          continue
        }

        const tombo = row.Tombo?.trim()
        if (tombo) {
          const existing = await acervoRepository.findByTombo(tombo)
          if (existing) {
            result.skipped++
            continue
          }
        }

        const acervoData = this.mapRowToAcervo(row)

        if (!acervoData.titulo?.trim()) {
          result.errors.push({
            row: i + 2,
            reason: 'Título obrigatório vazio',
          })
          continue
        }

        await acervoRepository.create(acervoData)
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

export const acervoImportService = new AcervoImportService()
