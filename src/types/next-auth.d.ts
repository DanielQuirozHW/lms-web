import type { DefaultSession, DefaultJWT } from 'next-auth'
import type { User as AppUser, UserRole } from './models'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string
    accessTokenExpiresAt: number
    error?: string
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      roles: UserRole[]
      avatarUrl: string | null
      isVerified: boolean
    } & DefaultSession['user']
  }

  interface User {
    accessToken?: string
    refreshToken?: string
    accessTokenExpiresAt?: number
    appUser?: AppUser
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: number
    appUser: AppUser
    error?: string
  }
}
