-- CreateTable
CREATE TABLE "Obra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Exemplar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "obraId" INTEGER NOT NULL,
    "codigoExemplar" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "tombo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "estadoFisico" TEXT,
    "localizacao" TEXT,
    "origem" TEXT,
    "dataAquisicao" DATETIME,
    "valor" REAL,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Exemplar_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sequencia" (
    "nome" TEXT NOT NULL PRIMARY KEY,
    "valor" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "MigracaoAuditoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acervoId" INTEGER NOT NULL,
    "exemplarId" INTEGER NOT NULL,
    "obraId" INTEGER NOT NULL,
    "estrategia" TEXT NOT NULL,
    "chaveDeduplicacao" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
