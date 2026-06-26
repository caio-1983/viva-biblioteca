-- Etapa 2 Fase 2: Emprestimo.exemplarId NOT NULL, remover acervoId
-- Pré-condição: todos os Emprestimo.exemplarId foram preenchidos pelo Script 03
-- e validados pela asserção A10 do Script 04 (100% preenchidos).
-- SQLite não suporta ALTER COLUMN nem DROP COLUMN com FK — RedefineTables obrigatório.

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Emprestimo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "exemplarId" INTEGER NOT NULL,
    "dataEmprestimo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevistaDevolucao" DATETIME NOT NULL,
    "dataDevolucao" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Emprestimo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emprestimo_exemplarId_fkey" FOREIGN KEY ("exemplarId") REFERENCES "Exemplar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Emprestimo" ("id", "usuarioId", "exemplarId", "dataEmprestimo", "dataPrevistaDevolucao", "dataDevolucao", "status", "createdAt")
    SELECT "id", "usuarioId", "exemplarId", "dataEmprestimo", "dataPrevistaDevolucao", "dataDevolucao", "status", "createdAt" FROM "Emprestimo";
DROP TABLE "Emprestimo";
ALTER TABLE "new_Emprestimo" RENAME TO "Emprestimo";
CREATE INDEX "Emprestimo_usuarioId_idx" ON "Emprestimo"("usuarioId");
CREATE INDEX "Emprestimo_exemplarId_idx" ON "Emprestimo"("exemplarId");
CREATE INDEX "Emprestimo_dataEmprestimo_idx" ON "Emprestimo"("dataEmprestimo");
PRAGMA foreign_keys=ON;
