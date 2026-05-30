import { type NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { API_URL } from '@/lib/config'

// Called by AuthErrorHandler when session.error === 'ImpersonationExpired'.
// Reads the admin's backup refresh token from the server-side JWT and issues
// fresh admin tokens — restoring the session without requiring re-login.
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })

  if (!token?.adminRefreshToken) {
    return NextResponse.json({ error: 'No admin session to restore' }, { status: 400 })
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token.adminRefreshToken }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Admin token refresh failed' }, { status: 401 })
  }

  const { data } = (await res.json()) as {
    data: { accessToken: string; refreshToken: string; user: unknown }
  }
  return NextResponse.json(data)
}
