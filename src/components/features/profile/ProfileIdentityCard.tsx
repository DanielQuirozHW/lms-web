import Link from 'next/link'
import { Pencil, Settings, Calendar, Mail } from 'lucide-react'
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
  const roleLabel = user.roles.map((r) => ROLE_LABEL[r] ?? r).join(' · ')

  return (
    <div
      className="bg-nexus-card border-nexus-border overflow-hidden rounded-[22px] border"
      style={{ boxShadow: 'var(--nexus-card-shadow)' }}
    >
      {/* Gradient banner */}
      <div
        className="relative h-32 w-full"
        style={{ background: 'linear-gradient(125deg,#6D5BF0 0%,#8B5BF0 55%,#B05BE0 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            right: 170,
            top: -50,
            width: 180,
            height: 180,
            background: 'rgba(255,255,255,.08)',
          }}
        />
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            right: -30,
            bottom: -70,
            width: 170,
            height: 170,
            background: 'rgba(255,255,255,.07)',
          }}
        />

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2.5">
          <Link
            href="/profile/edit"
            className="flex items-center gap-1.5 text-white no-underline transition-colors hover:opacity-90"
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              background: 'rgba(255,255,255,.16)',
              backdropFilter: 'blur(6px)',
              padding: '9px 15px',
              borderRadius: 11,
              border: '1px solid rgba(255,255,255,.22)',
            }}
          >
            <Pencil
              style={{ width: 16, height: 16, display: 'block', flexShrink: 0 }}
              aria-hidden="true"
            />
            Editar perfil
          </Link>
          <Link
            href="/settings"
            className="flex items-center justify-center text-white no-underline transition-colors hover:opacity-90"
            style={{
              width: 38,
              height: 38,
              background: 'rgba(255,255,255,.16)',
              backdropFilter: 'blur(6px)',
              borderRadius: 11,
              border: '1px solid rgba(255,255,255,.22)',
            }}
            aria-label="Configuración"
          >
            <Settings
              style={{ width: 19, height: 19, display: 'block', flexShrink: 0 }}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      {/* Avatar + info row */}
      <div style={{ padding: '0 30px 28px', display: 'flex', gap: 22, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0, marginTop: -54 }}>
          <div
            style={{
              width: 108,
              height: 108,
              borderRadius: 28,
              background: 'linear-gradient(135deg,#7C6CFF,#6D5BF0)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 38,
              border: '5px solid var(--nexus-card)',
              boxShadow: 'var(--nexus-card-shadow)',
              overflow: 'hidden',
            }}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={fullName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 18 }}>
          {/* Name + verified badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: 26,
                letterSpacing: '-0.02em',
                color: 'var(--nexus-text)',
              }}
            >
              {fullName}
            </h1>
            {user.isVerified && (
              <span
                title="Cuenta verificada"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--nexus-accent)',
                  background: 'var(--chip-0-bg)',
                  padding: '4px 10px 4px 7px',
                  borderRadius: 99,
                }}
              >
                <span style={{ display: 'flex', color: 'var(--nexus-accent)' }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: 'block', flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    <path d="M12 2l2.4 1.8 3 .2 .9 2.9 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9L3.3 15.5l.9-2.9-.9-2.9 2.4-1.8.9-2.9 3-.2z" />
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" />
                  </svg>
                </span>
                Verificado
              </span>
            )}
          </div>

          {/* Role line */}
          {roleLabel && (
            <div style={{ fontSize: 14.5, color: 'var(--nexus-muted)', marginTop: 6 }}>
              {roleLabel}
            </div>
          )}

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginTop: 11,
              fontSize: 13,
              color: 'var(--nexus-faint)',
              flexWrap: 'wrap',
            }}
          >
            {user.createdAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar
                  style={{ width: 15, height: 15, display: 'block', flexShrink: 0 }}
                  aria-hidden="true"
                />
                Miembro desde {formatMemberSince(user.createdAt)}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail
                style={{ width: 15, height: 15, display: 'block', flexShrink: 0 }}
                aria-hidden="true"
              />
              {user.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
