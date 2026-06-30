import bcrypt from "bcryptjs"
import { UserRepository } from "@/src/repositories/user.repository"

export interface CreateUserInput {
  nome: string
  login: string
  email: string
  senha: string
  roleId: string
  ativo?: boolean
}

export interface UpdateUserInput {
  nome?: string
  login?: string
  email?: string
  roleId?: string
  ativo?: boolean
}

type UserWithRoles = {
  passwordHash: string
  roles: Array<{ role: { id: string; nome: string } }>
  [key: string]: unknown
}

function sanitize(user: UserWithRoles) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, roles, ...rest } = user
  return {
    ...rest,
    roles: roles.map((ur) => ({ id: ur.role.id, nome: ur.role.nome })),
  }
}

function audit(action: string, login: string, by: string) {
  console.log(
    `[AUDITORIA][${action}] ${login} por ${by} — ${new Date().toISOString()}`
  )
}

export class UserService {
  private repo = new UserRepository()

  async list(search?: string) {
    const users = await this.repo.findAll(search)
    return users.map((u) => sanitize(u as unknown as UserWithRoles))
  }

  async findById(id: string) {
    const user = await this.repo.findById(id)
    if (!user) return null
    return sanitize(user as unknown as UserWithRoles)
  }

  async create(data: CreateUserInput, performedBy: string) {
    if (await this.repo.findByLogin(data.login)) throw new Error("LOGIN_TAKEN")
    if (await this.repo.findByEmail(data.email)) throw new Error("EMAIL_TAKEN")

    const passwordHash = await bcrypt.hash(data.senha, 12)
    const user = await this.repo.create({
      nome: data.nome,
      login: data.login,
      email: data.email,
      passwordHash,
      ativo: data.ativo ?? true,
      roleId: data.roleId,
    })

    audit("USUARIO_CRIADO", user.login, performedBy)
    return sanitize(user as unknown as UserWithRoles)
  }

  async update(id: string, data: UpdateUserInput, performedBy: string) {
    const existing = await this.repo.findById(id)
    if (!existing) throw new Error("NOT_FOUND")

    if (data.login) {
      if (await this.repo.findByLogin(data.login, id)) throw new Error("LOGIN_TAKEN")
    }
    if (data.email) {
      if (await this.repo.findByEmail(data.email, id)) throw new Error("EMAIL_TAKEN")
    }

    const user = await this.repo.update(id, data)
    audit("USUARIO_EDITADO", existing.login, performedBy)
    return sanitize(user as unknown as UserWithRoles)
  }

  async changePassword(id: string, newPassword: string, performedBy: string) {
    const existing = await this.repo.findById(id)
    if (!existing) throw new Error("NOT_FOUND")

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.repo.updatePassword(id, passwordHash)
    audit("SENHA_ALTERADA", existing.login, performedBy)
  }

  async toggleStatus(id: string, ativo: boolean, performedBy: string) {
    const existing = await this.repo.findById(id)
    if (!existing) throw new Error("NOT_FOUND")

    await this.repo.setActive(id, ativo)
    audit(ativo ? "USUARIO_REATIVADO" : "USUARIO_DESATIVADO", existing.login, performedBy)
  }

  async delete(id: string, performedBy: string) {
    const existing = await this.repo.findById(id)
    if (!existing) throw new Error("NOT_FOUND")
    if (existing.ativo) throw new Error("CANNOT_DELETE_ACTIVE")

    await this.repo.delete(id)
    audit("USUARIO_EXCLUIDO", existing.login, performedBy)
  }

  async listRoles() {
    return this.repo.listRoles()
  }
}
