# Auth Patterns — LMS Web

Read this before writing any authentication, session, protected route, or role-check code.

---

## How Auth.js integrates with the backend

Auth.js uses a **custom Credentials provider** that calls the backend:

1. User submits login form → `POST /api/v1/auth/login`
2. Backend returns `{ accessToken, refreshToken, user }`
3. Auth.js stores these in a server-side JWT session (HttpOnly cookie)
4. Every API request reads the `accessToken` from the session and attaches it as `Bearer`
5. When the access token expires (15 min), the axios interceptor calls `POST /api/v1/auth/refresh` and updates the session

**Critical**: the raw `accessToken` and `refreshToken` are never exposed to JavaScript running in the browser. They live in the Auth.js session cookie only.

---

## Session type

```typescript
// types/models.ts — extend next-auth types
declare module 'next-auth' {
  interface Session {
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: number // Unix timestamp ms
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      roles: UserRole[]
      avatarUrl: string | null
      isVerified: boolean
    }
  }
  interface JWT {
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: number
    user: Session['user']
    error?: 'RefreshTokenExpired'
  }
}
```

---

## Auth.js config skeleton — `lib/auth.ts`

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })
        if (!res.ok) return null
        const { data } = await res.json()
        return {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpiresAt: Date.now() + 14 * 60 * 1000, // 14 min safety margin
          ...data.user,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in — user is from authorize()
        token.accessToken = user.accessToken as string
        token.refreshToken = user.refreshToken as string
        token.accessTokenExpiresAt = user.accessTokenExpiresAt as number
        token.user = { id: user.id, ... } as Session['user']
      }
      // Proactive refresh — 1 minute before expiry
      if (Date.now() < token.accessTokenExpiresAt - 60_000) return token
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (token.error === 'RefreshTokenExpired') {
        // Force sign out on next request
        session.error = 'RefreshTokenExpired'
      }
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.user = token.user
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
})
```

---

## Accessing the session

### In Server Components / Route Handlers / Middleware

```typescript
import { auth } from '@/lib/auth'

const session = await auth()
if (!session) redirect('/login')
```

### In Client Components

```typescript
'use client'
import { useSession } from 'next-auth/react'

const { data: session, status } = useSession()
if (status === 'loading') return <Spinner />
if (status === 'unauthenticated') return <Redirect to="/login" />
```

---

## Role checking

```typescript
// ✅ Correct — check roles array
const isInstructor = session.user.roles.includes('INSTRUCTOR')
const isAdmin = session.user.roles.includes('ADMIN')
const isInstructorOrAdmin = isInstructor || isAdmin

// ❌ Wrong — role check as security gate (it's UI-only)
if (!isAdmin) throw new Error('Access denied') // Never — UI only
```

---

## Protected layout pattern

```tsx
// app/(instructor)/layout.tsx — Server Component
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function InstructorLayout({ children }) {
  const session = await auth()
  if (!session) redirect('/login')
  const hasAccess = session.user.roles.some((r) => r === 'INSTRUCTOR' || r === 'ADMIN')
  if (!hasAccess) redirect('/dashboard')
  return <>{children}</>
}
```

---

## Sign in / Sign out

```typescript
// Programmatic sign in (from form action)
import { signIn } from '@/lib/auth'
await signIn('credentials', { email, password, redirectTo: '/dashboard' })

// Client-side sign out
import { signOut } from 'next-auth/react'
await signOut({ callbackUrl: '/login' })
// The backend logout (revoke refreshToken) must be called BEFORE signOut:
await api.post('/auth/logout', { refreshToken: session.refreshToken })
await signOut({ callbackUrl: '/login' })
```

---

## Email verification gate

After registration, the user has `isVerified: false`. Some actions (enrollment) require verification:

```tsx
function EnrollButton({ courseId }: { courseId: string }) {
  const { data: session } = useSession()

  if (!session?.user.isVerified) {
    return <VerifyEmailPrompt />
  }
  return <EnrollCourseButton courseId={courseId} />
}
```

---

## Token refresh error handling

If `refreshAccessToken()` fails (token expired or revoked), set `token.error = 'RefreshTokenExpired'`. The session callback propagates this. In the root layout or a client provider, check:

```typescript
'use client'
import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'

export function AuthErrorHandler() {
  const { data: session } = useSession()
  useEffect(() => {
    if (session?.error === 'RefreshTokenExpired') {
      signOut({ callbackUrl: '/login' })
    }
  }, [session?.error])
  return null
}
```

---

## Security rules

- Never read `accessToken` from the session in a Client Component for storage or logging
- Never pass the refresh token to any frontend code — it is server-side only
- Validate `callbackUrl` before using it as a redirect target (must start with `/`)
- The `AUTH_SECRET` must be at least 32 chars; rotate it to invalidate all sessions
