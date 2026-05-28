import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Mail } from 'lucide-react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { User } from '@/types/models'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/features/profile/ProfileForm'
import { PasswordForm } from '@/components/features/profile/PasswordForm'
import { DeleteAccountDialog } from '@/components/features/profile/DeleteAccountDialog'

export const metadata: Metadata = { title: 'Mi perfil | NexusLMS' }

export default async function ProfilePage() {
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch up-to-date user data from the API
  let user: User | null = null
  try {
    const r = await api.get<User>('/users/me', { headers })
    user = r.data
  } catch {
    // Fall back to session data if the request fails
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

  const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Usuario'
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || 'U'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={fullName} />
          <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-nexus-text text-2xl font-bold">{fullName}</h1>
            {user.isVerified ? (
              <span
                className="text-nexus-success flex items-center gap-1 text-xs font-semibold"
                aria-label="Email verificado"
              >
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                Verificado
              </span>
            ) : (
              <Link
                href="/verify-email"
                className="text-nexus-accent hover:text-nexus-accent-hover flex items-center gap-1 text-xs font-medium transition-colors"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                Verificar email
              </Link>
            )}
          </div>
          <p className="text-nexus-muted text-sm">{user.email}</p>
        </div>
      </div>

      {/* Profile info card */}
      <Card className="border-nexus-border bg-nexus-card ring-0">
        <CardHeader className="border-nexus-border border-b">
          <CardTitle className="text-nexus-text">Información personal</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      {/* Change password card */}
      <Card className="border-nexus-border bg-nexus-card ring-0">
        <CardHeader className="border-nexus-border border-b">
          <CardTitle className="text-nexus-text">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <PasswordForm />
        </CardContent>
      </Card>

      {/* Danger zone */}
      <section
        aria-labelledby="danger-zone-heading"
        className="border-destructive/30 rounded-xl border p-6"
      >
        <h2 id="danger-zone-heading" className="text-destructive mb-1 text-base font-semibold">
          Zona de peligro
        </h2>
        <p className="text-nexus-muted mb-4 text-sm">
          Una vez que eliminés tu cuenta, no hay vuelta atrás. Pensalo bien.
        </p>
        <DeleteAccountDialog />
      </section>
    </div>
  )
}
