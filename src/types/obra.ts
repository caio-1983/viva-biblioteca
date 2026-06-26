import { z } from 'zod'

export const ObraUpdateSchema = z.object({
  isbn: z.string().optional().nullable(),
  titulo: z.string().min(1).optional(),
  subtitulo: z.string().optional().nullable(),
  tipoPublicacao: z.string().optional().nullable(),
  anoPublicacao: z.coerce.number().int().optional().nullable(),
  autor: z.string().optional().nullable(),
  editora: z.string().optional().nullable(),
  edicao: z.string().optional().nullable(),
  idioma: z.string().optional().nullable(),
  classificacao: z.string().optional().nullable(),
  assunto1: z.string().optional().nullable(),
  assunto2: z.string().optional().nullable(),
  assunto3: z.string().optional().nullable(),
  colecao: z.string().optional().nullable(),
  sinopse: z.string().optional().nullable(),
  capaUrl: z.string().optional().nullable(),
})

export const ExemplarParaObraSchema = z.object({
  tombo: z.string().optional().nullable(),
  codigoBarras: z.string().optional().nullable(),
  localizacao: z.string().optional().nullable(),
  estadoFisico: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
  origem: z.string().optional().nullable(),
  dataAquisicao: z.coerce.date().optional().nullable(),
  valor: z.coerce.number().optional().nullable(),
})

export type ObraUpdate = z.infer<typeof ObraUpdateSchema>
export type ExemplarParaObra = z.infer<typeof ExemplarParaObraSchema>
