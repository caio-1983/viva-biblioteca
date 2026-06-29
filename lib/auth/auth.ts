import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { authConfig } from "./auth.config"
import { AuthService } from "@/src/services/auth.service"

const credentialsSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : null
      const login = (token as { login?: string } | null)?.login ?? "desconhecido"
      console.log(`[AUDITORIA][LOGOUT] Usuário: ${login} — ${new Date().toISOString()}`)
    },
  },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Usuário ou e-mail" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const authService = new AuthService()
        return authService.login(parsed.data.identifier, parsed.data.password)
      },
    }),
  ],
})
