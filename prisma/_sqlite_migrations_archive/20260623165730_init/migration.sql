-- CreateTable
CREATE TABLE "Livro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT,
    "categoria" TEXT,
    "quantidadeTotal" INTEGER NOT NULL DEFAULT 1,
    "quantidadeDisponivel" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "Membro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "dataNascimento" DATETIME,
    "telefone" TEXT,
    "observacoes" TEXT
);

-- CreateTable
CREATE TABLE "Emprestimo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "livroId" INTEGER NOT NULL,
    "membroId" INTEGER NOT NULL,
    "dataEmprestimo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevista" DATETIME NOT NULL,
    "dataDevolucao" DATETIME,
    CONSTRAINT "Emprestimo_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emprestimo_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Livro_codigo_key" ON "Livro"("codigo");
