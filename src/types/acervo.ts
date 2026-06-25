import { z } from 'zod'

export const AcervoCreateSchema = z.object({
  tipoPublicacao: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  classificacao: z.string().optional().nullable(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  subtitulo: z.string().optional().nullable(),
  autor: z.string().optional().nullable(),
  edicao: z.string().optional().nullable(),
  editora: z.string().optional().nullable(),
  dataPublicacao: z.date().optional().nullable(),
  tombo: z.string().optional().nullable(),
  assunto1: z.string().optional().nullable(),
  assunto2: z.string().optional().nullable(),
  assunto3: z.string().optional().nullable(),
  colecao: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
})

export const AcervoUpdateSchema = AcervoCreateSchema.partial().extend({
  status: z.enum(['DISPONIVEL', 'EMPRESTADO', 'EXTRAVIADO', 'INDISPONIVEL']).optional(),
  dataPublicacao: z.coerce.date().optional().nullable(),
})

export const AcervoSchema = z.object({
  id: z.number(),
  numeroExemplar: z.string(),
  tipoPublicacao: z.string().nullable(),
  isbn: z.string().nullable(),
  classificacao: z.string().nullable(),
  titulo: z.string(),
  subtitulo: z.string().nullable(),
  autor: z.string().nullable(),
  edicao: z.string().nullable(),
  editora: z.string().nullable(),
  dataPublicacao: z.date().nullable(),
  tombo: z.string().nullable(),
  assunto1: z.string().nullable(),
  assunto2: z.string().nullable(),
  assunto3: z.string().nullable(),
  colecao: z.string().nullable(),
  observacao: z.string().nullable(),
  status: z.enum(['DISPONIVEL', 'EMPRESTADO', 'EXTRAVIADO', 'INDISPONIVEL', 'BAIXADO', 'MANUTENCAO']),
  ativo: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type AcervoCreate = z.infer<typeof AcervoCreateSchema>
export type AcervoUpdate = z.infer<typeof AcervoUpdateSchema>
export type Acervo = z.infer<typeof AcervoSchema>

export interface AcervoFilters {
  titulo?: string
  autor?: string
  assunto?: string
  status?: string
  ativo?: boolean
}
