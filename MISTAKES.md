⚠️ Claude MUST read this file before generating any code in this project.

# Known Mistakes — LMS Web Security Audit Log

This file records real mistakes found during security audits or code review. Every entry is a pattern that has already occurred in this codebase. Read before writing any component, hook, store, or API client code.

---

<!-- Add entries in this format when a mistake is discovered:

## [001] Short descriptive title
**Date:** YYYY-MM
**Category:** (XSS | Auth | Token Handling | Data Exposure | BOLA | Race Condition | etc.)
**What happened:** Describe what went wrong.
**Fix:** Describe what was done to fix it, with code example if useful.
**Rule:** One-sentence rule to prevent recurrence.

---
-->

## [001] Refresh token exposed to client-side JavaScript via useSession()

**Date:** 2026-05
**Category:** Token Handling
**What happened:** The Auth.js `session` callback returned `refreshToken` in the session object. Because `useSession()` in client components receives the full session, the refresh token was accessible to any JavaScript running in the browser — including XSS payloads.
**Fix:** Removed `refreshToken` from the session callback return value. Created `/api/auth/logout` (a Next.js route handler) that reads the refresh token server-side using `getToken()` from `next-auth/jwt` and calls the backend logout endpoint. Client code now calls `POST /api/auth/logout` then `signOut()` — the raw token never reaches the browser.
**Rule:** Never include `refreshToken` in the Auth.js session callback; it must stay in the JWT only and be accessed server-side via `getToken()`.

---

## [002] Middleware allowed sessions with RefreshTokenExpired error through

**Date:** 2026-05
**Category:** Auth
**What happened:** `src/middleware.ts` checked `if (!session)` to gate protected routes, but a session with `session.error === 'RefreshTokenExpired'` is truthy. Users whose refresh tokens had expired were still considered authenticated and could reach protected pages.
**Fix:** Added an explicit check before the role guards:

```typescript
if (session?.error === 'RefreshTokenExpired') {
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('callbackUrl', pathname)
  return NextResponse.redirect(loginUrl)
}
```

Also updated the auth-route guard: `if (session && session.error !== 'RefreshTokenExpired')` before redirecting to `/dashboard`.
**Rule:** Always treat `session.error === 'RefreshTokenExpired'` as unauthenticated in middleware.

---

## [003] Token refresh queue silently dropped on refresh failure

**Date:** 2026-05
**Category:** Race Condition / Token Handling
**What happened:** In `src/lib/api.ts`, when multiple requests fired simultaneously and one triggered a token refresh, subsequent requests were queued. If the refresh failed, the code did `refreshSubscribers = []` — silently discarding the queue. Those queued Promises hung indefinitely, never resolving or rejecting.
**Fix:** Added `onRefreshFailed(err)` which calls `onFail(err)` on every queued subscriber before clearing the array. The queue consumer now passes a `reject` callback:

```typescript
subscribeRefresh(
  (token) => { ...; resolve(api(original)) },
  reject
)
```

**Rule:** On refresh failure, always call `onRefreshFailed(error)` to drain the queue with rejections — never just clear the array.

---

## [004] CSP included unsafe-eval in production

**Date:** 2026-05
**Category:** XSS
**What happened:** `next.config.ts` had `"script-src 'self' 'unsafe-eval' 'unsafe-inline'"` applied unconditionally. `'unsafe-eval'` enables `eval()`, `new Function()`, and similar constructs — the primary XSS execution primitive. This negated most of the value of having a CSP at all.
**Fix:** Made `'unsafe-eval'` development-only (Next.js HMR requires it). Production builds use `"script-src 'self' 'unsafe-inline'"`.

```typescript
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline'"
```

**Rule:** Never include `'unsafe-eval'` in the production CSP; gate it on `process.env.NODE_ENV === 'development'`.

---

## [005] X-Frame-Options: SAMEORIGIN conflicted with CSP frame-ancestors: none

**Date:** 2026-05
**Category:** Clickjacking
**What happened:** `next.config.ts` set `X-Frame-Options: SAMEORIGIN` (allow same-origin framing) while the CSP set `frame-ancestors 'none'` (block all framing). The two headers contradict each other. Older browsers that ignore CSP and only honour `X-Frame-Options` would allow same-origin framing.
**Fix:** Changed `X-Frame-Options` value to `DENY` to match the CSP `frame-ancestors 'none'` intent.
**Rule:** `X-Frame-Options` and `frame-ancestors` must agree; prefer `DENY`/`'none'` for apps that are never legitimately iframed.

---

## [006] Missing Strict-Transport-Security (HSTS) header

**Date:** 2026-05
**Category:** Transport Security
**What happened:** No `Strict-Transport-Security` header was set, meaning browsers would not enforce HTTPS for return visits and could be downgraded to HTTP by a network attacker.
**Fix:** Added HSTS to the security headers array, gated to production only (local dev uses HTTP):

```typescript
...(isDev ? [] : [{
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload',
}])
```

**Rule:** Always add `Strict-Transport-Security` in production; never set it in local dev (breaks HTTP dev server).

---

## [007] HTTP 429 responses retried by React Query

**Date:** 2026-05
**Category:** API Security
**What happened:** The React Query client in `src/lib/query-client.ts` had a no-retry list of `[401, 403, 404]`. A `429 Too Many Requests` response was therefore retried up to 2 times, which makes rate-limiting worse by sending more requests immediately after being throttled.
**Fix:** Added `429` to the no-retry status code list:

```typescript
if (status === 401 || status === 403 || status === 404 || status === 429) return false
```

**Rule:** Never retry 429 responses; add it to the same no-retry guard as 401/403/404.

---

## [008] Socket.io auto-reconnect used stale access token

**Date:** 2026-05
**Category:** Token Handling / WebSocket Security
**What happened:** `src/lib/socket.ts` accepted `accessToken: string` as a parameter and passed `auth: { token: accessToken }` to `io()`. Socket.io auto-reconnection reuses the original connection options — so after the 15-minute token expiry, reconnects were authenticated with an expired token.
**Fix:** Changed `auth` to a callback function. Socket.io calls this function on every connect and reconnect, fetching a fresh token each time:

```typescript
function tokenAuth(callback: (data: { token: string }) => void): void {
  fetch('/api/auth/token')
    .then((r) => r.json())
    .then(({ accessToken }) => callback({ token: accessToken ?? '' }))
    .catch(() => callback({ token: '' }))
}
// usage: auth: tokenAuth
```

**Rule:** Always use the callback form of `auth` in socket.io-client so reconnects get a fresh token; never pass a static token string.

---

## [009] dangerouslySetInnerHTML used without sanitize()

**Date:** 2026-05 (pre-emptive — pattern not yet in codebase but historically common)
**Category:** XSS
**What happened:** Any component that renders user-generated HTML (lesson content, forum posts, announcements) using `dangerouslySetInnerHTML` without first calling `sanitize()` from `@/lib/sanitize` is an XSS vector.
**Fix:** Added `'react/no-danger': 'error'` to ESLint config so any unguarded `dangerouslySetInnerHTML` is a build error. Use the pattern:

```tsx
import { sanitize } from '@/lib/sanitize'
// Must be in a Client Component — sanitize() is a no-op on the server
;<div dangerouslySetInnerHTML={{ __html: sanitize(content) }} />
```

`sanitize()` returns the raw string on the server (SSR). Never call `dangerouslySetInnerHTML` in a Server Component — defer user-generated HTML rendering to a `'use client'` component.
**Rule:** Every `dangerouslySetInnerHTML` must call `sanitize()`, must be in a Client Component, and will be caught by ESLint if not.

---

## [010] Middleware excluded the public landing page from PUBLIC_PATHS

**Date:** 2026-05
**Category:** Auth
**What happened:** When the root `/` was converted from a redirect-only stub to a full landing page for unauthenticated users, the middleware `PUBLIC_PATHS` set was not updated. The middleware saw `/` was not in `PUBLIC_PATHS`, found no session, and redirected unauthenticated visitors to `/login` — making the landing page completely unreachable without logging in first.
**Fix:** Added `'/'` to `PUBLIC_PATHS` in `src/middleware.ts`.

```typescript
// Before — '/' was not in the set
const PUBLIC_PATHS = new Set(['/login', '/register', '/verify-email'])

// After
const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/verify-email'])
```

**Rule:** Any time a new publicly accessible route is added to the app, add its path to `PUBLIC_PATHS` in middleware. The default assumption is that ALL routes require authentication.

---

## [011] Navigation sidebar linked to non-existent routes

**Date:** 2026-05
**Category:** Dead Links / UX
**What happened:** During early planning, several nav items were added to layouts pointing to routes that were never built: `/certificates` (no page), `/forum` (course-specific only — no top-level route), `/instructor/students` (per-course only), `/instructor/grades` (per-course only). Clicking these links produced 404 errors.
**Fix:** Removed the dead nav items from the respective layout files. Students and gradebook pages are accessible via the course editor (`/instructor/courses/[id]/students` and `/instructor/courses/[id]/gradebook`).
**Rule:** Before adding a nav item to a sidebar, verify the target route exists (`Glob` for the page.tsx file). Never add speculative links.

---
