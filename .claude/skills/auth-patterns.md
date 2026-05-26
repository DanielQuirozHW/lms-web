# Auth Patterns — LMS Web

Read this before writing any authentication, session, protected route, or role-check code.

---

## How Auth.js integrates with the backend

Auth.js uses a **custom Credentials provider** that calls the backend:

1. User submits login form → `POST /api/v1/auth/login`
2. Backend returns `{ accessToken, refreshToken, user }`
3. Auth.js stores these in a server-side JWT (HttpOnly cookie)
4. Every API request reads the `accessToken` from `/api/auth/token` (an internal route) and attaches it as `Bearer`
5. When the access token expires (15 min), the axios interceptor calls `POST /api/auth/refresh` and the Auth.js JWT callback refreshes proactively

**Critical**: the raw `accessToken` and `refreshToken` are never accessible to JavaScript running in the browser.

- `accessToken` is available in the session (readable via `useSession()`) — necessary for the axios interceptor to function, but must never be logged or stored
- `refreshToken` is **NOT** in the session — it lives only in the server-side JWT, readable server-side via `getToken()` from `next-auth/jwt`

---

## Session type — `types/next-auth.d.ts`

```typescript
declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string
    accessTokenExpiresAt: number
    error?: string // 'RefreshTokenExpired' when refresh token is expired
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
}
```

Note: `refreshToken` is intentionally absent from the `Session` interface. See MISTAKES.md [001].

---

## Auth.js config skeleton — `lib/auth.ts`

Key points in the real implementation:

- `authorize()` calls the backend and returns `{ accessToken, refreshToken, accessTokenExpiresAt, appUser }`
- `jwt` callback: on initial sign-in, stores all fields; proactively refreshes 1 min before expiry (`Date.now() < accessTokenExpiresAt - 60_000`); on refresh failure sets `error: 'RefreshTokenExpired'`
- `session` callback: maps JWT fields to the session — **does NOT include `refreshToken`**

```typescript
// session callback — refreshToken is intentionally excluded
async session({ session, token }) {
  return {
    ...session,
    accessToken: token.accessToken as string,
    // refreshToken omitted — never expose to client JS
    accessTokenExpiresAt: token.accessTokenExpiresAt as number,
    user: { ...(token.appUser as AppUser), ... },
    error: token.error as string | undefined,
  }
}
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
if (!isAdmin) throw new Error('Access denied') // backend enforces, not the UI
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

## Sign in

```typescript
// From a form Server Action or mutation
import { signIn } from 'next-auth/react'
const result = await signIn('credentials', { email, password, redirect: false })
if (result?.error) throw new Error('Invalid email or password')
```

---

## Sign out — always revoke the refresh token first

The refresh token must be revoked on the backend before clearing the local session. Because `refreshToken` is NOT in the session object, revocation is done server-side via the `/api/auth/logout` route handler.

```typescript
// Client Component logout (Header.tsx, useLogoutMutation)
async function handleLogout() {
  try {
    // /api/auth/logout reads refreshToken server-side via getToken() and revokes it
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // Backend revocation failed — proceed to clear local session anyway
  }
  await signOut({ callbackUrl: '/login' })
}
```

**`/api/auth/logout` route handler** (`src/app/api/auth/logout/route.ts`):

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  // getToken() reads the server-side JWT — refreshToken is available here
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  if (token?.refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    })
  }
  return NextResponse.json({ ok: true })
}
```

Do NOT pass `session.refreshToken` from client code — it is not in the session. See MISTAKES.md [001].

---

## Token refresh error handling — AuthErrorHandler

When the Auth.js JWT callback cannot refresh the token, it sets `token.error = 'RefreshTokenExpired'` which propagates to `session.error`. The `AuthErrorHandler` component detects this and forces sign out:

```typescript
// components/shared/auth/AuthErrorHandler.tsx
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

`AuthErrorHandler` is mounted in `app/providers.tsx` inside `SessionProvider`, wrapping the entire app. Do not duplicate it in individual layouts.

The **middleware** also handles this — it redirects users with `session.error === 'RefreshTokenExpired'` to `/login` before any page renders. See MISTAKES.md [002].

---

## Middleware — `src/middleware.ts`

Handles four cases in order:

1. Public paths (`/login`, `/register`, `/verify-email`): redirect signed-in users to `/dashboard`, **except when** `session.error === 'RefreshTokenExpired'`
2. `session.error === 'RefreshTokenExpired'`: redirect to `/login` even though `session` is truthy
3. No session on a protected path: redirect to `/login?callbackUrl=<pathname>`
4. Role checks for `/instructor/*` and `/admin/*` paths

---

## Email verification gate

After registration, the user has `isVerified: false`. Some actions (enrollment) require verification:

```tsx
function EnrollButton({ courseId }: { courseId: string }) {
  const { data: session } = useSession()
  if (!session?.user.isVerified) return <VerifyEmailPrompt />
  return <EnrollCourseButton courseId={courseId} />
}
```

---

## Security rules

- Never read `accessToken` from the session in a Client Component for storage or logging
- `refreshToken` is not in `Session` — never try to access `session.refreshToken` in client code
- Validate `callbackUrl` before using it as a redirect target (must start with `/`)
- The `AUTH_SECRET` must be at least 32 chars; rotate it to invalidate all sessions
