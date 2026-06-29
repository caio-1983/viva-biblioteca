import * as XLSX from 'xlsx'
import { EXPECTED_COLUMNS, ImportRawRow } from '@/src/types/import'

export interface ParseResult {
  ok: true
  rows: ImportRawRow[]
}

export interface ParseError {
  ok: false
  missingColumns?: string[]
  error?: string
}

export function parseExcelFile(buffer: ArrayBuffer): ParseResult | ParseError {
  try {
    const data = new Uint8Array(buffer)
    const workbook = XLSX.read(data, { type: 'array' })

    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return { ok: false, error: 'Planilha sem abas' }
    }

    const sheet = workbook.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
    })

    if (rawRows.length === 0) {
      return { ok: false, error: 'Planilha sem dados' }
    }

    // Validate column headers from first row keys
    const foundColumns = Object.keys(rawRows[0])
    const missingColumns = EXPECTED_COLUMNS.filter(
      (col) => !foundColumns.includes(col),
    )

    if (missingColumns.length > 0) {
      return { ok: false, missingColumns }
    }

    const coerce = (val: unknown): string | null => {
      if (val === null || val === undefined || val === '') return null
      return String(val).trim() || null
    }

    const rows: ImportRawRow[] = rawRows.map((raw, i) => ({
      linha: i + 2, // +2: 1-based + header row
      TÍTULO: coerce(raw['TÍTULO']),
      Subtítulo: coerce(raw['Subtítulo']),
      Autor: coerce(raw['Autor']),
      Edição: coerce(raw['Edição']),
      Ano: coerce(raw['Ano']),
      Editora: coerce(raw['Editora']),
      ISBN: coerce(raw['ISBN']),
      Classificação: coerce(raw['Classificação']),
      'Notação do Autor': coerce(raw['Notação do Autor']),
      Assunto1: coerce(raw['Assunto1']),
      Assunto2: coerce(raw['Assunto2']),
      Assunto3: coerce(raw['Assunto3']),
      Tombo: coerce(raw['Tombo']),
      Observação: coerce(raw['Observação']),
    }))

    // Filter out completely blank rows
    const nonEmpty = rows.filter((r) =>
      Object.entries(r)
        .filter(([k]) => k !== 'linha')
        .some(([, v]) => v !== null),
    )

    return { ok: true, rows: nonEmpty }
  } catch (err) {
    return {
      ok: false,
      error: `Erro ao ler arquivo: ${err instanceof Error ? err.message : 'Desconhecido'}`,
    }
  }
}
