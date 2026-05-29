import type { DefaultSession, DefaultJWT } from 'next-auth'
import type { User as AppUser, UserRole } from './models'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string
    accessTokenExpiresAt: number
    error?: string
    /** Present when an admin is impersonating another user. Contains the admin's user ID. */
    impersonatedBy?: string
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
    // Impersonation markers
    impersonatedBy?: string
    impersonationTokenId?: string
    // Admin backup tokens — stored in JWT only, never exposed to client JS
    adminAccessToken?: string
    adminRefreshToken?: string
    adminAccessTokenExpiresAt?: number
    adminUser?: AppUser
  }
}
