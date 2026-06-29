-- CreateEnum
CREATE TYPE "StatusExemplar" AS ENUM ('DISPONIVEL', 'EMPRESTADO', 'RESERVADO', 'MANUTENCAO', 'EXTRAVIADO', 'BAIXADO');

-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('ATIVO', 'DEVOLVIDO', 'ATRASADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Acervo" (
    "id" SERIAL NOT NULL,
    "numeroExemplar" TEXT NOT NULL,
    "tipoPublicacao" TEXT,
    "isbn" TEXT,
    "classificacao" TEXT,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "autor" TEXT,
    "edicao" TEXT,
    "editora" TEXT,
    "dataPublicacao" TIMESTAMP(3),
    "tombo" TEXT,
    "assunto1" TEXT,
    "assunto2" TEXT,
    "assunto3" TEXT,
    "colecao" TEXT,
    "observacao" TEXT,
    "status" "StatusExemplar" NOT NULL DEFAULT 'DISPONIVEL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Acervo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "numeroCadastro" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "celular" TEXT,
    "email" TEXT,
    "membro" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emprestimo" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "exemplarId" INTEGER NOT NULL,
    "dataEmprestimo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevistaDevolucao" TIMESTAMP(3) NOT NULL,
    "dataDevolucao" TIMESTAMP(3),
    "status" "StatusEmprestimo" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Emprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obra" (
    "id" SERIAL NOT NULL,
    "isbn" TEXT,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "tipoPublicacao" TEXT,
    "anoPublicacao" INTEGER,
    "autor" TEXT,
    "editora" TEXT,
    "edicao" TEXT,
    "idioma" TEXT,
    "classificacao" TEXT,
    "assunto1" TEXT,
    "assunto2" TEXT,
    "assunto3" TEXT,
    "colecao" TEXT,
    "sinopse" TEXT,
    "capaUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exemplar" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "codigoExemplar" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "tombo" TEXT,
    "status" "StatusExemplar" NOT NULL DEFAULT 'DISPONIVEL',
    "estadoFisico" TEXT,
    "localizacao" TEXT,
    "origem" TEXT,
    "dataAquisicao" TIMESTAMP(3),
    "valor" DOUBLE PRECISION,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exemplar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sequencia" (
    "nome" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sequencia_pkey" PRIMARY KEY ("nome")
);

-- CreateTable
CREATE TABLE "MigracaoAuditoria" (
    "id" SERIAL NOT NULL,
    "acervoId" INTEGER NOT NULL,
    "exemplarId" INTEGER NOT NULL,
    "obraId" INTEGER NOT NULL,
    "estrategia" TEXT NOT NULL,
    "chaveDeduplicacao" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigracaoAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" SERIAL NOT NULL,
    "prazoEmprestimoDias" INTEGER NOT NULL DEFAULT 14,
    "maxEmprestimos" INTEGER NOT NULL DEFAULT 3,
    "pastaBackup" TEXT,
    "pastaExportacao" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Acervo_numeroExemplar_key" ON "Acervo"("numeroExemplar");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_numeroCadastro_key" ON "Usuario"("numeroCadastro");

-- CreateIndex
CREATE INDEX "Emprestimo_usuarioId_idx" ON "Emprestimo"("usuarioId");

-- CreateIndex
CREATE INDEX "Emprestimo_exemplarId_idx" ON "Emprestimo"("exemplarId");

-- CreateIndex
CREATE INDEX "Emprestimo_dataEmprestimo_idx" ON "Emprestimo"("dataEmprestimo");

-- CreateIndex
CREATE INDEX "Obra_isbn_idx" ON "Obra"("isbn");

-- CreateIndex
CREATE INDEX "Obra_titulo_idx" ON "Obra"("titulo");

-- CreateIndex
CREATE INDEX "Obra_autor_idx" ON "Obra"("autor");

-- CreateIndex
CREATE UNIQUE INDEX "Exemplar_codigoExemplar_key" ON "Exemplar"("codigoExemplar");

-- CreateIndex
CREATE INDEX "Exemplar_obraId_idx" ON "Exemplar"("obraId");

-- CreateIndex
CREATE INDEX "Exemplar_tombo_idx" ON "Exemplar"("tombo");

-- CreateIndex
CREATE INDEX "Exemplar_codigoBarras_idx" ON "Exemplar"("codigoBarras");

-- CreateIndex
CREATE INDEX "Exemplar_status_idx" ON "Exemplar"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MigracaoAuditoria_acervoId_key" ON "MigracaoAuditoria"("acervoId");

-- CreateIndex
CREATE UNIQUE INDEX "MigracaoAuditoria_exemplarId_key" ON "MigracaoAuditoria"("exemplarId");

-- CreateIndex
CREATE INDEX "MigracaoAuditoria_obraId_idx" ON "MigracaoAuditoria"("obraId");

-- CreateIndex
CREATE INDEX "MigracaoAuditoria_exemplarId_idx" ON "MigracaoAuditoria"("exemplarId");

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_exemplarId_fkey" FOREIGN KEY ("exemplarId") REFERENCES "Exemplar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exemplar" ADD CONSTRAINT "Exemplar_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
