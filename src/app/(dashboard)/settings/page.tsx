import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { User } from '@/types/models'
import { SettingsPageClient } from '@/components/features/profile/SettingsPageClient'

export const metadata: Metadata = {
  title: 'Configuración | NexusLMS',
  description: 'Gestiona tu cuenta, seguridad y preferencias.',
}

export default async function SettingsPage() {
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  let user: User | null = null
  try {
    const r = await api.get<User>('/users/me', { headers })
    user = r.data
  } catch {
    if (session?.user) {
      user = {
        id: '',
        email: session.user.email ?? '',
        firstName: session.user.firstName ?? session.user.name?.split(' ')[0] ?? '',
        lastName: session.user.lastName ?? session.user.name?.split(' ').slice(1).join(' ') ?? '',
        roles: session.user.roles ?? [],
        avatarUrl: session.user.avatarUrl ?? null,
        isVerified: session.user.isVerified ?? false,
        createdAt: '',
        updatedAt: '',
      }
    }
  }

  if (!user) return null

  return <SettingsPageClient user={user} />
}
