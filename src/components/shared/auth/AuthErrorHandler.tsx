'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { disconnectAll } from '@/lib/socket'
import type { User } from '@/types/models'

export function AuthErrorHandler() {
  const { data: session, update } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.error === 'RefreshTokenExpired') {
      // Disconnect WebSocket connections before clearing the session so no
      // post-expiry events are processed with a stale authenticated connection.
      disconnectAll()
      signOut({ callbackUrl: '/login' })
    }
  }, [session?.error])

  useEffect(() => {
    if (session?.error !== 'ImpersonationExpired') return
    ;(async () => {
      try {
        // Try to restore admin session using backup tokens stored in the JWT.
        const res = await fetch('/api/auth/restore-admin', { method: 'POST' })
        if (res.ok) {
          const adminData = (await res.json()) as {
            accessToken: string
            refreshToken: string
            user: User
          }
          await update({ restoreAdmin: adminData })
          router.push('/admin/users')
          router.refresh()
        } else {
          // Backup tokens also expired — sign out completely.
          disconnectAll()
          await signOut({ callbackUrl: '/login' })
        }
      } catch {
        disconnectAll()
        await signOut({ callbackUrl: '/login' })
      }
    })()
    // update and router are stable references — intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.error])

  return null
}
