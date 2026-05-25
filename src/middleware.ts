import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'

const PUBLIC_PATHS = new Set(['/login', '/register', '/verify-email'])
const INSTRUCTOR_PREFIX = '/instructor'
const ADMIN_PREFIX = '/admin'

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Auth routes: redirect signed-in users away
  if (PUBLIC_PATHS.has(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // All other app routes require authentication
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    // Append callbackUrl for internal paths only — prevents open redirect
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const roles = session.user?.roles ?? []

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
