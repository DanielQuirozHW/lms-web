import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'
import { API_URL, isCorporate } from '@/lib/config'

// '/' is the public landing page — must be accessible without authentication
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
])
const MAINTENANCE_PATH = '/maintenance'
const INSTRUCTOR_PREFIX = '/instructor'
const ADMIN_PREFIX = '/admin'

export default auth(async (req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // ── Maintenance check ─────────────────────────────────────────────────────
  // Skip for API routes, static assets, and the maintenance page itself so
  // non-admin users can access /maintenance and admins can still reach /api/*.
  const skipMaintenanceCheck =
    pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico'

  if (!skipMaintenanceCheck) {
    try {
      // next: { revalidate } is ignored in Edge Middleware — does not cache.
      // AbortSignal.timeout caps cold-start backend delays; the catch block fails open.
      const res = await fetch(`${API_URL}/admin/maintenance`, {
        signal: AbortSignal.timeout(2000),
      })
      if (res.ok) {
        const { data } = (await res.json()) as {
          data: { isEnabled: boolean; message: string | null; estimatedEnd: string | null }
        }
        const isAdmin = (session?.user?.roles ?? []).includes('ADMIN')

        if (data.isEnabled && !isAdmin && pathname !== MAINTENANCE_PATH) {
          const url = new URL(MAINTENANCE_PATH, req.url)
          if (data.message) url.searchParams.set('message', data.message)
          if (data.estimatedEnd) url.searchParams.set('estimatedEnd', data.estimatedEnd)
          return NextResponse.redirect(url)
        }

        if (!data.isEnabled && pathname === MAINTENANCE_PATH) {
          return NextResponse.redirect(new URL('/', req.url))
        }
      }
    } catch {
      // Maintenance check failed — fail open so users aren't locked out
    }
  }

  // Maintenance page is publicly accessible — bypass all auth routing
  if (pathname === MAINTENANCE_PATH) {
    return NextResponse.next()
  }

  // ── Auth routing ──────────────────────────────────────────────────────────

  // Auth routes: redirect signed-in users away
  if (PUBLIC_PATHS.has(pathname)) {
    if (session && session.error !== 'RefreshTokenExpired') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Expired refresh token — treat as unauthenticated even though session exists
  if (session?.error === 'RefreshTokenExpired') {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // All other app routes require authentication
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    // Append callbackUrl for internal paths only — prevents open redirect
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const roles = session.user?.roles ?? []

  // Corporate mode: students cannot access the course catalog (/courses exactly).
  // Course detail (/courses/[id]) and lesson pages (/courses/[id]/learn) remain accessible.
  if (isCorporate && pathname === '/courses') {
    if (!roles.includes('ADMIN') && !roles.includes('INSTRUCTOR')) {
      return NextResponse.redirect(new URL('/my-courses', req.url))
    }
  }

  // Instructor routes require INSTRUCTOR or ADMIN
  if (pathname.startsWith(INSTRUCTOR_PREFIX)) {
    if (!roles.includes('INSTRUCTOR') && !roles.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Admin routes require ADMIN
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!roles.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
