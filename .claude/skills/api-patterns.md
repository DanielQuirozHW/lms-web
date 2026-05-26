# API Patterns — LMS Web

Read this before writing any React Query hook, API call, or data fetching code.

---

## The axios instance — `lib/api.ts`

One instance, used everywhere. Never create `axios.create()` elsewhere.

The instance:

1. Sets `baseURL` from `NEXT_PUBLIC_API_URL`
2. Attaches `Authorization: Bearer <token>` on every request via a request interceptor (reads token from `/api/auth/token`, an internal Next.js route — the raw token never touches client-side storage)
3. **Unwraps the `{ data, timestamp }` envelope** so callers receive the payload directly (see below)
4. On 401: refreshes the access token via `/api/auth/refresh` (single retry), then sign out on second failure
5. Queues concurrent requests that arrive during a refresh; rejects them all if refresh fails

---

## Envelope unwrap — critical to understand

The backend wraps every successful response in `{ data: <payload>, timestamp: "..." }`. The axios response interceptor removes this wrapper **before** the promise resolves.

**What callers receive:**

```typescript
// Backend: { data: { id: "abc", title: "..." }, timestamp: "..." }
// r.data after interceptor:
const course = await api.get<Course>('/courses/abc').then((r) => r.data)
// course === { id: "abc", title: "..." }  ✓

// Backend: { data: { data: [...], meta: {...} }, timestamp: "..." }
// r.data after interceptor:
const result = await api.get<PaginatedData<Course>>('/courses').then((r) => r.data)
// result === { data: [...], meta: { total, page, limit, totalPages } }  ✓
// result.data is the items array; result.meta has pagination info

// Scalar/count endpoint
// Backend: { data: { count: 5 }, timestamp: "..." }
const count = await api
  .get<{ count: number }>('/notifications/unread-count')
  .then((r) => r.data.count)
// count === 5  ✓
```

**❌ Common mistake — double-unwrap:**

```typescript
// WRONG — the envelope is already removed by the interceptor
api.get<{ data: PaginatedData<Course> }>('/courses').then((r) => r.data.data)
// r.data is PaginatedData<Course>, so r.data.data is Course[] — meta is lost

// WRONG — throws at runtime
api.get<{ data: { count: number } }>('/notifications/unread-count').then((r) => r.data.data.count)
// r.data is { count: number }, r.data.data is undefined — TypeError
```

The type parameter of `api.get<T>()` should describe the **unwrapped payload**, not the envelope.

---

## React Query hook pattern

One file per domain in `src/hooks/queries/`:

```typescript
// hooks/queries/courses.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Course, CourseDetail } from '@/types/models'
import type { PaginatedData } from '@/types/api'

// Always define query keys as a const object
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: CoursesFilter) => [...courseKeys.lists(), filters] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
}

export function useCourses(filters: CoursesFilter = {}) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () =>
      api.get<PaginatedData<Course>>('/courses', { params: filters }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => api.get<CourseDetail>(`/courses/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}
```

---

## Mutation hook pattern

```typescript
// hooks/mutations/courses.ts
export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCourseInput) => api.post<Course>('/courses', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    },
  })
}
```

---

## Pagination pattern

```typescript
export function useCoursesPaginated(page: number, limit = 20) {
  return useQuery({
    queryKey: courseKeys.list({ page, limit }),
    queryFn: () =>
      api.get<PaginatedData<Course>>('/courses', { params: { page, limit } }).then((r) => r.data),
    placeholderData: keepPreviousData, // prevents layout shift on page change
  })
}
```

`r.data` is `PaginatedData<Course>` = `{ data: Course[], meta: { total, page, limit, totalPages } }`.

---

## Error handling

API errors follow the shape:

```json
{ "statusCode": 404, "message": "Course not found", "error": "Not Found" }
```

The axios instance transforms these into `AxiosError` with `error.response.data` being the above. Use `isApiError()` from `lib/api.ts` to narrow:

```typescript
import { isApiError } from '@/lib/api'

onError: (error) => {
  if (isApiError(error)) {
    if (error.response.data.statusCode === 409) {
      toast.error('This course already exists')
      return
    }
    toast.error(error.response.data.message)
  } else {
    toast.error('Something went wrong')
  }
}
```

**Error codes to handle in every mutation:**

| Code  | When                   | Action                                                        |
| ----- | ---------------------- | ------------------------------------------------------------- |
| `400` | Validation error       | Show field-level errors from `message`                        |
| `401` | Token expired          | Axios interceptor handles — should not reach here             |
| `403` | Wrong role / not owner | Show permission denied, do not retry                          |
| `404` | Resource not found     | Show not-found state                                          |
| `409` | Conflict               | Show specific conflict message                                |
| `429` | Rate limited           | Show "try again in a moment" — React Query does not retry 429 |

---

## Optimistic updates

Only use optimistic updates for low-risk mutations (vote, mark-read, toggle):

```typescript
useMutation({
  mutationFn: (value: 1 | -1) =>
    api.post(`/forum/threads/${threadId}/posts/${postId}/vote`, { value }),
  onMutate: async (value) => {
    await queryClient.cancelQueries({ queryKey: postKeys.detail(postId) })
    const previous = queryClient.getQueryData(postKeys.detail(postId))
    queryClient.setQueryData(postKeys.detail(postId), (old: Post) => ({
      ...old,
      voteScore: old.voteScore + value,
    }))
    return { previous }
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(postKeys.detail(postId), context?.previous)
  },
})
```

---

## File upload pattern

```typescript
async function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  // r.data is the unwrapped payload: { url: string }
  const response = await api.post<{ url: string }>('/upload/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.url
}

// For lesson video: presigned URL flow
async function uploadLessonVideo(lessonId: string, file: File) {
  const { data } = await api.post<{ uploadUrl: string; publicUrl: string }>(
    '/upload/lesson-video',
    { lessonId, contentType: file.type }
  )
  // PUT directly to R2 — NOT through the API
  await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  return data.publicUrl
}
```

---

## Stale time configuration

Set per-query stale times based on how often data changes:

```typescript
useQuery({
  queryKey: courseKeys.detail(id),
  staleTime: 5 * 60 * 1000, // 5 minutes — course details don't change often
})

useQuery({
  queryKey: notificationKeys.unreadCount(),
  staleTime: 30 * 1000, // 30 seconds
  refetchInterval: 60 * 1000, // poll every minute when window is focused
})
```

---

## Retry policy

Configured in `lib/query-client.ts`. Never retry on these status codes:

| Status | Reason                                 |
| ------ | -------------------------------------- |
| 401    | Interceptor handles via refresh        |
| 403    | Wrong role — retrying won't help       |
| 404    | Resource doesn't exist                 |
| 429    | Rate limited — retrying makes it worse |

All other errors retry up to 2 times. Mutations never retry.
