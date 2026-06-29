import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { UserService } from "@/src/services/user.service"

const svc = new UserService()

const Schema = z.object({
  senha: z.string().min(8, "Mínimo 8 caracteres"),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    await svc.changePassword(id, parsed.data.senha, session.user.login ?? "admin")
    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    console.error("[sistema/usuarios/:id/senha] PATCH:", error)
    return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 })
  }
}
