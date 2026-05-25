import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Internal route handler — used by the axios interceptor to get the access token
// without exposing it to client-side JavaScript directly.
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ accessToken: null }, { status: 401 })
  }
  const token = (session as { accessToken?: string }).accessToken
  return NextResponse.json({ accessToken: token ?? null })
}
