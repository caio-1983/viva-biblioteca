import { prisma } from "@/lib/prisma"

export interface CreateUserData {
  nome: string
  login: string
  email: string
  passwordHash: string
  ativo: boolean
  roleId: string
}

export interface UpdateUserData {
  nome?: string
  login?: string
  email?: string
  ativo?: boolean
  roleId?: string
}

const WITH_ROLES = { roles: { include: { role: true } } } as const

export class UserRepository {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async findByIdentifier(identifier: string) {
    return prisma.user.findFirst({
      where: {
        AND: [
          { ativo: true },
          { OR: [{ login: identifier }, { email: identifier }] },
        ],
      },
      include: WITH_ROLES,
    })
  }

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { ultimoLogin: new Date() },
    })
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async findAll(search?: string) {
    return prisma.user.findMany({
      where: search
        ? {
            OR: [
              { nome: { contains: search, mode: "insensitive" } },
              { login: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: WITH_ROLES,
      orderBy: { createdAt: "desc" },
    })
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: WITH_ROLES })
  }

  async findByLogin(login: string, excludeId?: string) {
    return prisma.user.findFirst({
      where: { login, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    })
  }

  async findByEmail(email: string, excludeId?: string) {
    return prisma.user.findFirst({
      where: { email, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    })
  }

  async create(data: CreateUserData) {
    const { roleId, ...userData } = data
    return prisma.user.create({
      data: { ...userData, roles: { create: { roleId } } },
      include: WITH_ROLES,
    })
  }

  async update(id: string, data: UpdateUserData) {
    const { roleId, ...userData } = data
    return prisma.$transaction(async (tx) => {
      if (roleId) {
        await tx.userRole.deleteMany({ where: { userId: id } })
        await tx.userRole.create({ data: { userId: id, roleId } })
      }
      return tx.user.update({
        where: { id },
        data: userData,
        include: WITH_ROLES,
      })
    })
  }

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } })
  }

  async setActive(id: string, ativo: boolean) {
    return prisma.user.update({ where: { id }, data: { ativo } })
  }

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } })
      return tx.user.delete({ where: { id } })
    })
  }

  // ── Roles ─────────────────────────────────────────────────────────────────

  async listRoles() {
    return prisma.role.findMany({ orderBy: { nome: "asc" } })
  }
}
