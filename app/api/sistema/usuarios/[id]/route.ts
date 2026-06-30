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

const UpdateSchema = z.object({
  nome:   z.string().min(1).optional(),
  login:  z.string().min(1).optional(),
  email:  z.string().email("E-mail inválido").optional(),
  roleId: z.string().min(1).optional(),
  ativo:  z.boolean().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const operator = await requireAdmin()
  if (!operator) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const user = await svc.findById(id)
  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const operator = await requireAdmin()
  if (!operator) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const updated = await svc.update(id, parsed.data, operator.login ?? "admin")
    return NextResponse.json(updated)
  } catch (error) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    if (msg === "LOGIN_TAKEN") return NextResponse.json({ error: "Login já está em uso", code: "LOGIN_TAKEN" }, { status: 409 })
    if (msg === "EMAIL_TAKEN") return NextResponse.json({ error: "E-mail já está em uso", code: "EMAIL_TAKEN" }, { status: 409 })
    console.error("[sistema/usuarios/:id] PUT:", error)
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const operator = await requireAdmin()
  if (!operator) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  try {
    await svc.delete(id, operator.login ?? "admin")
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    if (msg === "CANNOT_DELETE_ACTIVE") {
      return NextResponse.json(
        { error: "Não é possível excluir um usuário ativo. Desative-o primeiro." },
        { status: 422 }
      )
    }
    console.error("[sistema/usuarios/:id] DELETE:", error)
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 })
  }
}
