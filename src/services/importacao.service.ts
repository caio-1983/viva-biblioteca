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

// Mapeamento canônico: cabeçalho CSV → campo ExemplarCreate.
// mapRowToExemplar usa este objeto como única fonte de verdade.
const COLUMN_MAPPING: Record<string, keyof ExemplarCreate> = {
  'TÍTULO': 'titulo',
  'Subtítulo': 'subtitulo',
  'Autor': 'autor',
  'Edição': 'edicao',
  'Ano': 'anoPublicacao',
  'Editora': 'editora',
  'ISBN': 'isbn',
  'Classificação': 'classificacao',
  'Notação do Autor': 'cutter',
  'Assunto1': 'assunto1',
  'Assunto2': 'assunto2',
  'Assunto3': 'assunto3',
  'Tombo': 'tombo',
  'Observação': 'observacao',
}

const REQUIRED_COLUMNS: Array<keyof typeof COLUMN_MAPPING> = ['TÍTULO', 'Autor']

function parseYear(yearStr: string): number | null {
  if (!yearStr) return null
  const year = parseInt(yearStr, 10)
  return isNaN(year) ? null : year
}

// Remove BOM UTF-8 (﻿) que editores Windows inserem no início do arquivo.
function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s
}

function parseCSV(content: string): CsvRow[] {
  const cleaned = stripBom(content).trim()
  const lines = cleaned.split(/\r?\n/)
  if (lines.length === 0) throw new Error('CSV vazio')

  // Lê cabeçalho e normaliza cada célula
  const headers = lines[0].split(';').map((h) => h.trim())

  // Valida colunas obrigatórias
  const missingRequired = REQUIRED_COLUMNS.filter((col) => !headers.includes(col))
  if (missingRequired.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes no CSV: ${missingRequired.join(', ')}. ` +
      `Colunas encontradas: ${headers.join(', ')}`,
    )
  }

  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(';')
    const row: CsvRow = {}

    // Lê por nome de cabeçalho, não por posição: row[nomeDaColuna] = valor
    headers.forEach((header, index) => {
      if (header) row[header] = (values[index] ?? '').trim()
    })

    // Filtra linhas sem título
    if (row['TÍTULO']?.trim()) rows.push(row)
  }

  return rows
}

// Constrói ExemplarCreate exclusivamente a partir dos nomes de coluna via COLUMN_MAPPING.
// Nenhum acesso por índice ou Object.values.
function mapRowToExemplar(row: CsvRow): ExemplarCreate {
  const get = (col: string): string | null => {
    const val = row[col]
    return val && val.trim() ? val.trim() : null
  }

  return {
    titulo: get('TÍTULO') ?? '',
    subtitulo: get('Subtítulo'),
    autor: get('Autor'),
    edicao: get('Edição'),
    anoPublicacao: row['Ano'] ? parseYear(row['Ano']) : null,
    editora: get('Editora'),
    isbn: get('ISBN'),
    classificacao: get('Classificação'),
    cutter: get('Notação do Autor'),
    assunto1: get('Assunto1'),
    assunto2: get('Assunto2'),
    assunto3: get('Assunto3'),
    tombo: get('Tombo'),
    observacao: get('Observação'),
    tipoPublicacao: null,
    colecao: null,
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
        if (!row['TÍTULO']?.trim()) { result.skipped++; continue }

        const tombo = row['Tombo']?.trim()
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
