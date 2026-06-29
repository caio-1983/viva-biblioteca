import { z } from 'zod'

export const EXPECTED_COLUMNS = [
  'TÍTULO',
  'Subtítulo',
  'Autor',
  'Edição',
  'Ano',
  'Editora',
  'ISBN',
  'Classificação',
  'Notação do Autor',
  'Assunto1',
  'Assunto2',
  'Assunto3',
  'Tombo',
  'Observação',
] as const

export type ExpectedColumn = (typeof EXPECTED_COLUMNS)[number]

export interface ImportRawRow {
  linha: number
  TÍTULO: string | null
  Subtítulo: string | null
  Autor: string | null
  Edição: string | null
  Ano: string | null
  Editora: string | null
  ISBN: string | null
  Classificação: string | null
  'Notação do Autor': string | null
  Assunto1: string | null
  Assunto2: string | null
  Assunto3: string | null
  Tombo: string | null
  Observação: string | null
}

export interface ImportValidRow {
  linha: number
  titulo: string
  subtitulo: string | null
  autor: string
  edicao: string | null
  anoPublicacao: number | null
  editora: string | null
  isbn: string | null
  classificacao: string | null
  cutter: string | null
  assunto1: string | null
  assunto2: string | null
  assunto3: string | null
  tombo: string | null
  observacao: string | null
}

export interface ImportError {
  linha: number
  campo: string
  descricao: string
}

export interface ImportPreview {
  totalLinhas: number
  linhasValidas: number
  totalErros: number
  erros: ImportError[]
  validRows: ImportValidRow[]
}

export interface ImportResult {
  obrasCriadas: number
  exemplaresCriados: number
  linhasIgnoradas: number
  duracaoMs: number
}

// Zod schema for the import API body
export const ImportRequestSchema = z.object({
  rows: z.array(
    z.object({
      linha: z.number(),
      titulo: z.string().min(1),
      subtitulo: z.string().nullable(),
      autor: z.string().min(1),
      edicao: z.string().nullable(),
      anoPublicacao: z.number().nullable(),
      editora: z.string().nullable(),
      isbn: z.string().nullable(),
      classificacao: z.string().nullable(),
      cutter: z.string().nullable(),
      assunto1: z.string().nullable(),
      assunto2: z.string().nullable(),
      assunto3: z.string().nullable(),
      tombo: z.string().nullable(),
      observacao: z.string().nullable(),
    }),
  ),
})

export type ImportRequest = z.infer<typeof ImportRequestSchema>
