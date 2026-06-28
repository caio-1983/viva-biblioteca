/*
  Warnings:

  - You are about to drop the `Livro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Membro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `dataPrevista` on the `Emprestimo` table. All the data in the column will be lost.
  - You are about to drop the column `livroId` on the `Emprestimo` table. All the data in the column will be lost.
  - You are about to drop the column `membroId` on the `Emprestimo` table. All the data in the column will be lost.
  - Added the required column `acervoId` to the `Emprestimo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataPrevistaDevolucao` to the `Emprestimo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioId` to the `Emprestimo` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Livro_codigo_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Livro";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Membro";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Acervo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroExemplar" TEXT NOT NULL,
    "tipoPublicacao" TEXT,
    "isbn" TEXT,
    "classificacao" TEXT,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "autor" TEXT,
    "edicao" TEXT,
    "editora" TEXT,
    "dataPublicacao" DATETIME,
    "tombo" TEXT,
    "assunto1" TEXT,
    "assunto2" TEXT,
    "assunto3" TEXT,
    "colecao" TEXT,
    "observacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroCadastro" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT,
    "dataNascimento" DATETIME,
    "celular" TEXT,
    "email" TEXT,
    "membro" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prazoEmprestimoDias" INTEGER NOT NULL DEFAULT 14,
    "maxEmprestimos" INTEGER NOT NULL DEFAULT 3,
    "pastaBackup" TEXT,
    "pastaExportacao" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Emprestimo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "acervoId" INTEGER NOT NULL,
    "dataEmprestimo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevistaDevolucao" DATETIME NOT NULL,
    "dataDevolucao" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Emprestimo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emprestimo_acervoId_fkey" FOREIGN KEY ("acervoId") REFERENCES "Acervo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Emprestimo" ("dataDevolucao", "dataEmprestimo", "id") SELECT "dataDevolucao", "dataEmprestimo", "id" FROM "Emprestimo";
DROP TABLE "Emprestimo";
ALTER TABLE "new_Emprestimo" RENAME TO "Emprestimo";
CREATE INDEX "Emprestimo_usuarioId_idx" ON "Emprestimo"("usuarioId");
CREATE INDEX "Emprestimo_acervoId_idx" ON "Emprestimo"("acervoId");
CREATE INDEX "Emprestimo_dataEmprestimo_idx" ON "Emprestimo"("dataEmprestimo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Acervo_numeroExemplar_key" ON "Acervo"("numeroExemplar");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_numeroCadastro_key" ON "Usuario"("numeroCadastro");
