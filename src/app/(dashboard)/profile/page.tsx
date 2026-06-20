import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Bookmark, Award } from 'lucide-react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { User } from '@/types/models'
import { ProfileIdentityCard } from '@/components/features/profile/ProfileIdentityCard'
import { ProfileStatsGrid } from '@/components/features/profile/ProfileStatsGrid'
import { ProfileConsistencyCard } from '@/components/features/profile/ProfileConsistencyCard'
import { ProfileRecentActivity } from '@/components/features/profile/ProfileRecentActivity'

export const metadata: Metadata = {
  title: 'Perfil | NexusLMS',
  description: 'Tu perfil, actividad y progreso en la plataforma.',
}

const QUICK_ACCESS = [
  {
    icon: BookOpen,
    label: 'Mis cursos',
    description: 'Ver tu progreso',
    href: '/my-courses',
    bg: 'rgba(124,108,255,.10)',
    color: 'var(--nexus-accent)',
  },
  {
    icon: Bookmark,
    label: 'Guardados',
    description: 'Lecciones marcadas',
    href: '/bookmarks',
    bg: 'rgba(234,140,12,.10)',
    color: '#EA8C0C',
  },
  {
    icon: Award,
    label: 'Certificados',
    description: 'Tus logros',
    href: '/certificates',
    bg: 'rgba(16,185,129,.10)',
    color: '#10B981',
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

  return (
    <div className="mx-auto max-w-270 space-y-5 pb-14">
      {/* Identity card */}
      <ProfileIdentityCard user={user} initials={initials} fullName={fullName} />

      {/* Stats grid */}
      <ProfileStatsGrid />

      {/* Consistency + Quick access */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ProfileConsistencyCard />

        {/* Quick access */}
        <div
          className="bg-nexus-card border-nexus-border flex flex-col gap-4 rounded-[22px] border p-5"
          style={{ boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}
        >
          <div>
            <h2 className="text-nexus-text text-[16px] font-extrabold">Accesos rápidos</h2>
            <p className="text-nexus-muted mt-0.5 text-[13px]">
              Navega rápido a tus secciones principales
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {QUICK_ACCESS.map(({ icon: Icon, label, description, href, bg, color }) => (
              <Link
                key={href}
                href={href}
                className="border-nexus-border hover:bg-nexus-menu-hover flex items-center gap-4 rounded-[14px] border p-4 transition-colors"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
                  style={{ background: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color }} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-nexus-text text-[14px] font-bold">{label}</p>
                  <p className="text-nexus-muted text-[12.5px]">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity + Achievements stub */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <ProfileRecentActivity />

        {/* Achievements placeholder */}
        <div
          className="bg-nexus-card border-nexus-border flex flex-col gap-4 rounded-[22px] border p-5"
          style={{ boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}
        >
          <div>
            <h2 className="text-nexus-text text-[16px] font-extrabold">Logros</h2>
            <p className="text-nexus-muted mt-0.5 text-[13px]">Tus insignias y reconocimientos</p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6">
            <Award className="text-nexus-faint h-10 w-10" aria-hidden="true" />
            <p className="text-nexus-muted text-[13px]">Próximamente</p>
          </div>
        </div>
      </div>
    </div>
  )
}
