import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl

      // NextAuth gerencia suas próprias rotas
      if (pathname.startsWith("/api/auth")) return true

      // Página de login: usuários autenticados são redirecionados para o dashboard
      if (pathname.startsWith("/login")) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl))
        return true
      }

      if (!isLoggedIn) {
        // Chamadas de API retornam 401 (não redirecionam para login)
        if (pathname.startsWith("/api/")) {
          return Response.json({ error: "Não autenticado" }, { status: 401 })
        }
        // Páginas redirecionam para /login
        return false
      }

      return true
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id
        token.nome = (user as { nome?: string }).nome ?? (token.nome as string)
        token.login = (user as { login?: string }).login ?? (token.login as string)
        token.roles = (user as { roles?: string[] }).roles ?? (token.roles as string[]) ?? []
      }
      return token
    },

    session({ session, token }) {
      session.user.id = (token.id as string) ?? ""
      session.user.nome = (token.nome as string) ?? ""
      session.user.login = (token.login as string) ?? ""
      session.user.roles = (token.roles as string[]) ?? []
      return session
    },
  },
  providers: [],
}
