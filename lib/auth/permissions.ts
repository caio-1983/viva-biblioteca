import { auth } from "./auth"

export const ROLES = {
  ADMIN: "ADMIN",
  BIBLIOTECARIO: "BIBLIOTECARIO",
  ATENDENTE: "ATENDENTE",
} as const

export type RoleName = keyof typeof ROLES

export async function hasRole(...roles: RoleName[]): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.roles) return false
  return roles.some((r) => session.user.roles.includes(r))
}

export async function hasPermission(recurso: string, acao: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.roles) return false

  const roles = session.user.roles

  if (roles.includes("ADMIN")) return true

  if (roles.includes("BIBLIOTECARIO")) {
    // Bibliotecário acessa o sistema completo, exceto administração pura
    return acao !== "admin"
  }

  if (roles.includes("ATENDENTE")) {
    // Atendente acessa apenas operações de empréstimo e consulta de leitores
    const recursosPermitidos = ["emprestimos", "leitores"]
    const acoesPermitidas = ["read", "write"]
    return recursosPermitidos.includes(recurso) && acoesPermitidas.includes(acao)
  }

  return false
}
