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
  anoPublicacao: z.coerce.number().int().optional().nullable(),
  tombo: z.string().optional().nullable(),
  assunto1: z.string().optional().nullable(),
  assunto2: z.string().optional().nullable(),
  assunto3: z.string().optional().nullable(),
  colecao: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
})

// Status oficiais conforme ADR-008. Espelha o enum StatusExemplar do Prisma.
const StatusExemplarSchema = z.enum([
  'DISPONIVEL',
  'EMPRESTADO',
  'RESERVADO',
  'MANUTENCAO',
  'EXTRAVIADO',
  'BAIXADO',
])

export const ExemplarUpdateSchema = ExemplarCreateSchema.partial().extend({
  status: StatusExemplarSchema.optional(),
  ativo: z.boolean().optional(),
  codigoBarras: z.string().optional().nullable(),
  localizacao: z.string().optional().nullable(),
  estadoFisico: z.string().optional().nullable(),
})

export type ExemplarCreate = z.infer<typeof ExemplarCreateSchema>
export type ExemplarUpdate = z.infer<typeof ExemplarUpdateSchema>
export type ExemplarStatus = z.infer<typeof StatusExemplarSchema>

export interface ExemplarFilters {
  titulo?: string
  autor?: string
  assunto?: string
  status?: string
  ativo?: boolean
}
