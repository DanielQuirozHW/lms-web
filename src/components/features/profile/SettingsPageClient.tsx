'use client'

import { useRef, useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { User, Lock, Bell, Sliders, Shield, TriangleAlert, Monitor, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ProfileForm } from '@/components/features/profile/ProfileForm'
import { PasswordForm } from '@/components/features/profile/PasswordForm'
import { DeleteAccountDialog } from '@/components/features/profile/DeleteAccountDialog'
import type { User as UserType } from '@/types/models'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string
  icon: LucideIcon
  label: string
  danger?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'cuenta', icon: User, label: 'Cuenta' },
  { id: 'seguridad', icon: Lock, label: 'Seguridad' },
  { id: 'notificaciones', icon: Bell, label: 'Notificaciones' },
  { id: 'preferencias', icon: Sliders, label: 'Preferencias' },
  { id: 'privacidad', icon: Shield, label: 'Privacidad' },
  { id: 'peligro', icon: TriangleAlert, label: 'Zona de peligro', danger: true },
]

// ─── Notification preferences (UI-only — no endpoint) ────────────────────────

interface NotifRow {
  id: string
  label: string
  description: string
}

const NOTIF_ROWS: NotifRow[] = [
  { id: 'enrollment', label: 'Nuevas inscripciones', description: 'Al inscribirte en un curso' },
  { id: 'new_lesson', label: 'Nuevas lecciones', description: 'Cuando se publica contenido nuevo' },
  {
    id: 'forum_reply',
    label: 'Respuestas en foros',
    description: 'Cuando alguien responde tu hilo',
  },
  {
    id: 'assignment_graded',
    label: 'Tareas calificadas',
    description: 'Al recibir una calificación',
  },
  { id: 'quiz_result', label: 'Resultados de quizzes', description: 'Aprobado o reprobado' },
  { id: 'course_completed', label: 'Curso completado', description: 'Al finalizar un curso' },
  {
    id: 'announcements',
    label: 'Anuncios',
    description: 'Comunicados importantes de la plataforma',
  },
]

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
      style={{
        background: checked ? 'linear-gradient(135deg,#7C6CFF,#5b4fd4)' : 'var(--nexus-border)',
      }}
    >
      <span
        className="inline-block h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(3px)' }}
      />
    </button>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface SectionProps {
  id: string
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
  danger?: boolean
}

function Section({ id, icon: Icon, title, description, children, danger }: SectionProps) {
  return (
    <section
      id={id}
      className="overflow-hidden rounded-[18px] border"
      style={{
        scrollMarginTop: '100px',
        borderColor: danger ? 'rgba(229,72,77,.35)' : 'var(--nexus-border)',
        background: 'var(--nexus-card)',
      }}
    >
      {/* Section header */}
      <div
        className="flex items-start gap-4 border-b px-6 py-5"
        style={{ borderColor: danger ? 'rgba(229,72,77,.2)' : 'var(--nexus-border)' }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
          style={{
            background: danger ? 'rgba(229,72,77,.12)' : 'var(--nexus-accent-muted)',
          }}
        >
          <Icon
            className="h-[18px] w-[18px]"
            style={{ color: danger ? '#E5484D' : 'var(--nexus-accent)' }}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <h2
            className="text-[17px] font-extrabold tracking-[-0.01em]"
            style={{ color: danger ? '#E5484D' : 'var(--nexus-text)' }}
          >
            {title}
          </h2>
          <p className="text-nexus-muted mt-0.5 text-[13.5px]">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">{children}</div>
    </section>
  )
}

// ─── SettingsPageClient ───────────────────────────────────────────────────────

interface SettingsPageClientProps {
  user: UserType
}

export function SettingsPageClient({ user }: SettingsPageClientProps) {
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('cuenta')
  const sectionsRef = useRef<HTMLDivElement>(null)

  // Track active section on scroll
  useEffect(() => {
    function onScroll() {
      const ids = NAV_ITEMS.map((i) => i.id)
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i])
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 120) {
            setActiveSection(ids[i])
            return
          }
        }
      }
      setActiveSection(ids[0])
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToSection(id: string) {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // ─── Notification toggles (UI-only) ─────────────────────────────────────────
  const [emailToggles, setEmailToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIF_ROWS.map((r) => [r.id, true]))
  )
  const [pushToggles, setPushToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIF_ROWS.map((r) => [r.id, r.id !== 'announcements']))
  )

  // ─── Privacy toggles (UI-only) ───────────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    shareProgress: true,
    marketing: false,
    analytics: true,
  })

  async function handleSignOutAll() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // proceed
    }
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="mx-auto max-w-270 pb-14">
      {/* Page heading */}
      <div className="mb-7">
        <h1 className="text-nexus-text text-[24px] font-extrabold tracking-[-0.02em]">
          Configuración
        </h1>
        <p className="text-nexus-muted mt-1 text-[14px]">
          Administra tu cuenta, seguridad y preferencias personales
        </p>
      </div>

      <div className="flex items-start gap-7">
        {/* Sticky subnav */}
        <nav
          className="bg-nexus-card border-nexus-border hidden w-[228px] shrink-0 overflow-hidden rounded-[18px] border lg:block"
          style={{ position: 'sticky', top: '88px', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}
          aria-label="Secciones de configuración"
        >
          <div className="p-2">
            {NAV_ITEMS.map(({ id, icon: Icon, label, danger }) => {
              const isActive = activeSection === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="flex w-full items-center gap-3 rounded-[11px] px-[14px] py-[11px] text-left text-[14px] font-semibold transition-colors"
                  style={{
                    background: isActive
                      ? danger
                        ? 'rgba(229,72,77,.10)'
                        : 'var(--nexus-accent-muted)'
                      : 'transparent',
                    color: isActive
                      ? danger
                        ? '#E5484D'
                        : 'var(--nexus-accent)'
                      : danger
                        ? '#E5484D'
                        : 'var(--nexus-text)',
                  }}
                >
                  <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                  {label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Main content */}
        <div ref={sectionsRef} className="min-w-0 flex-1 space-y-6">
          {/* ── Cuenta ── */}
          <Section
            id="cuenta"
            icon={User}
            title="Cuenta"
            description="Actualiza tu nombre y foto de perfil"
          >
            <ProfileForm user={user} />
          </Section>

          {/* ── Seguridad ── */}
          <Section
            id="seguridad"
            icon={Lock}
            title="Seguridad"
            description="Cambia tu contraseña y gestiona tus sesiones activas"
          >
            <div className="space-y-8">
              <PasswordForm />

              {/* Sessions stub */}
              <div className="border-nexus-border border-t pt-6">
                <h3 className="text-nexus-text mb-4 text-[15px] font-bold">Sesiones activas</h3>
                <div className="border-nexus-border bg-nexus-bg flex items-center gap-4 rounded-[14px] border p-4">
                  <div className="bg-nexus-accent-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]">
                    <Monitor className="text-nexus-accent h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-nexus-text text-[14px] font-semibold">
                      Tu dispositivo actual
                    </p>
                    <p className="text-nexus-muted text-[12.5px]">Navegador · Sesión actual</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[12px] font-bold"
                    style={{ background: 'rgba(16,185,129,.12)', color: '#10B981' }}
                  >
                    Activa
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Notificaciones ── */}
          <Section
            id="notificaciones"
            icon={Bell}
            title="Notificaciones"
            description="Elige cómo y cuándo quieres recibir notificaciones"
          >
            <div>
              {/* Column headers */}
              <div
                className="border-nexus-border mb-1 border-b pb-2"
                style={{ display: 'grid', gridTemplateColumns: '1fr 84px 84px' }}
              >
                <span className="text-nexus-faint text-[12px] font-bold tracking-widest uppercase" />
                <span className="text-nexus-faint text-center text-[12px] font-bold tracking-widest uppercase">
                  Email
                </span>
                <span className="text-nexus-faint text-center text-[12px] font-bold tracking-widest uppercase">
                  Push
                </span>
              </div>

              <div className="space-y-1">
                {NOTIF_ROWS.map((row) => (
                  <div
                    key={row.id}
                    className="hover:bg-nexus-menu-hover rounded-[10px] py-3 transition-colors"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 84px 84px' }}
                  >
                    <div className="pr-4">
                      <p className="text-nexus-text text-[13.5px] font-semibold">{row.label}</p>
                      <p className="text-nexus-muted text-[12px]">{row.description}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <Toggle
                        checked={emailToggles[row.id] ?? false}
                        onChange={(v) => setEmailToggles((prev) => ({ ...prev, [row.id]: v }))}
                        label={`Email: ${row.label}`}
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <Toggle
                        checked={pushToggles[row.id] ?? false}
                        onChange={(v) => setPushToggles((prev) => ({ ...prev, [row.id]: v }))}
                        label={`Push: ${row.label}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Preferencias ── */}
          <Section
            id="preferencias"
            icon={Sliders}
            title="Preferencias"
            description="Personaliza la apariencia y el idioma de la plataforma"
          >
            <div className="space-y-6">
              {/* Theme */}
              <div>
                <p className="text-nexus-text mb-3 text-[14px] font-bold">Tema</p>
                <div className="flex gap-2">
                  {(
                    [
                      { value: 'light', label: 'Claro' },
                      { value: 'dark', label: 'Oscuro' },
                      { value: 'system', label: 'Sistema' },
                    ] as const
                  ).map(({ value, label }) => {
                    const isActive = theme === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTheme(value)}
                        className="rounded-[11px] border px-4 py-2 text-[13.5px] font-semibold transition-colors"
                        style={{
                          background: isActive
                            ? 'linear-gradient(135deg,#7C6CFF,#5b4fd4)'
                            : 'var(--nexus-bg)',
                          color: isActive ? '#fff' : 'var(--nexus-text)',
                          borderColor: isActive ? 'transparent' : 'var(--nexus-border)',
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Language (display-only) */}
              <div>
                <p className="text-nexus-text mb-2 text-[14px] font-bold">Idioma</p>
                <div className="border-nexus-border bg-nexus-bg text-nexus-text flex h-10 items-center rounded-[11px] border px-3.5 text-[14px]">
                  Español (México)
                </div>
                <p className="text-nexus-muted mt-1.5 text-[12.5px]">Más idiomas próximamente</p>
              </div>
            </div>
          </Section>

          {/* ── Privacidad ── */}
          <Section
            id="privacidad"
            icon={Shield}
            title="Privacidad"
            description="Controla cómo se usa y comparte tu información"
          >
            <div className="space-y-4">
              {(
                [
                  {
                    key: 'publicProfile' as const,
                    label: 'Perfil público',
                    description: 'Permite que otros usuarios vean tu perfil',
                  },
                  {
                    key: 'shareProgress' as const,
                    label: 'Compartir progreso con instructores',
                    description: 'Los instructores podrán ver tu avance en sus cursos',
                  },
                  {
                    key: 'marketing' as const,
                    label: 'Correos de marketing',
                    description: 'Recibir novedades, promociones y contenido destacado',
                  },
                  {
                    key: 'analytics' as const,
                    label: 'Datos de uso estadísticos',
                    description: 'Ayúdanos a mejorar la plataforma de forma anónima',
                  },
                ] as const
              ).map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-nexus-text text-[13.5px] font-semibold">{label}</p>
                    <p className="text-nexus-muted text-[12.5px]">{description}</p>
                  </div>
                  <Toggle
                    checked={privacy[key]}
                    onChange={(v) => setPrivacy((prev) => ({ ...prev, [key]: v }))}
                    label={label}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* ── Zona de peligro ── */}
          <Section
            id="peligro"
            icon={TriangleAlert}
            title="Zona de peligro"
            description="Acciones irreversibles que afectan permanentemente tu cuenta"
            danger
          >
            <div className="space-y-4">
              {/* Sign out all */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-nexus-text text-[13.5px] font-semibold">
                    Cerrar sesión en todos los dispositivos
                  </p>
                  <p className="text-nexus-muted text-[12.5px]">
                    Revoca todas las sesiones activas excepto la actual
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOutAll}
                  className="border-nexus-border text-nexus-text hover:bg-nexus-menu-hover flex shrink-0 items-center gap-2 rounded-[11px] border bg-transparent px-4 py-2 text-[13.5px] font-semibold transition-colors"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>

              <div className="border-nexus-border border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13.5px] font-semibold" style={{ color: '#E5484D' }}>
                      Eliminar cuenta
                    </p>
                    <p className="text-nexus-muted text-[12.5px]">
                      Una vez eliminada, no hay vuelta atrás
                    </p>
                  </div>
                  <DeleteAccountDialog />
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
