import Link from 'next/link'
import { Pencil, Settings, ShieldCheck, Calendar, Mail } from 'lucide-react'
import type { User, UserRole } from '@/types/models'

const ROLE_LABEL: Record<UserRole, string> = {
  STUDENT: 'Estudiante',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Administrador',
}

function formatMemberSince(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })
  } catch {
    return '—'
  }
}

interface ProfileIdentityCardProps {
  user: User
  initials: string
  fullName: string
}

export function ProfileIdentityCard({ user, initials, fullName }: ProfileIdentityCardProps) {
  return (
    <div
      className="bg-nexus-card border-nexus-border overflow-hidden rounded-[22px] border"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}
    >
      {/* Gradient banner */}
      <div
        className="relative h-32 w-full"
        style={{ background: 'linear-gradient(125deg,#7C6CFF 0%,#5b4fd4 50%,#4338ca 100%)' }}
      >
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            aria-label="Editar perfil"
          >
            <Pencil className="h-[15px] w-[15px]" aria-hidden="true" />
          </Link>
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            aria-label="Configuración"
          >
            <Settings className="h-[15px] w-[15px]" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Avatar + info */}
      <div className="px-6 pb-6">
        {/* Avatar overlapping banner */}
        <div className="mb-3" style={{ marginTop: '-54px' }}>
          <div
            className="flex h-[108px] w-[108px] items-center justify-center overflow-hidden rounded-[28px] border-4 text-[32px] font-extrabold text-white"
            style={{
              background: 'linear-gradient(135deg,#7C6CFF,#5b4fd4)',
              borderColor: 'var(--nexus-card)',
            }}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </div>

        {/* Name + verified */}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-nexus-text text-[22px] font-extrabold tracking-[-0.02em]">
            {fullName}
          </h1>
          {user.isVerified && (
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold"
              style={{ background: 'rgba(124,108,255,.14)', color: 'var(--nexus-accent)' }}
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Verificado
            </span>
          )}
        </div>

        {/* Roles */}
        {user.roles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.roles.map((role) => (
              <span
                key={role}
                className="border-nexus-border text-nexus-muted rounded-full border px-2.5 py-0.5 text-[12px] font-semibold"
              >
                {ROLE_LABEL[role] ?? role}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <span className="text-nexus-muted flex items-center gap-1.5 text-[13px]">
            <Mail className="h-3.75 w-3.75 shrink-0" aria-hidden="true" />
            {user.email}
          </span>
          {user.createdAt && (
            <span className="text-nexus-muted flex items-center gap-1.5 text-[13px]">
              <Calendar className="h-3.75 w-3.75 shrink-0" aria-hidden="true" />
              Miembro desde {formatMemberSince(user.createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
