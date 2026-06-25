import { Prisma, StatusExemplar } from '@prisma/client'

// Payload Prisma para Exemplar com Obra incluída
export type ExemplarComObra = Prisma.ExemplarGetPayload<{
  include: { obra: true }
}>

// DTO para listagem (GET /api/books, GET /api/acervo)
export interface ExemplarListItemDTO {
  id: number
  codigoExemplar: string
  titulo: string
  autor: string | null
  classificacao: string | null
  assunto1: string | null
  status: StatusExemplar
  ativo: boolean
}

// DTO para detalhe/edição (GET /api/acervo/:id, PUT /api/acervo/:id)
export interface ExemplarDetailDTO {
  id: number
  codigoExemplar: string
  tombo: string | null
  observacao: string | null
  status: StatusExemplar
  ativo: boolean
  // --- Campos da Obra ---
  obraId: number
  isbn: string | null
  tipoPublicacao: string | null
  classificacao: string | null
  titulo: string
  subtitulo: string | null
  autor: string | null
  edicao: string | null
  editora: string | null
  anoPublicacao: number | null
  assunto1: string | null
  assunto2: string | null
  assunto3: string | null
  colecao: string | null
}

export function toExemplarListItemDTO(e: ExemplarComObra): ExemplarListItemDTO {
  return {
    id: e.id,
    codigoExemplar: e.codigoExemplar,
    titulo: e.obra.titulo,
    autor: e.obra.autor ?? null,
    classificacao: e.obra.classificacao ?? null,
    assunto1: e.obra.assunto1 ?? null,
    status: e.status,
    ativo: e.ativo,
  }
}

export function toExemplarDetailDTO(e: ExemplarComObra): ExemplarDetailDTO {
  return {
    id: e.id,
    codigoExemplar: e.codigoExemplar,
    tombo: e.tombo ?? null,
    observacao: e.observacao ?? null,
    status: e.status,
    ativo: e.ativo,
    obraId: e.obraId,
    isbn: e.obra.isbn ?? null,
    tipoPublicacao: e.obra.tipoPublicacao ?? null,
    classificacao: e.obra.classificacao ?? null,
    titulo: e.obra.titulo,
    subtitulo: e.obra.subtitulo ?? null,
    autor: e.obra.autor ?? null,
    edicao: e.obra.edicao ?? null,
    editora: e.obra.editora ?? null,
    anoPublicacao: e.obra.anoPublicacao ?? null,
    assunto1: e.obra.assunto1 ?? null,
    assunto2: e.obra.assunto2 ?? null,
    assunto3: e.obra.assunto3 ?? null,
    colecao: e.obra.colecao ?? null,
  }
}
