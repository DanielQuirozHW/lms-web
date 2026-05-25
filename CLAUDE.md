# CLAUDE.md

⚠️ Always read `MISTAKES.md` before generating any code in this project.

This file provides guidance to Claude Code when working in this repository.

---

## Before implementing any feature — 5-step checklist

1. **Read `MISTAKES.md`** — check whether the feature touches any pattern that has caused a bug or vulnerability before (XSS, token handling, stale cache, auth state).
2. **Read the relevant skill** — identify which `.claude/skills/` file applies and read it before writing code.
3. **Decide Server vs Client** — explicitly state whether each new component is a Server Component or Client Component and why, before writing it.
4. **Plan error states first** — identify the 401, 403, 404, 409, and 429 cases for every API call before implementing the happy path.
5. **Run `/security-review` on new files** — after generating, run a security review before marking the task complete.

---

## Available Skills

| Skill            | File                                | Use when                                                                                 |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| Next.js Patterns | `.claude/skills/nextjs-patterns.md` | Server vs Client components, layouts, route groups, middleware, data fetching strategies |
| API Patterns     | `.claude/skills/api-patterns.md`    | React Query hooks, axios client, token refresh, error handling, optimistic updates       |
| Auth Patterns    | `.claude/skills/auth-patterns.md`   | Auth.js config, session access, protected routes, role guards, token storage             |
| Socket Patterns  | `.claude/skills/socket-patterns.md` | Socket.io client setup, event types, reconnection, namespace usage                       |
| Security         | `.claude/skills/security.md`        | XSS prevention, token storage, CSP, input sanitization, frontend security rules          |
| Form Patterns    | `.claude/skills/form-patterns.md`   | React Hook Form + Zod, field-level errors, file uploads, submission states               |

---

## Available Commands

| Command                      | Description                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `/new-page <PageName>`       | Scaffold a new App Router page with loading, error, and not-found states       |
| `/new-feature <FeatureName>` | Scaffold a feature folder: component, hook, types, query                       |
| `/security-review <path>`    | OWASP frontend security audit: XSS, token exposure, auth bypass, data exposure |
| `/code-review <path>`        | Architecture, TypeScript, component design, accessibility, performance         |
| `/pre-commit-check <path>`   | Scan for console.log, any type, hardcoded secrets, missing error states        |

---

## Project

Frontend for an LMS (Learning Management System) built with:

- **Next.js 16** — App Router, TypeScript strict
- **Tailwind CSS 4** — utility-first styling
- **shadcn/ui** — component library (Radix UI primitives)
- **Auth.js v5** (`next-auth@beta`) — authentication via custom credentials provider
- **React Query** (`@tanstack/react-query`) — server state and data fetching
- **Zustand** — client-only global state (UI state, notifications)
- **Socket.io client** — real-time forum and messaging
- **pnpm** — package manager
- **Vercel** — deployment target

---

## Backend API Reference

**Base URL (local)**: `http://localhost:3000/api/v1`
**Swagger**: `http://localhost:3000/api/docs` (dev only)
**Full reference**: `C:\LMS\lms-api\docs\BACKEND_REFERENCE.md`

### Authentication Flow

```
1. POST /auth/login  →  { accessToken, refreshToken, user }
   POST /auth/register → { accessToken, refreshToken, user }

2. Every protected request:
   Authorization: Bearer <accessToken>

3. Access token expires after 15 minutes. Before expiry:
   POST /auth/refresh { refreshToken }  →  { accessToken, refreshToken, user }
   (old refresh token is revoked — replace immediately)

4. On logout:
   POST /auth/logout { refreshToken }
```

### Response Envelope

All successful responses (except 204):

```json
{ "data": <payload>, "timestamp": "..." }
```

Paginated responses:

```json
{
  "data": {
    "data": [...],
    "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
  },
  "timestamp": "..."
}
```

Errors:

```json
{ "statusCode": 404, "message": "...", "error": "Not Found", "path": "...", "timestamp": "..." }
```

### User Roles

| Role         | Description                                                      |
| ------------ | ---------------------------------------------------------------- |
| `STUDENT`    | Default. Enroll in courses, view content, participate in forums  |
| `INSTRUCTOR` | Create/manage own courses, grade submissions, post announcements |
| `ADMIN`      | Full access to all resources                                     |

Users can hold multiple roles simultaneously (`roles` is an array).

### Key Enums (match backend exactly)

```typescript
type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT'
type QuestionType = 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_TEXT' | 'LONG_TEXT'
type GradingType = 'AUTOMATIC' | 'MANUAL'
type RatingScale = 'STARS_5' | 'NUMERIC_10' | 'NUMERIC_100'
type NotificationType =
  | 'ENROLLMENT'
  | 'NEW_LESSON'
  | 'FORUM_REPLY'
  | 'ASSIGNMENT_GRADED'
  | 'QUIZ_PASSED'
  | 'QUIZ_FAILED'
  | 'COURSE_COMPLETED'
  | 'ANNOUNCEMENT'
type CalendarEventType =
  | 'ASSIGNMENT_DUE'
  | 'QUIZ_DUE'
  | 'LESSON_AVAILABLE'
  | 'COURSE_START'
  | 'COURSE_END'
  | 'CUSTOM'
```

### WebSocket Namespaces

- `/forum` — joinThread, leaveThread events
- `/messages` — sendMessage, markRead events; receives newMessage, messagesRead
- Auth: `io(url, { auth: { token: accessToken } })`
- Rate limit: 20 events / 10 seconds per connection

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/                   # Unauthenticated routes (login, register)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Authenticated student/shared routes
│   │   ├── dashboard/page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx          # Course catalog
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx      # Course detail
│   │   │       ├── learn/[lessonId]/page.tsx
│   │   │       └── forum/page.tsx
│   │   ├── my-courses/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── messages/
│   │   │   ├── page.tsx
│   │   │   └── [userId]/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── profile/page.tsx
│   │   └── layout.tsx
│   ├── (instructor)/             # Instructor-only routes
│   │   ├── instructor/
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [courseId]/
│   │   │   │       ├── edit/page.tsx
│   │   │   │       ├── modules/page.tsx
│   │   │   │       ├── students/page.tsx
│   │   │   │       └── gradebook/page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (admin)/                  # Admin-only routes
│   │   ├── admin/
│   │   │   ├── users/page.tsx
│   │   │   ├── courses/page.tsx
│   │   │   └── categories/page.tsx
│   │   └── layout.tsx
│   ├── api/auth/[...nextauth]/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # shadcn/ui (auto-generated — do not hand-edit)
│   ├── shared/                   # Reusable across all roles
│   │   ├── navigation/
│   │   ├── layouts/
│   │   └── feedback/             # Loading, error, empty states
│   └── features/                 # Domain-specific components
│       ├── auth/
│       ├── courses/
│       ├── lessons/
│       ├── quiz/
│       ├── assignments/
│       ├── forum/
│       ├── messages/
│       ├── notifications/
│       ├── calendar/
│       └── gradebook/
├── hooks/
│   ├── queries/                  # useQuery hooks per domain
│   └── mutations/                # useMutation hooks per domain
├── lib/
│   ├── api.ts                    # Axios instance + request/response interceptors
│   ├── auth.ts                   # Auth.js (next-auth) config
│   ├── socket.ts                 # Socket.io client factory
│   ├── query-client.ts           # React Query client configuration
│   └── utils.ts                  # cn(), formatDate(), etc.
├── store/
│   ├── notifications.store.ts    # Zustand: unread count, WS notifications
│   └── socket.store.ts           # Zustand: socket connection state
├── types/
│   ├── api.ts                    # ApiResponse<T>, PaginatedResponse<T>, ApiError
│   └── models.ts                 # All domain model types (match backend DTOs exactly)
└── middleware.ts                 # Auth route protection
```

**Where each type of code goes:**

- **Server Components**: pages, layouts, data-heavy displays with no interactivity
- **Client Components**: forms, interactive UI, anything using hooks/state/effects
- **React Query hooks**: `src/hooks/queries/<domain>.ts` — one file per domain
- **Zustand stores**: only for client-only global state (WebSocket data, UI preferences). Never store server data in Zustand — use React Query cache.
- **`lib/api.ts`**: the single axios instance used everywhere — never create a second one
- **`types/models.ts`**: single source of truth for API shapes — never inline API types in components

---

## Security Rules — always follow these

1. **Never store tokens in `localStorage`**. Auth.js manages the session via HttpOnly cookies (server-side JWT). The access token is retrieved from the Auth.js session when needed for API calls — never from localStorage.

2. **Never expose the access token to JavaScript directly**. For API calls from Client Components, route through the Auth.js session on the server side, or use the axios interceptor (which reads from session) — never put raw tokens in JS variables that could be read from the console.

3. **Implement proactive token refresh**. The axios interceptor must check token expiry before each request and call `POST /auth/refresh` proactively. On 401, attempt one refresh and retry. On second 401, sign out.

4. **Validate all user input with Zod schemas** before submitting to the API. Never pass raw form data — always go through a validated type.

5. **Sanitize rich text before rendering**. Any content that comes from the database and is rendered as HTML (lesson content, forum posts) must be sanitized with DOMPurify before `dangerouslySetInnerHTML`. Never skip this.

6. **Never log tokens, passwords, or PII**. Console statements in components may be visible in browser devtools. No `console.log(session)`, `console.log(token)`, `console.log(formValues)` in production code.

7. **Always handle 401 in React Query**. The global `onError` handler in the query client must check for 401 and trigger a signOut. Individual queries must not handle 401 themselves — they rely on the axios interceptor retry + signOut.

8. **Role checks are display-only**. Hiding a button or route from a STUDENT is for UX — it is not a security guarantee. The backend enforces real access control. Never assume a UI role check prevents data access.

9. **Never use `dangerouslySetInnerHTML` without DOMPurify**. No exceptions. Add an ESLint rule to flag unguarded usage.

10. **Validate redirect URLs on login**. The `callbackUrl` parameter on the login page must be validated against the app's own origin before redirecting. Never redirect to external URLs from the auth flow.

---

## Code Conventions

- All code, comments, and variable names in **English**
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters` enabled
- No `any` types — use `unknown` and narrow, or define explicit types
- No `console.log` in source — use `console.error` only in error boundaries, remove debug logs before committing
- Prefer Server Components by default. Add `'use client'` only when required (hooks, event handlers, browser APIs)
- `cn()` from `lib/utils.ts` for all conditional class merging (never string concatenation)
- All API types imported from `@/types/models` — never inline
- All API calls go through the axios instance from `@/lib/api` — never raw `fetch` in components
- Form schemas defined with Zod co-located with the form component file
- React Query keys use a `queryKeys` object defined in each query hook file

---

## Git Workflow

### Commit format (Conventional Commits)

```
<type>(<scope>): <short description>
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`, `build`

Examples:

```
feat(courses): add course catalog with search and filters
fix(auth): handle token refresh race condition
chore(deps): upgrade next-auth to stable
feat(forum): add real-time post notifications via WebSocket
```

### Branch naming

```
feature/<short-description>
fix/<short-description>
chore/<short-description>
hotfix/<short-description>
```

### PR rules

- PRs target `develop` (not `main`)
- `main` receives merges from `develop` for releases only
- PR title follows Conventional Commits format
- `pnpm build` and `pnpm lint` must pass

---

## Commands

```bash
# Development
pnpm dev              # dev server at http://localhost:3001
pnpm build            # production build
pnpm start            # run production build

# Quality
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm type-check       # tsc --noEmit

# shadcn/ui
pnpm dlx shadcn@latest add <component>   # add a new shadcn component
```

---

## Environment Variables

| Variable              | Required  | Description                                                            |
| --------------------- | --------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | ✅        | Frontend app URL (e.g. `http://localhost:3001`)                        |
| `NEXT_PUBLIC_API_URL` | ✅        | Backend API base URL (e.g. `http://localhost:3000/api/v1`)             |
| `NEXT_PUBLIC_WS_URL`  | ✅        | WebSocket server URL (e.g. `http://localhost:3000`)                    |
| `AUTH_SECRET`         | ✅        | Auth.js secret — min 32 chars; generate with `openssl rand -base64 32` |
| `AUTH_URL`            | ✅ (prod) | Canonical URL for Auth.js — must match `NEXT_PUBLIC_APP_URL`           |
