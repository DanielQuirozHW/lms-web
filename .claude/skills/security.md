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

**The access token must never appear in any JS variable in Client Components.** It is read on the server by the axios interceptor (via Auth.js session server-side) or via `auth()` in Server Components.

---

## XSS prevention — dangerouslySetInnerHTML

**NEVER** use `dangerouslySetInnerHTML` without sanitizing through DOMPurify:

```typescript
// ❌ WRONG — raw HTML from database
<div dangerouslySetInnerHTML={{ __html: lesson.content }} />

// ✅ CORRECT — sanitized first
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(lesson.content)
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

Use cases that require DOMPurify:

- Lesson `content` field (TEXT lessons — rich text)
- Forum post `content` (markdown/HTML)
- Announcement `body`
- Any field sourced from user input rendered as HTML

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

The `next.config.ts` must define a CSP header. Minimum:

```
default-src 'self';
script-src 'self' 'nonce-{nonce}';
style-src 'self' 'unsafe-inline';  // Tailwind requires this
img-src 'self' data: https://cdn.example.com;
connect-src 'self' http://localhost:3000 wss://localhost:3000;
font-src 'self';
frame-ancestors 'none';
```

Adjust `connect-src` and `img-src` for production CDN and API domains.

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
