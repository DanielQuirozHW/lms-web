# Frontend Security — LMS Web

Read this before writing any component that renders user-generated content, handles tokens, or manages authentication state.

---

## Token storage — absolute rules

| Storage                           | Use                         | Notes                                            |
| --------------------------------- | --------------------------- | ------------------------------------------------ |
| Auth.js session (HttpOnly cookie) | ✅ YES — tokens live here   | Server-managed; not accessible to JS             |
| Memory (React state / Zustand)    | ⚠️ Only for UI-derived data | Do NOT store raw tokens                          |
| `sessionStorage`                  | ❌ NO                       | Accessible to JS; XSS risk                       |
| `localStorage`                    | ❌ NEVER                    | Accessible to JS; persists across tabs; XSS risk |

**The access token must never appear in any JS variable in Client Components.** It is read on the server by the axios interceptor (via `/api/auth/token`, an internal route) or via `auth()` in Server Components.

**The refresh token must never appear in the session or in any client code.** It lives in the server-side JWT only. Server-side revocation uses `getToken()` from `next-auth/jwt` inside the `/api/auth/logout` route handler. See MISTAKES.md [001].

---

## XSS prevention — dangerouslySetInnerHTML

**NEVER** use `dangerouslySetInnerHTML` without sanitizing through DOMPurify. ESLint (`react/no-danger`) is configured to catch any unguarded usage — it is a build error.

```typescript
// ❌ WRONG — raw HTML from database
<div dangerouslySetInnerHTML={{ __html: lesson.content }} />

// ✅ CORRECT — sanitized first, in a Client Component
import { sanitize } from '@/lib/sanitize'
<div dangerouslySetInnerHTML={{ __html: sanitize(lesson.content) }} />
```

**`sanitize()` is a no-op on the server** (SSR context, no DOM). Only use `dangerouslySetInnerHTML` in `'use client'` components. Never in Server Components.

Use cases that require DOMPurify:

- Lesson `content` field (TEXT lessons — rich text)
- Forum post `content` (markdown/HTML)
- Announcement `body`
- Any field sourced from user input rendered as HTML

See MISTAKES.md [009].

---

## Redirect validation

On the login page, the `callbackUrl` comes from the query string — validate it:

```typescript
// ✅ CORRECT — only allow internal paths
const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
const safeRedirect = callbackUrl.startsWith('/') ? callbackUrl : '/dashboard'

// ❌ WRONG — open redirect vulnerability
redirect(searchParams.get('callbackUrl'))
```

---

## Role-based UI — what it is and is NOT

Role checks on the frontend are **UX only** — they hide buttons and routes for a better experience. They are NOT security. The backend enforces real access control.

```typescript
// ✅ OK — hiding UI
{session.user.roles.includes('INSTRUCTOR') && <CreateCourseButton />}

// ❌ WRONG ASSUMPTION — "the button is hidden so the user can't do it"
// An attacker can call the API directly. Always trust the backend to enforce.
```

---

## Input handling

Never pass raw form values directly to the API. Always validate with Zod first:

```typescript
// ✅ CORRECT
const schema = z.object({ email: z.string().email(), password: z.string().min(8) })
const result = schema.safeParse(formValues)
if (!result.success) {
  /* show errors */ return
}
await api.post('/auth/login', result.data)

// ❌ WRONG
await api.post('/auth/login', formValues) // unvalidated
```

---

## Console logging

Never log sensitive data. The browser devtools are visible to users:

```typescript
// ❌ NEVER
console.log(session) // exposes token structure
console.log(formValues) // may contain passwords
console.log(apiResponse) // may contain sensitive fields

// ✅ OK in development (remove before commit)
console.log('component mounted')
```

---

## Content Security Policy

Defined in `next.config.ts`. **The `'unsafe-eval'` directive is development-only** — it is required by Next.js HMR but enables `eval()`-based XSS in production.

```typescript
// next.config.ts pattern
const isDev = process.env.NODE_ENV === 'development'

const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline'" // no unsafe-eval in prod
```

Minimum production CSP:

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https:;
connect-src 'self' <api-origin> <ws-origin>;
font-src 'self';
frame-ancestors 'none';
```

See MISTAKES.md [004].

---

## Security headers

All headers are set in `next.config.ts`. Key rules:

**`X-Frame-Options` must match `frame-ancestors`** — if CSP says `frame-ancestors 'none'`, set `X-Frame-Options: DENY`. Setting `SAMEORIGIN` contradicts it and older browsers may use the more permissive value. See MISTAKES.md [005].

**HSTS is production-only** — `Strict-Transport-Security` breaks local HTTP dev servers. Gate on `isDev`:

```typescript
...(isDev ? [] : [{
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload',
}])
```

See MISTAKES.md [006].

Full header set in `next.config.ts`:

| Header                      | Value                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| `X-DNS-Prefetch-Control`    | `on`                                                             |
| `X-Frame-Options`           | `DENY`                                                           |
| `X-Content-Type-Options`    | `nosniff`                                                        |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                       |
| `Content-Security-Policy`   | (see above)                                                      |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (production only) |

---

## Session error handling

When Auth.js cannot refresh the token, it sets `session.error = 'RefreshTokenExpired'`. This must be treated as unauthenticated in two places:

1. **Middleware** — check before role guards:
   ```typescript
   if (session?.error === 'RefreshTokenExpired') {
     const loginUrl = new URL('/login', req.url)
     loginUrl.searchParams.set('callbackUrl', pathname)
     return NextResponse.redirect(loginUrl)
   }
   ```
2. **`AuthErrorHandler`** (client-side) — calls `signOut()` when the session error is detected in the React tree

See MISTAKES.md [002].

---

## Refresh token — never in client code

```typescript
// ❌ WRONG — refreshToken is not in the Session type
const token = session?.refreshToken
await api.post('/auth/logout', { refreshToken: token })

// ✅ CORRECT — let the server-side route handler do it
await fetch('/api/auth/logout', { method: 'POST' })
// /api/auth/logout uses getToken() to read refreshToken server-side
```

See MISTAKES.md [001].

---

## React Query retry policy

Never retry 401, 403, 404, or 429:

- **401** — axios interceptor already retried once; if it propagates, retry won't help
- **403** — wrong role; retrying won't change authorization
- **404** — resource doesn't exist; retrying won't create it
- **429** — rate limited; retrying immediately makes rate limiting worse

See MISTAKES.md [007].

---

## WebSocket token — always use auth callback

```typescript
// ❌ WRONG — static token string goes stale after 15 min
io(url, { auth: { token: accessToken } })

// ✅ CORRECT — callback form fetches fresh token on every connect/reconnect
io(url, {
  auth: (callback) => {
    fetch('/api/auth/token')
      .then((r) => r.json())
      .then(({ accessToken }) => callback({ token: accessToken ?? '' }))
      .catch(() => callback({ token: '' }))
  },
})
```

See MISTAKES.md [008].

---

## File upload security

1. Validate file type and size **on the frontend** as a UX check, but rely on the **backend validation** as the security gate.
2. Never construct a CDN URL from user input — use the URL returned by the upload endpoint.
3. Never render uploaded content as trusted HTML.

---

## API error messages

Never display raw `error.message` from caught exceptions directly to users — it may contain stack traces or internal paths:

```typescript
// ✅ CORRECT
toast.error(isApiError(error) ? error.response.data.message : 'Something went wrong')

// ❌ WRONG
toast.error(error.message) // may expose internal info
```

---

## Sensitive data in URLs

Never put tokens, passwords, or IDs in query strings that appear in browser history:

```typescript
// ❌ WRONG
router.push(`/verify?token=${token}&email=${email}`)

// ✅ OK — store in session or use POST body
```
