-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Emprestimo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "acervoId" INTEGER NOT NULL,
    "exemplarId" INTEGER,
    "dataEmprestimo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevistaDevolucao" DATETIME NOT NULL,
    "dataDevolucao" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Emprestimo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emprestimo_acervoId_fkey" FOREIGN KEY ("acervoId") REFERENCES "Acervo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emprestimo_exemplarId_fkey" FOREIGN KEY ("exemplarId") REFERENCES "Exemplar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Emprestimo" ("acervoId", "createdAt", "dataDevolucao", "dataEmprestimo", "dataPrevistaDevolucao", "id", "status", "usuarioId") SELECT "acervoId", "createdAt", "dataDevolucao", "dataEmprestimo", "dataPrevistaDevolucao", "id", "status", "usuarioId" FROM "Emprestimo";
DROP TABLE "Emprestimo";
ALTER TABLE "new_Emprestimo" RENAME TO "Emprestimo";
CREATE INDEX "Emprestimo_usuarioId_idx" ON "Emprestimo"("usuarioId");
CREATE INDEX "Emprestimo_acervoId_idx" ON "Emprestimo"("acervoId");
CREATE INDEX "Emprestimo_exemplarId_idx" ON "Emprestimo"("exemplarId");
CREATE INDEX "Emprestimo_dataEmprestimo_idx" ON "Emprestimo"("dataEmprestimo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
