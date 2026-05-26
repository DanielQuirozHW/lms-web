import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { User as AppUser } from '@/types/models'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
const ACCESS_TOKEN_LIFETIME_MS = 14 * 60 * 1000 // 14 min (1 min safety margin)

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) return null
  const { data } = (await res.json()) as {
    data: { accessToken: string; refreshToken: string; user: AppUser }
  }
  return data
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })
        if (!res.ok) return null
        const { data } = (await res.json()) as {
          data: { accessToken: string; refreshToken: string; user: AppUser }
        }
        return {
          id: data.user.id,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_LIFETIME_MS,
          appUser: data.user,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          accessToken: user.accessToken as string,
          refreshToken: user.refreshToken as string,
          accessTokenExpiresAt: user.accessTokenExpiresAt as number,
          appUser: user.appUser as AppUser,
        }
      }
      // Return token if still valid (with 1-minute buffer)
      if (Date.now() < (token.accessTokenExpiresAt as number) - 60_000) {
        return token
      }
      // Proactive refresh
      const refreshed = await refreshAccessToken(token.refreshToken as string)
      if (!refreshed) {
        return { ...token, error: 'RefreshTokenExpired' }
      }
      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_LIFETIME_MS,
        appUser: refreshed.user,
        error: undefined,
      }
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        // refreshToken is intentionally excluded — never expose it to client JS.
        // Server-side logout reads it via getToken() in /api/auth/logout.
        accessTokenExpiresAt: token.accessTokenExpiresAt as number,
        user: {
          ...(token.appUser as AppUser),
          // next-auth requires these fields on session.user
          name: `${(token.appUser as AppUser).firstName} ${(token.appUser as AppUser).lastName}`,
          email: (token.appUser as AppUser).email,
          image: (token.appUser as AppUser).avatarUrl,
        },
        error: token.error as string | undefined,
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
})
