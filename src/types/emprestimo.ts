import { z } from 'zod'

// acervoId refere-se à tabela Acervo (será renomeado para exemplarId na Etapa 3)
export const EmprestimoCreateSchema = z.object({
  usuarioId: z.number().int().positive(),
  acervoId: z.number().int().positive(),
  dataEmprestimo: z.coerce.date().optional(),
  dataPrevistaDevolucao: z.coerce.date(),
})

export type EmprestimoCreate = z.infer<typeof EmprestimoCreateSchema>
