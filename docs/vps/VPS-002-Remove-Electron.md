# VPS-002 — Remoção do Electron

**Data:** 28/06/2026
**Branch:** feat/vps-002-remove-electron
**Autor:** abacontroladoria-dev
**Status:** Concluído

---

## Objetivo

Transformar o VIVA Biblioteca em uma aplicação Next.js pura, removendo toda dependência do Electron.

---

## Motivação

O Electron foi incluído no projeto como dependência de produção porém nunca foi integrado ao código-fonte. Nenhum arquivo do projeto importava módulos Electron. A presença das dependências causava:

- instalação desnecessária de ~206 pacotes (binários nativos, builders, assinadores);
- aumento do tempo de `npm install`;
- ambiguidade arquitetural (o projeto já operava como Next.js puro).

---

## O que foi removido

### `package.json`

| Pacote            | Versão removida | Motivo                                        |
|-------------------|-----------------|-----------------------------------------------|
| `electron`        | ^42.4.1         | Nunca utilizado no código-fonte                |
| `electron-builder`| ^26.15.3        | Ferramenta de build desktop sem uso            |

Nenhum arquivo `.ts`, `.tsx` ou `.js` do projeto importava esses pacotes.

---

## O que não foi alterado

- Regras de negócio
- APIs (`app/api/**`)
- Telas e componentes (`app/**`, `components/**`)
- Domínio (`src/**`)
- Scripts de migração (`scripts/**`)
- Banco de dados e Prisma
- `npm run dev`, `npm run build`, `npm run start`

---

## Documentação atualizada

- [ADR-006](../architecture/ADR-006-arquitetura-desktop.md) — atualizado para refletir Next.js como stack única, removendo referências ao Electron. Mantém histórico da decisão original.

---

## Verificação

Após a remoção, todos os comandos principais funcionam normalmente:

```bash
npm install   # 206 pacotes a menos
npm run build # build Next.js sem erros
npm run start # servidor Next.js na porta 3000
```

---

## Impacto em outros ADRs

O ADR-006 registrava Electron como plataforma principal. Essa decisão foi supersedida.
Os demais ADRs (001–005, 007–011) não referenciam Electron e permanecem válidos.

---

## Referências

- [ADR-006 — Arquitetura da Aplicação](../architecture/ADR-006-arquitetura-desktop.md)
- Branch: `feat/vps-002-remove-electron`
