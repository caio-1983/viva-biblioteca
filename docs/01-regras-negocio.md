# Regras de Negócio

## Acervo

Cada exemplar possui um identificador único gerado automaticamente.

Formato:

EX000001
EX000002
EX000003

O Número do Exemplar nunca poderá ser alterado.

## Usuários

Cada usuário possui um número de cadastro único.

Formato:

US000001
US000002
US000003

## Empréstimos

Somente exemplares com status DISPONÍVEL podem ser emprestados.

Ao realizar um empréstimo:

* status do exemplar = EMPRESTADO
* data empréstimo = data atual
* data prevista devolução = data atual + prazo configurado

Prazo inicial:

14 dias

## Devolução

Ao devolver:

* status do exemplar = DISPONÍVEL
* registrar data devolução

## Histórico

Nenhum empréstimo poderá ser excluído.

Todos os empréstimos devem permanecer armazenados para consulta futura.

## Exclusão

Registros de usuários e acervo não devem ser apagados fisicamente.

Utilizar campo:

ativo = true | false
