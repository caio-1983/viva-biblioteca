import { z } from 'zod'

export const ExemplarCreateSchema = z.object({
  tipoPublicacao: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  classificacao: z.string().optional().nullable(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  subtitulo: z.string().optional().nullable(),
  autor: z.string().optional().nullable(),
  edicao: z.string().optional().nullable(),
  editora: z.string().optional().nullable(),
  dataPublicacao: z.coerce.date().optional().nullable(),
  tombo: z.string().optional().nullable(),
  assunto1: z.string().optional().nullable(),
  assunto2: z.string().optional().nullable(),
  assunto3: z.string().optional().nullable(),
  colecao: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
})

// Status officiais (ADR-003). INDISPONIVEL mantido temporariamente por compatibilidade com
// dados existentes — será removido na Etapa 10 junto com a limpeza arquitetural.
const StatusExemplar = z.enum([
  'DISPONIVEL',
  'EMPRESTADO',
  'RESERVADO',
  'MANUTENCAO',
  'EXTRAVIADO',
  'BAIXADO',
  'INDISPONIVEL',
])

export const ExemplarUpdateSchema = ExemplarCreateSchema.partial().extend({
  status: StatusExemplar.optional(),
})

export type ExemplarCreate = z.infer<typeof ExemplarCreateSchema>
export type ExemplarUpdate = z.infer<typeof ExemplarUpdateSchema>
export type ExemplarStatus = z.infer<typeof StatusExemplar>

export interface ExemplarFilters {
  titulo?: string
  autor?: string
  assunto?: string
  status?: string
  ativo?: boolean
}
