import { z } from 'zod'

export const LeitorCreateSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  cpf: z.string().optional().nullable(),
  dataNascimento: z.coerce.date().optional().nullable(),
  celular: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  membro: z.boolean().optional().default(true),
})

export const LeitorUpdateSchema = LeitorCreateSchema.partial()

export type LeitorCreate = z.infer<typeof LeitorCreateSchema>
export type LeitorUpdate = z.infer<typeof LeitorUpdateSchema>
