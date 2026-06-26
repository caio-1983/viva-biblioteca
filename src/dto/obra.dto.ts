import { Prisma } from '@prisma/client'

export type ObraComExemplares = Prisma.ObraGetPayload<{
  include: { exemplares: true }
}>

export interface ObraDetailDTO {
  id: number
  isbn: string | null
  titulo: string
  subtitulo: string | null
  tipoPublicacao: string | null
  anoPublicacao: number | null
  autor: string | null
  editora: string | null
  edicao: string | null
  idioma: string | null
  classificacao: string | null
  assunto1: string | null
  assunto2: string | null
  assunto3: string | null
  colecao: string | null
  sinopse: string | null
  capaUrl: string | null
  ativo: boolean
  createdAt: Date
  updatedAt: Date
  totalExemplares: number
  disponiveis: number
  emprestados: number
}

export function toObraDetailDTO(o: ObraComExemplares): ObraDetailDTO {
  const ativos = o.exemplares.filter(e => e.ativo)
  return {
    id: o.id,
    isbn: o.isbn ?? null,
    titulo: o.titulo,
    subtitulo: o.subtitulo ?? null,
    tipoPublicacao: o.tipoPublicacao ?? null,
    anoPublicacao: o.anoPublicacao ?? null,
    autor: o.autor ?? null,
    editora: o.editora ?? null,
    edicao: o.edicao ?? null,
    idioma: o.idioma ?? null,
    classificacao: o.classificacao ?? null,
    assunto1: o.assunto1 ?? null,
    assunto2: o.assunto2 ?? null,
    assunto3: o.assunto3 ?? null,
    colecao: o.colecao ?? null,
    sinopse: o.sinopse ?? null,
    capaUrl: o.capaUrl ?? null,
    ativo: o.ativo,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    totalExemplares: ativos.length,
    disponiveis: ativos.filter(e => e.status === 'DISPONIVEL').length,
    emprestados: ativos.filter(e => e.status === 'EMPRESTADO').length,
  }
}
