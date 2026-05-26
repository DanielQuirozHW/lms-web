# Next.js Patterns — LMS Web

Read this before creating any page, layout, or data-fetching component.

---

## Server Component vs Client Component decision tree

```
Does the component need:
  - useState / useEffect / useReducer?  → 'use client'
  - Event handlers (onClick, onChange)?  → 'use client'
  - Browser APIs (localStorage, window)?  → 'use client'
  - React Query / Zustand?               → 'use client'
  - Auth.js session (via useSession)?    → 'use client' (or use auth() in Server Component)

Otherwise: Server Component (default — no directive needed)
```

**Rule**: Push 'use client' as far down the tree as possible. Wrap only the interactive leaf, not the whole page.

---

## File naming conventions (App Router)

| File            | Purpose                                                 |
| --------------- | ------------------------------------------------------- |
| `page.tsx`      | Route segment UI — receives `params` and `searchParams` |
| `layout.tsx`    | Persistent shell — wraps child pages                    |
| `loading.tsx`   | Suspense fallback — auto-wraps page in `<Suspense>`     |
| `error.tsx`     | Error boundary — must be `'use client'`                 |
| `not-found.tsx` | 404 UI for the segment — call `notFound()` to trigger   |
| `route.ts`      | API Route Handler                                       |

---

## Route groups

```
(auth)      — unauthenticated only; redirects to /dashboard if signed in
(dashboard) — requires authentication; redirects to /login if not signed in
(instructor)— requires INSTRUCTOR or ADMIN role
(admin)     — requires ADMIN role
```

Each group has its own `layout.tsx` that handles the auth/role check.

---

## Data fetching patterns

### Server Component — fetch directly

```tsx
// app/(dashboard)/courses/page.tsx — Server Component
import { auth } from '@/lib/auth'
import api from '@/lib/api'

export default async function CoursesPage() {
  const session = await auth()
  // Pass the access token for authenticated requests
  const { data } = await api.get('/courses', {
    headers: { Authorization: `Bearer ${session?.accessToken}` },
  })
  return <CourseList courses={data.data} />
}
```

### Client Component — React Query

```tsx
// components/features/courses/CourseList.tsx
'use client'
import { useCourses } from '@/hooks/queries/courses'

export function CourseList() {
  const { data, isLoading, error } = useCourses({ page: 1, limit: 20 })
  if (isLoading) return <Skeleton />
  if (error) return <ErrorState error={error} />
  return (
    <ul>
      {data?.data.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </ul>
  )
}
```

---

## Passing session data to Client Components

The root `app/providers.tsx` wraps the entire app in `SessionProvider`, `QueryClientProvider`, and mounts `AuthErrorHandler`. Session is available everywhere via `useSession()`:

```tsx
// app/providers.tsx — already set up, do not duplicate
'use client'
import { SessionProvider } from 'next-auth/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthErrorHandler } from '@/components/shared/auth/AuthErrorHandler'
import { getQueryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthErrorHandler />
      <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
    </SessionProvider>
  )
}

// In any client component:
;('use client')
import { useSession } from 'next-auth/react'
const { data: session } = useSession()
```

---

## Middleware — protecting routes

`src/middleware.ts` uses Auth.js `auth()` middleware to:

1. Redirect unauthenticated users from `(dashboard)`, `(instructor)`, `(admin)` → `/login`
2. Redirect authenticated users from `(auth)` → `/dashboard`
3. Redirect STUDENT from `/instructor/*` → `/dashboard`
4. Redirect non-ADMIN from `/admin/*` → `/dashboard`

```typescript
// middleware.ts pattern
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
```

---

## Pagination with searchParams

```tsx
// page.tsx receives searchParams — always validate before use
interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const { page = '1', limit = '20' } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  // ...
}
```

---

## Loading states

Every route group and every page that fetches data has a `loading.tsx` sibling. Use the shared `PageSpinner` component:

```tsx
// loading.tsx — exact pattern used in this project
import { PageSpinner } from '@/components/shared/feedback/LoadingSpinner'

export default function Loading() {
  return <PageSpinner />
}
```

All route groups have `(auth)/loading.tsx`, `(dashboard)/loading.tsx`, `(instructor)/loading.tsx`, and `(admin)/loading.tsx` with this same pattern.

---

## Error boundaries

`error.tsx` must be `'use client'`. Use the shared `ErrorMessage` component:

```tsx
// error.tsx — exact pattern used in this project
'use client'
import { ErrorMessage } from '@/components/shared/feedback/ErrorMessage'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorMessage message={error.message} onRetry={reset} />
}
```

All route groups share this same `error.tsx` pattern. The root `app/error.tsx` uses the same component.

---

## Not-found page

`not-found.tsx` must be `'use client'` if it uses hooks (router). Use the shared `EmptyState` component:

```tsx
// app/not-found.tsx
'use client'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/shared/feedback/EmptyState'

export default function NotFound() {
  const router = useRouter()
  return (
    <EmptyState
      icon={Search}
      title="Page not found"
      description="The page you are looking for does not exist."
      action={{ label: 'Go home', onClick: () => router.push('/') }}
    />
  )
}
```

Trigger it from a page: `import { notFound } from 'next/navigation'; notFound()`

---

## Image optimization

Always use `next/image`. Never `<img>` tags for CDN content:

```tsx
import Image from 'next/image'
;<Image src={course.coverUrl} alt={course.title} width={400} height={225} />
```

Add CDN domains to `next.config.ts` `images.remotePatterns`.

---

## Common mistakes to avoid

| Mistake                                                                    | Fix                                            |
| -------------------------------------------------------------------------- | ---------------------------------------------- |
| `'use client'` on a page that only renders data                            | Remove it; use Server Component                |
| Calling `useSession()` in a Server Component                               | Use `auth()` from `@/lib/auth` instead         |
| Fetching inside a Client Component without React Query                     | Move to a Server Component or add a Query hook |
| `params` accessed without `await` in Next.js 16                            | `const { id } = await params`                  |
| `searchParams` accessed without `await`                                    | `const { page } = await searchParams`          |
| Hardcoding API base URL instead of using `process.env.NEXT_PUBLIC_API_URL` | Use the env var                                |
