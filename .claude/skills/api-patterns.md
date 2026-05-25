# API Patterns — LMS Web

Read this before writing any React Query hook, API call, or data fetching code.

---

## The axios instance — `lib/api.ts`

One instance, used everywhere. Never create `axios.create()` elsewhere.

The instance:

1. Sets `baseURL` from `NEXT_PUBLIC_API_URL`
2. Attaches `Authorization: Bearer <token>` on every request (from Auth.js session)
3. Refreshes the access token transparently on 401 (single retry, then sign out)
4. Unwraps the `{ data, timestamp }` envelope so callers receive the payload directly

---

## React Query hook pattern

One file per domain in `src/hooks/queries/`:

```typescript
// hooks/queries/courses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Course, PaginatedResponse } from '@/types/models'

// Always define query keys as a const object
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: CoursesFilter) => [...courseKeys.lists(), filters] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
}

export function useCourses(filters: CoursesFilter) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () =>
      api.get<PaginatedResponse<Course>>('/courses', { params: filters }).then((r) => r.data),
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => api.get<Course>(`/courses/${id}`).then((r) => r.data),
    enabled: !!id,
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
      // Invalidate all course lists so they refetch
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
      api
        .get<PaginatedResponse<Course>>('/courses', { params: { page, limit } })
        .then((r) => r.data),
    placeholderData: keepPreviousData, // prevents layout shift on page change
  })
}
```

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
  }
}
```

**Error codes to handle in every mutation:**

| Code  | When                   | Action                                            |
| ----- | ---------------------- | ------------------------------------------------- |
| `400` | Validation error       | Show field-level errors from `message`            |
| `401` | Token expired          | Axios interceptor handles — should not reach here |
| `403` | Wrong role / not owner | Show permission denied, do not retry              |
| `404` | Resource not found     | Show not-found state                              |
| `409` | Conflict               | Show specific conflict message                    |
| `429` | Rate limited           | Show "try again in a moment" with backoff         |

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
  await fetch(data.data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  return data.data.publicUrl
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
  staleTime: 30 * 1000, // 30 seconds — check frequently
  refetchInterval: 60 * 1000, // poll every minute when window is focused
})
```
