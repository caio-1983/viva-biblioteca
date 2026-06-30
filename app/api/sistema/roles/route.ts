import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { UserService } from "@/src/services/user.service"

const svc = new UserService()

export async function GET() {
  const session = await auth()
  if (!session?.user?.roles?.includes("ADMIN")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }
  try {
    const roles = await svc.listRoles()
    return NextResponse.json(roles)
  } catch (error) {
    console.error("[sistema/roles] GET:", error)
    return NextResponse.json({ error: "Erro ao listar perfis" }, { status: 500 })
  }
}
