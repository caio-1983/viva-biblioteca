import bcrypt from "bcryptjs"
import { UserRepository } from "@/src/repositories/user.repository"

export class AuthService {
  private repo = new UserRepository()

  async login(identifier: string, password: string) {
    const user = await this.repo.findByIdentifier(identifier)

    if (!user) {
      console.log(`[AUDITORIA][FALHA] Identificador não encontrado: ${identifier}`)
      return null
    }

    if (!user.ativo) {
      console.log(`[AUDITORIA][FALHA] Usuário inativo: ${user.login}`)
      return null
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      console.log(`[AUDITORIA][FALHA] Senha incorreta para: ${user.login}`)
      return null
    }

    await this.repo.updateLastLogin(user.id)
    console.log(`[AUDITORIA][LOGIN] Usuário: ${user.login} (${user.email}) — ${new Date().toISOString()}`)

    return {
      id: user.id,
      nome: user.nome,
      login: user.login,
      email: user.email,
      roles: user.roles.map((ur) => ur.role.nome),
    }
  }
}
