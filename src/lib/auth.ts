import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
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

// ─── OAuth profile helpers ────────────────────────────────────────────────────

/** Splits a full name into firstName/lastName, handling single-name profiles. */
function splitFullName(fullName: string | null | undefined): {
  firstName: string
  lastName: string
} {
  const name = fullName?.trim() ?? ''
  const parts = name.split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : '',
  }
}

/**
 * Extracts normalised user fields from an OAuth provider profile.
 * Google provides `picture`; Microsoft/generic providers use `image`.
 */
function parseOAuthProfile(profile: Record<string, unknown>): {
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
} {
  const email = (profile.email as string | undefined) ?? ''
  // Google sends given_name/family_name; fall back to splitting the full name
  const firstName =
    (profile.given_name as string | undefined) ||
    splitFullName(profile.name as string | undefined).firstName
  const lastName =
    (profile.family_name as string | undefined) ||
    splitFullName(profile.name as string | undefined).lastName
  const avatarUrl =
    (profile.picture as string | null | undefined) ??
    (profile.image as string | null | undefined) ??
    null

  return { email, firstName, lastName, avatarUrl }
}

// ─── NextAuth config ──────────────────────────────────────────────────────────

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    }),
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
    async jwt({ token, user, account, profile }) {
      // ── Initial credentials sign-in ──────────────────────────────────────
      if (account?.provider === 'credentials' && user) {
        return {
          ...token,
          accessToken: user.accessToken as string,
          refreshToken: user.refreshToken as string,
          accessTokenExpiresAt: user.accessTokenExpiresAt as number,
          appUser: user.appUser as AppUser,
        }
      }

      // ── Initial OAuth sign-in (Google / Microsoft) ───────────────────────
      if (account?.provider === 'google' || account?.provider === 'microsoft-entra-id') {
        const rawProfile = (profile ?? {}) as Record<string, unknown>
        const { email, firstName, lastName, avatarUrl } = parseOAuthProfile(rawProfile)

        // Sync with the backend — creates or retrieves the user account and
        // returns our own accessToken/refreshToken pair.
        const res = await fetch(`${API_URL}/auth/oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            avatarUrl,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          }),
        })

        if (!res.ok) {
          // Throwing here causes NextAuth to redirect to pages.error (/login)
          // with ?error=OAuthCallback so the login page can display a message.
          throw new Error('OAuth backend sync failed')
        }

        const { data } = (await res.json()) as {
          data: { accessToken: string; refreshToken: string; user: AppUser }
        }

        return {
          ...token,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_LIFETIME_MS,
          appUser: data.user,
          error: undefined,
        }
      }

      // ── Subsequent calls — check token validity ───────────────────────────
      if (Date.now() < (token.accessTokenExpiresAt as number) - 60_000) {
        return token
      }

      // ── Proactive refresh ─────────────────────────────────────────────────
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
    error: '/login', // OAuth errors redirect here with ?error=...
  },
  session: { strategy: 'jwt' },
})
