import { ImportRawRow, ImportValidRow, ImportError } from '@/src/types/import'

const CURRENT_YEAR = new Date().getFullYear()

function normalizeIsbn(raw: string): string {
  return raw.replace(/[-\s]/g, '')
}

function isValidIsbn10(isbn: string): boolean {
  if (!/^\d{9}[\dX]$/i.test(isbn)) return false
  const digits = isbn
    .toUpperCase()
    .split('')
    .map((c, i) => (i === 9 && c === 'X' ? 10 : parseInt(c, 10)))
  const sum = digits.reduce((acc, d, i) => acc + d * (10 - i), 0)
  return sum % 11 === 0
}

function isValidIsbn13(isbn: string): boolean {
  if (!/^\d{13}$/.test(isbn)) return false
  const digits = isbn.split('').map(Number)
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0)
  return sum % 10 === 0
}

function isValidIsbn(raw: string): boolean {
  const normalized = normalizeIsbn(raw)
  if (normalized.length === 10) return isValidIsbn10(normalized)
  if (normalized.length === 13) return isValidIsbn13(normalized)
  return false
}

export interface ValidationResult {
  valid: ImportValidRow[]
  errors: ImportError[]
}

export function validateRows(rows: ImportRawRow[]): ValidationResult {
  const valid: ImportValidRow[] = []
  const errors: ImportError[] = []
  const seenTombos = new Map<string, number>() // tomboKey → first linha

  for (const row of rows) {
    const rowErrors: ImportError[] = []

    // Required: TÍTULO
    if (!row['TÍTULO']) {
      rowErrors.push({
        linha: row.linha,
        campo: 'TÍTULO',
        descricao: 'Título é obrigatório',
      })
    }

    // Required: Autor
    if (!row['Autor']) {
      rowErrors.push({
        linha: row.linha,
        campo: 'Autor',
        descricao: 'Autor é obrigatório',
      })
    }

    // Validate Ano
    let anoPublicacao: number | null = null
    if (row['Ano']) {
      const ano = parseInt(row['Ano'], 10)
      if (isNaN(ano)) {
        rowErrors.push({
          linha: row.linha,
          campo: 'Ano',
          descricao: 'Ano deve ser numérico',
        })
      } else if (ano < 1000) {
        rowErrors.push({
          linha: row.linha,
          campo: 'Ano',
          descricao: 'Ano deve ser maior ou igual a 1000',
        })
      } else if (ano > CURRENT_YEAR) {
        rowErrors.push({
          linha: row.linha,
          campo: 'Ano',
          descricao: `Ano não pode ser superior a ${CURRENT_YEAR}`,
        })
      } else {
        anoPublicacao = ano
      }
    }

    // Validate ISBN
    if (row['ISBN']) {
      if (!isValidIsbn(row['ISBN'])) {
        rowErrors.push({
          linha: row.linha,
          campo: 'ISBN',
          descricao: 'ISBN em formato inválido (esperado ISBN-10 ou ISBN-13)',
        })
      }
    }

    // Validate Tombo uniqueness within sheet
    if (row['Tombo']) {
      const key = row['Tombo'].toLowerCase()
      if (seenTombos.has(key)) {
        rowErrors.push({
          linha: row.linha,
          campo: 'Tombo',
          descricao: `Tombo "${row['Tombo']}" duplicado na planilha (primeira ocorrência na linha ${seenTombos.get(key)})`,
        })
      } else {
        seenTombos.set(key, row.linha)
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
    } else {
      valid.push({
        linha: row.linha,
        titulo: row['TÍTULO']!,
        subtitulo: row['Subtítulo'],
        autor: row['Autor']!,
        edicao: row['Edição'],
        anoPublicacao,
        editora: row['Editora'],
        isbn: row['ISBN'] ? normalizeIsbn(row['ISBN']) : null,
        classificacao: row['Classificação'],
        cutter: row['Notação do Autor'],
        assunto1: row['Assunto1'],
        assunto2: row['Assunto2'],
        assunto3: row['Assunto3'],
        tombo: row['Tombo'],
        observacao: row['Observação'],
      })
    }
  }

  return { valid, errors }
}
