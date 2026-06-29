import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { UserService } from "@/src/services/user.service"

const svc = new UserService()

const Schema = z.object({ ativo: z.boolean() })

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
    return NextResponse.json({ error: "Parâmetro 'ativo' obrigatório (boolean)" }, { status: 400 })
  }

  try {
    await svc.toggleStatus(id, parsed.data.ativo, session.user.login ?? "admin")
    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    console.error("[sistema/usuarios/:id/status] PATCH:", error)
    return NextResponse.json({ error: "Erro ao alterar status" }, { status: 500 })
  }
}
