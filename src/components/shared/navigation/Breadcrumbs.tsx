'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

// ─── Segment label map ────────────────────────────────────────────────────────

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  courses: 'Cursos',
  'my-courses': 'Mis cursos',
  messages: 'Mensajes',
  calendar: 'Calendario',
  notifications: 'Notificaciones',
  profile: 'Perfil',
  instructor: 'Instructor',
  admin: 'Admin',
  users: 'Usuarios',
  categories: 'Categorías',
  modules: 'Módulos',
  edit: 'Editar',
  new: 'Nuevo',
  students: 'Estudiantes',
  gradebook: 'Calificaciones',
  forum: 'Foro',
  learn: 'Lección',
  certificates: 'Certificados',
  verify_email: 'Verificar email',
}

// UUID-like pattern (hex chars and hyphens, 32+ chars)
const UUID_RE = /^[0-9a-f-]{32,}$/i

function resolveLabel(segment: string, prevSegment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  if (UUID_RE.test(segment)) {
    // Infer from parent segment
    const parentMap: Record<string, string> = {
      courses: 'Curso',
      users: 'Usuario',
      messages: 'Conversación',
      learn: 'Lección',
      modules: 'Módulo',
    }
    return parentMap[prevSegment] ?? segment.slice(0, 6) + '…'
  }
  // Capitalize unknown segments
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Only show breadcrumbs when there is more than 1 segment
  if (segments.length <= 1) return null

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const prev = i > 0 ? segments[i - 1] : ''
    return { label: resolveLabel(seg, prev), href, isLast: i === segments.length - 1 }
  })

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-nexus-border hidden border-b px-4 py-2 lg:flex lg:px-6"
    >
      <ol className="text-nexus-muted flex flex-wrap items-center gap-1 text-xs">
        <li>
          <Link
            href="/dashboard"
            className="hover:text-nexus-text flex items-center transition-colors"
            aria-label="Inicio"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </li>
        {crumbs.map(({ label, href, isLast }) => (
          <li key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            {isLast ? (
              <span className="text-nexus-text font-medium" aria-current="page">
                {label}
              </span>
            ) : (
              <Link href={href} className="hover:text-nexus-text transition-colors">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
