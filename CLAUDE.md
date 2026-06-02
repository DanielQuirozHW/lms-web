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

**Envelope is automatically unwrapped by the axios interceptor in `lib/api.ts`.** Callers receive the payload directly — `r.data` is already the payload, not the envelope. Examples:

```typescript
// Scalar endpoint → r.data is the payload object
api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count)

// Paginated endpoint → r.data is PaginatedData<T> = { data: T[], meta: {...} }
api.get<PaginatedData<Course>>('/courses').then((r) => r.data)
// r.data.data is the items array; r.data.meta has total, page, limit, totalPages

// ❌ NEVER double-unwrap — the envelope is already gone
api.get<{ data: PaginatedData<Course> }>('/courses').then((r) => r.data.data) // WRONG
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
type EnrollmentType = 'FREE' | 'ASSIGNED' | 'CODE' | 'PAID'
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
- Auth: callback form — `io(url, { auth: tokenAuth })` where `tokenAuth` fetches `/api/auth/token` at connect/reconnect time. **Never pass a static token string** — it goes stale after 15 min (see MISTAKES.md [008])
- Rate limit: 20 events / 10 seconds per connection

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/                   # Unauthenticated routes; redirects to /dashboard if signed in
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── error.tsx             # 'use client' error boundary
│   │   ├── loading.tsx           # Suspense fallback
│   │   └── layout.tsx            # Checks session → redirect to /dashboard
│   ├── (dashboard)/              # Authenticated student/shared routes
│   │   ├── dashboard/page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx          # Course catalog (CORPORATE: ADMIN/INSTRUCTOR only)
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx      # Course detail
│   │   │       ├── learn/[lessonId]/page.tsx
│   │   │       ├── forum/page.tsx
│   │   │       └── progress/page.tsx  # Student progress timeline
│   │   ├── my-courses/page.tsx
│   │   ├── bookmarks/page.tsx
│   │   ├── certificates/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── messages/
│   │   │   ├── page.tsx
│   │   │   └── [userId]/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── layout.tsx            # Checks session → redirect to /login
│   ├── (instructor)/             # Instructor-only routes
│   │   ├── instructor/
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [courseId]/
│   │   │   │       ├── edit/page.tsx
│   │   │   │       ├── modules/page.tsx
│   │   │   │       ├── students/page.tsx  # + AssignUsersModal
│   │   │   │       └── gradebook/page.tsx
│   │   │   └── page.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── layout.tsx            # Checks session + INSTRUCTOR/ADMIN role
│   ├── (admin)/                  # Admin-only routes
│   │   ├── admin/
│   │   │   ├── page.tsx          # Admin dashboard with metrics
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [userId]/page.tsx  # User profile + UserCoursesManager
│   │   │   ├── courses/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── announcements/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── assignments/page.tsx   # CORPORATE only — split-view assignment hub
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── layout.tsx            # Checks session + ADMIN role
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts  # Auth.js handler (GET/POST)
│   │       ├── token/route.ts          # GET — returns current accessToken for axios interceptor
│   │       ├── refresh/route.ts        # POST — triggers JWT refresh, returns refreshed accessToken
│   │       └── logout/route.ts         # POST — revokes refreshToken server-side via getToken()
│   ├── providers.tsx             # SessionProvider + QueryClientProvider + AuthErrorHandler
│   ├── error.tsx                 # Root error boundary ('use client')
│   ├── loading.tsx               # Root Suspense fallback
│   ├── not-found.tsx             # Root 404 ('use client')
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Redirect: session → /dashboard, else → /login
├── components/
│   ├── ui/                       # shadcn/ui (auto-generated — do not hand-edit)
│   ├── shared/                   # Reusable across all roles
│   │   ├── auth/
│   │   │   ├── AuthErrorHandler.tsx   # Detects session.error → signOut
│   │   │   └── ImpersonationBanner.tsx # Fixed amber banner during admin impersonation
│   │   ├── announcements/
│   │   │   └── GlobalAnnouncementBanner.tsx  # Site-wide info/warning/maintenance banner
│   │   ├── navigation/
│   │   │   ├── Header.tsx         # 52px bar: page title, theme toggle, bell, avatar
│   │   │   ├── Sidebar.tsx        # Collapsible side nav (52px/220px), tooltips, mode-aware
│   │   │   ├── NavigationShell.tsx # Client wrapper: collapse state, layout composition
│   │   │   └── Breadcrumbs.tsx
│   │   └── feedback/
│   │       ├── ErrorMessage.tsx         # Used by all error.tsx boundaries
│   │       ├── EmptyState.tsx           # Used by not-found.tsx and empty list states
│   │       ├── LoadingSpinner.tsx       # PageSpinner used by all loading.tsx files
│   │       └── InlineConfirmActions.tsx # Inline "Are you sure? Yes / No" pattern
│   └── features/                 # Domain-specific components
│       ├── auth/                  # LoginForm, RegisterForm, OAuthButtons, VerifyEmailForm
│       ├── courses/               # CourseCard, CourseGrid, CoursesFilter, EnrollButton,
│       │                          # CourseHero, CourseModules, MyCourseCard, MyCoursesFilter,
│       │                          # ProgressTimeline
│       ├── lessons/               # VideoPlayer, TextLesson, LessonPageShell, LessonSidebar,
│       │                          # LessonNavigation, LessonNotes, BookmarkButton
│       ├── quiz/                  # QuizPlayer, QuizEditor, QuestionForm
│       ├── assignments/           # AssignmentPlayer, AssignmentEditor, GradeSubmissionDialog
│       ├── forum/                 # ForumShell, ThreadList, ThreadForm, PostItem, PostForm
│       ├── messages/              # ConversationList, ChatWindow, MessageBubble, MessageInput
│       ├── notifications/
│       ├── calendar/
│       ├── certificates/          # CertificateCard, GenerateCertificateButton
│       ├── dashboard/             # StatsCards, InProgressCourses, UpcomingEvents, NotificationsSync
│       ├── gradebook/
│       ├── profile/               # ProfileForm, PasswordForm, DeleteAccountDialog
│       ├── instructor/            # CourseForm, CourseAnalytics, ModuleList, ModuleForm,
│       │                          # LessonForm, QuizEditor, GradebookSetup, GradebookTable,
│       │                          # StudentList, StudentProgressDetail, InstructorStatsCards,
│       │                          # InstructorCourseCard, DuplicateCourseButton,
│       │                          # EnrollmentCodesManager, AssignUsersModal
│       └── admin/                 # UserTable, AdminCourseTable, CategoryManager,
│                                  # AdminMetricsCards, RecentUsersTable, RecentCoursesTable,
│                                  # GlobalAnnouncementManager, AnnouncementFormDialog,
│                                  # MaintenanceToggle, UserCoursesManager,
│                                  # AssignCoursesModal, AssignmentsPanel
├── hooks/
│   ├── queries/                  # useQuery hooks per domain (one file per domain)
│   └── mutations/                # useMutation hooks per domain
├── lib/
│   ├── api.ts                    # Axios instance + envelope-unwrap + 401-retry interceptors
│   ├── auth.ts                   # Auth.js config (credentials provider, JWT/session callbacks)
│   ├── config.ts                 # API_URL, WS_URL, APP_URL; PORTAL_MODE + isCorporate/isMarketplace/isAcademic
│   ├── navigation.ts             # getDashboardNav(), getInstructorNav(), getAdminNav() — mode-aware
│   ├── errors.ts                 # getApiErrorMessage() helper
│   ├── sanitize.ts               # DOMPurify wrapper — SSR-safe, client-only lazy load
│   ├── socket.ts                 # Socket.io factory (token callback pattern — no static token)
│   ├── query-client.ts           # React Query client (retry policy: no retry on 401/403/404/429)
│   └── utils.ts                  # cn(), formatDate(), formatPrice(), formatDuration(), etc.
├── store/
│   ├── notifications.store.ts    # Zustand: unread count, recent notifications list
│   ├── messages.store.ts         # Zustand: messages unread count
│   └── socket.store.ts           # Zustand: forum/messages connection state
├── types/
│   ├── api.ts                    # ApiResponse<T>, PaginatedData<T>, PaginatedResponse<T>, ApiError
│   ├── models.ts                 # All domain model types (match backend DTOs exactly)
│   └── next-auth.d.ts            # NextAuth module augmentation — Session has no refreshToken
└── middleware.ts                 # Route protection, RefreshTokenExpired redirect, CORPORATE catalog guard
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

9. **Never use `dangerouslySetInnerHTML` without DOMPurify**. ESLint (`react/no-danger`) is configured to catch this. The `sanitize()` helper in `lib/sanitize.ts` must be called first. `dangerouslySetInnerHTML` must only appear in `'use client'` components — `sanitize()` is a no-op on the server. See MISTAKES.md [009].

10. **Validate redirect URLs on login**. The `callbackUrl` parameter on the login page must be validated against the app's own origin before redirecting. Never redirect to external URLs from the auth flow.

11. **Never put `refreshToken` in the session callback**. The refresh token must remain in the JWT only. Server-side revocation uses `getToken()` from `next-auth/jwt` in the `/api/auth/logout` route handler. Client code calls `POST /api/auth/logout` then `signOut()`. See MISTAKES.md [001].

12. **Treat `session.error === 'RefreshTokenExpired'` as unauthenticated in middleware**. A truthy session with an error field still passes `if (!session)` — add an explicit error check before all role guards. See MISTAKES.md [002].

13. **On token refresh failure, reject all queued requests** by calling `onRefreshFailed(err)`. Never just clear the subscriber array — queued Promises will hang forever. See MISTAKES.md [003].

14. **Never include `'unsafe-eval'` in the production CSP**. Gate it on `NODE_ENV === 'development'` (required by Next.js HMR). Production uses `"script-src 'self' 'unsafe-inline'"`. See MISTAKES.md [004].

15. **`X-Frame-Options` and `frame-ancestors` must agree**. If CSP says `frame-ancestors 'none'`, set `X-Frame-Options: DENY`. SAMEORIGIN conflicts. See MISTAKES.md [005].

16. **HSTS must be production-only**. `Strict-Transport-Security` breaks local HTTP dev servers. Gate on `NODE_ENV !== 'development'`. See MISTAKES.md [006].

17. **Add 429 to React Query's no-retry list** alongside 401/403/404. Retrying a rate-limited request immediately makes rate limiting worse. See MISTAKES.md [007].

18. **Socket.io `auth` must use the callback form** so every connect and auto-reconnect fetches a fresh token. A static token string goes stale after 15 minutes. See MISTAKES.md [008].

19. **Portal mode is a UI hint, not a security boundary.** `NEXT_PUBLIC_PORTAL_MODE` is read at build time and controls which UI elements render (nav items, badges, enrollment buttons). Never use `isCorporate` / `isMarketplace` / `isAcademic` to gate actual data access — the backend enforces business rules regardless of mode. A determined user could bypass client-side mode checks.

---

## Portal Mode

The portal runs in one of three modes, set via `NEXT_PUBLIC_PORTAL_MODE` at build time (never at runtime):

| Mode          | Description                              | Key UI behavior                                                                         |
| ------------- | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `MARKETPLACE` | Users browse and self-enroll freely      | Full catalog, prices, all enrollment types shown                                        |
| `CORPORATE`   | Admin assigns users to specific courses  | No catalog for students, no prices, no enrollment type badges; `/admin/assignments` hub |
| `ACADEMIC`    | University-style with enrollment periods | No prices, enrollment date window shown on course page                                  |

**Always use the boolean helpers from `@/lib/config`:**

```typescript
import { isCorporate, isMarketplace, isAcademic } from '@/lib/config'
```

Never compare the string directly (`PORTAL_MODE === 'CORPORATE'`) outside of `config.ts`. The helpers are the single source of truth and make grep-based audits easy.

**What changes per mode:**

- `navigation.ts` — `getDashboardNav()` omits "Explorar cursos" in `isCorporate`; `getAdminNav()` adds "Asignaciones" in `isCorporate`
- `middleware.ts` — redirects students from `/courses` to `/my-courses` in `isCorporate`
- `CourseCard.tsx` — hides price and enrollment-type badges unless `isMarketplace`
- `CoursesFilter.tsx` — hides enrollment-type pill row unless `isMarketplace`
- `EnrollButton.tsx` — student sees assignment message in `isCorporate`; enrollment period check in `isAcademic`

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

| Variable                  | Required  | Description                                                                        |
| ------------------------- | --------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`     | ✅        | Frontend app URL (e.g. `http://localhost:3001`)                                    |
| `NEXT_PUBLIC_API_URL`     | ✅        | Backend API base URL (e.g. `http://localhost:3000/api/v1`)                         |
| `NEXT_PUBLIC_WS_URL`      | ✅        | WebSocket server URL (e.g. `http://localhost:3000`)                                |
| `NEXT_PUBLIC_PORTAL_MODE` | ✅        | Portal behaviour: `CORPORATE` \| `MARKETPLACE` \| `ACADEMIC`. Default: MARKETPLACE |
| `AUTH_SECRET`             | ✅        | Auth.js secret — min 32 chars; generate with `openssl rand -base64 32`             |
| `AUTH_URL`                | ✅ (prod) | Canonical URL for Auth.js — must match `NEXT_PUBLIC_APP_URL`                       |

---

## Completed Features

| Area                  | Feature                                                                                         | Status |
| --------------------- | ----------------------------------------------------------------------------------------------- | ------ |
| Auth                  | Login, Register, Email Verification (OTP), OAuth (Google + Microsoft)                           | ✅     |
| Navigation            | Collapsible sidebar (52/220px, localStorage), Header with page title, Breadcrumbs, theme toggle | ✅     |
| Design System         | Nexus tokens (globals.css), light/dark via next-themes, violet accent                           | ✅     |
| Landing               | Public landing page at `/` with hero, features, stats, CTA                                      | ✅     |
| Dashboard             | Stats cards, in-progress courses, upcoming calendar events                                      | ✅     |
| Courses               | Catalog with category + enrollment-type filters + search, Course detail, Enrollment             | ✅     |
| My Courses            | Status filter tabs, progress cards, CSV export                                                  | ✅     |
| Lesson Player         | Video (HTML5 + keyboard shortcuts), Text (DOMPurify), Quiz, Assignment                          | ✅     |
| Lesson Notes          | Auto-save notes per lesson                                                                      | ✅     |
| Bookmarks             | Bookmark lessons, dedicated bookmarks page                                                      | ✅     |
| Certificates          | View + download PDF certificate on course completion                                            | ✅     |
| Forum                 | Thread list, detail, flat replies, voting, accept answer, WebSocket room                        | ✅     |
| Messages              | Inbox, real-time chat, read receipts, WebSocket                                                 | ✅     |
| Notifications         | Badge sync with Zustand store                                                                   | ✅     |
| Profile               | Edit profile/avatar, change password, delete account                                            | ✅     |
| Calendar              | Upcoming events view                                                                            | ✅     |
| Instructor Dashboard  | Stats, course analytics, course grid with publish/archive, pagination                           | ✅     |
| Course Editor         | Create/edit form with cover upload, enrollment type selector, publish/archive/delete, duplicate | ✅     |
| Module Editor         | Module/Lesson CRUD with HTML5 DnD reorder                                                       | ✅     |
| Quiz Management       | Settings (max attempts, passing score, shuffle), 5 question types                               | ✅     |
| Assignment Management | Settings (grading type, due date), file upload, manual grading                                  | ✅     |
| Enrollment Codes      | CODE-type courses: generate codes, set max uses + expiry, toggle active                         | ✅     |
| Students Page         | Enrollment table, progress detail, CSV export, ADMIN cancel, assign users modal                 | ✅     |
| Gradebook             | Grade matrix table, initial setup, manual grading dialog                                        | ✅     |
| Student Progress      | Per-student timeline view of lesson completions                                                 | ✅     |
| Impersonation         | Admin impersonates any user with amber banner + restore session                                 | ✅     |
| Global Announcements  | Site-wide info/warning/maintenance banners, admin CRUD                                          | ✅     |
| Maintenance Mode      | Admin toggle, redirect non-admins to /maintenance page                                          | ✅     |
| Admin Dashboard       | Metrics cards, recent users + courses tables                                                    | ✅     |
| Admin Users           | List + profile view, user course management, bulk assignment                                    | ✅     |
| Admin Courses         | All-courses table with status filter + publish/archive                                          | ✅     |
| Admin Categories      | Inline CRUD with 409 protection                                                                 | ✅     |
| Portal Mode           | CORPORATE/MARKETPLACE/ACADEMIC build-time mode with mode-aware nav + UI                         | ✅     |
| Assignment Hub        | CORPORATE: assign users to courses (from course or from user), bulk enrollment                  | ✅     |
| Assignments Page      | CORPORATE: split-view admin hub at /admin/assignments                                           | ✅     |
