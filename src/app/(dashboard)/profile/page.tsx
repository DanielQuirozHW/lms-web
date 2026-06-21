import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { User } from '@/types/models'
import { ProfileIdentityCard } from '@/components/features/profile/ProfileIdentityCard'
import { ProfileStatsGrid } from '@/components/features/profile/ProfileStatsGrid'
import { ProfileConsistencyCard } from '@/components/features/profile/ProfileConsistencyCard'
import { ProfileRecentActivity } from '@/components/features/profile/ProfileRecentActivity'
import { ProfileQuickAccess } from '@/components/features/profile/ProfileQuickAccess'

export const metadata: Metadata = {
  title: 'Perfil | NexusLMS',
  description: 'Tu perfil, actividad y progreso en la plataforma.',
}

const ACHIEVEMENT_UNLOCKED = [
  {
    title: 'Racha de fuego',
    bg: 'var(--chip-0-bg)',
    color: 'var(--chip-0-color)',
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <path d="M12 2c1 3 4 4.5 4 8a4 4 0 1 1-8 0c0-1.5.7-2.8 1.5-3.5C9 8 9 6 12 2z" />
      </svg>
    ),
  },
  {
    title: 'Primer certificado',
    bg: 'var(--chip-1-bg)',
    color: 'var(--chip-1-color)',
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="6" />
        <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
      </svg>
    ),
  },
  {
    title: 'Curso completado',
    bg: 'var(--nexus-green-bg)',
    color: 'var(--nexus-green)',
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.2l2.4 2.3 4.6-4.8" />
      </svg>
    ),
  },
  {
    title: 'Ávido lector',
    bg: 'var(--chip-2-bg)',
    color: 'var(--chip-2-color)',
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
]

const ACHIEVEMENT_LOCKED = [
  {
    title: 'Madrugador',
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    title: 'Maestro',
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="6" />
        <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
      </svg>
    ),
  },
  {
    title: 'Escudo',
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Global',
    icon: (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
      </svg>
    ),
  },
]

export default async function ProfilePage() {
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

  const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Usuario'
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || 'U'

  const totalAchievements = ACHIEVEMENT_UNLOCKED.length + ACHIEVEMENT_LOCKED.length

  return (
    <div className="mx-auto max-w-270 space-y-6 pb-14">
      {/* Identity card */}
      <ProfileIdentityCard user={user} initials={initials} fullName={fullName} />

      {/* Activity stats */}
      <div>
        <h2 className="text-nexus-text mb-3.5 ml-0.5 font-extrabold" style={{ fontSize: 17 }}>
          Resumen de actividad
        </h2>
        <ProfileStatsGrid />
      </div>

      {/* Consistency + Quick access */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ProfileConsistencyCard />
        <ProfileQuickAccess />
      </div>

      {/* Recent activity + Achievements */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <ProfileRecentActivity />

        {/* Achievements */}
        <div
          className="bg-nexus-card border-nexus-border rounded-[18px] border p-[22px]"
          style={{ boxShadow: 'var(--nexus-card-shadow)' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--nexus-text)' }}>Logros</div>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--nexus-accent)' }}>
              {ACHIEVEMENT_UNLOCKED.length} de {totalAchievements}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
            }}
          >
            {ACHIEVEMENT_UNLOCKED.map((a) => (
              <div
                key={a.title}
                title={a.title}
                style={{
                  aspectRatio: '1',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: a.bg,
                  color: a.color,
                  border: '1px solid transparent',
                }}
              >
                {a.icon}
              </div>
            ))}
            {ACHIEVEMENT_LOCKED.map((a) => (
              <div
                key={a.title}
                title={`${a.title} (bloqueado)`}
                style={{
                  aspectRatio: '1',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--nexus-search-bg)',
                  color: 'var(--nexus-faint)',
                  border: '1px solid var(--nexus-border)',
                  opacity: 0.55,
                }}
              >
                {a.icon}
              </div>
            ))}
          </div>

          <Link
            href="/certificates"
            className="text-nexus-accent mt-4 flex items-center justify-center gap-1.5 text-[13.5px] font-bold no-underline hover:underline"
          >
            Ver todos los logros
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: 'block', flexShrink: 0 }}
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
