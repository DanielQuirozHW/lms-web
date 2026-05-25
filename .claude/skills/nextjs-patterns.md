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

```tsx
// layout.tsx (Server Component)
import { auth } from '@/lib/auth'
import { SessionProvider } from 'next-auth/react'

export default async function DashboardLayout({ children }) {
  const session = await auth()
  return <SessionProvider session={session}>{children}</SessionProvider>
}

// any client component
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

Always create `loading.tsx` next to `page.tsx` for route segments that fetch data:

```tsx
// loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return <Skeleton className="h-96 w-full" />
}
```

---

## Error boundaries

`error.tsx` must be `'use client'`. Always provide a retry button:

```tsx
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

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
