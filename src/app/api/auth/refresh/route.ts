import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Internal route handler — called by the axios interceptor on 401.
// Auth.js JWT callback handles proactive refresh; this endpoint triggers it.
export async function POST() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }
  const token = (session as { accessToken?: string }).accessToken
  return NextResponse.json({ accessToken: token ?? null })
}
