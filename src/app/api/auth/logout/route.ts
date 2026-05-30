import { type NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { API_URL } from '@/lib/config'

// Reads the refresh token from the server-side JWT (never exposed to client JS)
// and revokes it on the backend before the client calls signOut().
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })

  if (token?.refreshToken) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      })
    } catch {
      // Backend revocation failed — client will still call signOut() to clear the session.
    }
  }

  return NextResponse.json({ ok: true })
}
