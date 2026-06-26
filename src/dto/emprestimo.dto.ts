import { Prisma, StatusEmprestimo } from '@prisma/client'

// Payload Prisma com todas as relações necessárias
export type EmprestimoComRelacoes = Prisma.EmprestimoGetPayload<{
  include: {
    usuario: true
    exemplar: { include: { obra: true } }
  }
}>

// DTO para listagem geral (GET /api/loans)
export interface EmprestimoListItemDTO {
  id: number
  dataEmprestimo: Date
  dataPrevistaDevolucao: Date
  dataDevolucao: Date | null
  status: StatusEmprestimo
  nomeCompleto: string
  numeroCadastro: string
  titulo: string
  codigoExemplar: string
}

// DTO para histórico por leitor (GET /api/usuarios/:id/emprestimos)
export interface EmprestimoUsuarioDTO {
  id: number
  exemplarId: number
  dataEmprestimo: Date
  dataPrevistaDevolucao: Date
  dataDevolucao: Date | null
  status: StatusEmprestimo
  titulo: string
  autor: string | null
  codigoExemplar: string
}

// DTO para busca ativa por exemplar (GET /api/returns?exemplar=...)
export interface EmprestimoAtivoDTO {
  emprestimoId: number
  exemplarId: number
  codigoExemplar: string
  titulo: string
  usuarioId: number
  nomeCompleto: string
  numeroCadastro: string
  dataEmprestimo: Date
  dataPrevistaDevolucao: Date
  statusEmprestimo: StatusEmprestimo
}

export function toEmprestimoListItemDTO(e: EmprestimoComRelacoes): EmprestimoListItemDTO {
  return {
    id: e.id,
    dataEmprestimo: e.dataEmprestimo,
    dataPrevistaDevolucao: e.dataPrevistaDevolucao,
    dataDevolucao: e.dataDevolucao,
    status: e.status,
    nomeCompleto: e.usuario.nomeCompleto,
    numeroCadastro: e.usuario.numeroCadastro,
    titulo: e.exemplar.obra.titulo,
    codigoExemplar: e.exemplar.codigoExemplar,
  }
}

export function toEmprestimoUsuarioDTO(e: EmprestimoComRelacoes): EmprestimoUsuarioDTO {
  return {
    id: e.id,
    exemplarId: e.exemplarId,
    dataEmprestimo: e.dataEmprestimo,
    dataPrevistaDevolucao: e.dataPrevistaDevolucao,
    dataDevolucao: e.dataDevolucao,
    status: e.status,
    titulo: e.exemplar.obra.titulo,
    autor: e.exemplar.obra.autor ?? null,
    codigoExemplar: e.exemplar.codigoExemplar,
  }
}

export function toEmprestimoAtivoDTO(e: EmprestimoComRelacoes): EmprestimoAtivoDTO {
  return {
    emprestimoId: e.id,
    exemplarId: e.exemplarId,
    codigoExemplar: e.exemplar.codigoExemplar,
    titulo: e.exemplar.obra.titulo,
    usuarioId: e.usuarioId,
    nomeCompleto: e.usuario.nomeCompleto,
    numeroCadastro: e.usuario.numeroCadastro,
    dataEmprestimo: e.dataEmprestimo,
    dataPrevistaDevolucao: e.dataPrevistaDevolucao,
    statusEmprestimo: e.status,
  }
}
