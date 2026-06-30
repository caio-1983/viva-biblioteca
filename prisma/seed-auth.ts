import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const url =
  process.env.DATABASE_URL ??
  "postgresql://biblioteca:biblioteca@localhost:5432/biblioteca"
const prisma = new PrismaClient({ adapter: new PrismaPg(url) })

// Permissões por recurso:acao
const PERMISSIONS = [
  { recurso: "acervo", acao: "read", descricao: "Visualizar acervo" },
  { recurso: "acervo", acao: "write", descricao: "Criar e editar obras/exemplares" },
  { recurso: "acervo", acao: "delete", descricao: "Excluir obras/exemplares" },
  { recurso: "acervo", acao: "admin", descricao: "Administração completa do acervo" },
  { recurso: "emprestimos", acao: "read", descricao: "Visualizar empréstimos" },
  { recurso: "emprestimos", acao: "write", descricao: "Criar empréstimos e devoluções" },
  { recurso: "emprestimos", acao: "delete", descricao: "Cancelar empréstimos" },
  { recurso: "leitores", acao: "read", descricao: "Visualizar leitores" },
  { recurso: "leitores", acao: "write", descricao: "Criar e editar leitores" },
  { recurso: "leitores", acao: "delete", descricao: "Excluir leitores" },
  { recurso: "usuarios_sistema", acao: "read", descricao: "Visualizar usuários do sistema" },
  { recurso: "usuarios_sistema", acao: "write", descricao: "Criar e editar usuários do sistema" },
  { recurso: "usuarios_sistema", acao: "delete", descricao: "Excluir usuários do sistema" },
  { recurso: "usuarios_sistema", acao: "admin", descricao: "Administração completa de usuários" },
  { recurso: "relatorios", acao: "read", descricao: "Visualizar relatórios" },
  { recurso: "configuracoes", acao: "read", descricao: "Visualizar configurações" },
  { recurso: "configuracoes", acao: "write", descricao: "Editar configurações" },
  { recurso: "configuracoes", acao: "admin", descricao: "Administração das configurações" },
]

const ROLES_CONFIG = [
  {
    nome: "ADMIN",
    descricao: "Administrador do sistema — acesso total",
    permissions: PERMISSIONS.map((p) => `${p.recurso}:${p.acao}`),
  },
  {
    nome: "BIBLIOTECARIO",
    descricao: "Bibliotecário — acesso completo exceto gestão de usuários do sistema",
    permissions: [
      "acervo:read", "acervo:write", "acervo:delete",
      "emprestimos:read", "emprestimos:write", "emprestimos:delete",
      "leitores:read", "leitores:write", "leitores:delete",
      "relatorios:read",
      "configuracoes:read",
    ],
  },
  {
    nome: "ATENDENTE",
    descricao: "Atendente — acesso somente a operações de empréstimo e consulta de leitores",
    permissions: [
      "emprestimos:read", "emprestimos:write",
      "leitores:read",
    ],
  },
]

async function seedPermissions() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { recurso_acao: { recurso: perm.recurso, acao: perm.acao } },
      update: { descricao: perm.descricao },
      create: perm,
    })
  }
  console.log(`✅ ${PERMISSIONS.length} permissões criadas`)
}

async function seedRoles() {
  for (const roleConfig of ROLES_CONFIG) {
    const role = await prisma.role.upsert({
      where: { nome: roleConfig.nome },
      update: { descricao: roleConfig.descricao },
      create: { nome: roleConfig.nome, descricao: roleConfig.descricao },
    })

    for (const permKey of roleConfig.permissions) {
      const [recurso, acao] = permKey.split(":")
      const perm = await prisma.permission.findUnique({
        where: { recurso_acao: { recurso, acao } },
      })
      if (!perm) continue

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      })
    }
  }
  console.log(`✅ ${ROLES_CONFIG.length} perfis criados com permissões`)
}

async function seedAdmin() {
  const adminRole = await prisma.role.findUnique({ where: { nome: "ADMIN" } })
  if (!adminRole) throw new Error("Perfil ADMIN não encontrado — execute seedRoles primeiro")

  const passwordHash = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { login: "admin" },
    update: {},
    create: {
      nome: "Administrador",
      login: "admin",
      email: "admin@biblioteca.local",
      passwordHash,
      ativo: true,
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  })

  console.log(`✅ Usuário admin criado — login: admin / senha: admin123`)
}

async function main() {
  console.log("🔐 Iniciando seed de autenticação...\n")
  await seedPermissions()
  await seedRoles()
  await seedAdmin()
  console.log("\n✅ Seed de autenticação concluído")
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
