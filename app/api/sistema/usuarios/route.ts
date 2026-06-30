import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { UserService } from "@/src/services/user.service"

const svc = new UserService()

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.roles?.includes("ADMIN")) return null
  return session.user
}

const CreateSchema = z.object({
  nome:    z.string().min(1, "Obrigatório"),
  login:   z.string().min(1, "Obrigatório"),
  email:   z.string().email("E-mail inválido"),
  senha:   z.string().min(8, "Mínimo 8 caracteres"),
  roleId:  z.string().min(1, "Obrigatório"),
  ativo:   z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const search = request.nextUrl.searchParams.get("search") ?? undefined
  try {
    return NextResponse.json(await svc.list(search))
  } catch (error) {
    console.error("[sistema/usuarios] GET:", error)
    return NextResponse.json({ error: "Erro ao listar usuários" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const operator = await requireAdmin()
  if (!operator) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const created = await svc.create(parsed.data, operator.login ?? "admin")
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "LOGIN_TAKEN") return NextResponse.json({ error: "Login já está em uso", code: "LOGIN_TAKEN" }, { status: 409 })
    if (msg === "EMAIL_TAKEN") return NextResponse.json({ error: "E-mail já está em uso", code: "EMAIL_TAKEN" }, { status: 409 })
    console.error("[sistema/usuarios] POST:", error)
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}
