'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { disconnectAll } from '@/lib/socket'

export function AuthErrorHandler() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === 'RefreshTokenExpired') {
      // Disconnect WebSocket connections before clearing the session so no
      // post-expiry events are processed with a stale authenticated connection.
      disconnectAll()
      signOut({ callbackUrl: '/login' })
    }
  }, [session?.error])

  return null
}
