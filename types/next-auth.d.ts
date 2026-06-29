import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id: string
    nome: string
    login: string
    email: string
    roles: string[]
  }

  interface Session {
    user: {
      id: string
      nome: string
      login: string
      email: string
      roles: string[]
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    nome: string
    login: string
    roles: string[]
  }
}
