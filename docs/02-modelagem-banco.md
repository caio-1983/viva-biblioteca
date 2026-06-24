# Modelagem do Banco

## Acervo

* id
* numeroExemplar
* tipoPublicacao
* isbn
* classificacao
* titulo
* subtitulo
* autor
* edicao
* editora
* dataPublicacao
* tombo
* assunto1
* assunto2
* assunto3
* colecao
* observacao
* status
* ativo
* createdAt
* updatedAt

## Usuario

* id
* numeroCadastro
* nomeCompleto
* cpf
* dataNascimento
* celular
* email
* membro
* ativo
* createdAt
* updatedAt

## Emprestimo

* id
* usuarioId
* acervoId
* dataEmprestimo
* dataPrevistaDevolucao
* dataDevolucao
* status
* createdAt

## Configuracao

* id
* prazoEmprestimoDias
* pastaBackup
* pastaExportacao
