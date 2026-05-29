import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, CheckCircle2, ShieldAlert } from 'lucide-react'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import type { User, UserRole } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import type { EnrollmentWithStudent } from '@/hooks/queries/enrollments'

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}
  try {
    const r = await api.get<User>(`/users/${userId}`, { headers })
    return { title: `${r.data.firstName} ${r.data.lastName} | Admin | NexusLMS` }
  } catch {
    return { title: 'Perfil de usuario | Admin | NexusLMS' }
  }
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  STUDENT: { label: 'Estudiante', className: 'bg-nexus-muted/10 text-nexus-muted' },
  INSTRUCTOR: { label: 'Instructor', className: 'bg-nexus-accent/15 text-nexus-accent' },
  ADMIN: { label: 'Admin', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
}

export default async function AdminUserProfilePage({ params }: PageProps) {
  const { userId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch user + enrollments in parallel
  const [userResult, enrollmentsResult] = await Promise.allSettled([
    api.get<User>(`/users/${userId}`, { headers }),
    api.get<PaginatedData<EnrollmentWithStudent>>(`/enrollments`, {
      params: { userId, limit: 20 },
      headers,
    }),
  ])

  if (userResult.status === 'rejected') {
    if (isApiError(userResult.reason) && userResult.reason.response?.data.statusCode === 404) {
      notFound()
    }
    throw userResult.reason
  }

  const user = userResult.value.data
  const enrollments: EnrollmentWithStudent[] =
    enrollmentsResult.status === 'fulfilled' ? (enrollmentsResult.value.data.data ?? []) : []

  const fullName = `${user.firstName} ${user.lastName}`.trim()
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back */}
      <Link
        href="/admin/users"
        className={buttonVariants({
          variant: 'ghost',
          size: 'sm',
          className: 'text-nexus-muted hover:text-nexus-text -ml-2 flex items-center gap-1',
        })}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Volver a usuarios
      </Link>

      {/* Profile card */}
      <div className="border-nexus-border bg-nexus-card rounded-xl border p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-nexus-text text-xl font-bold">{fullName}</h1>
              {user.isVerified && (
                <CheckCircle2
                  className="text-nexus-success h-5 w-5"
                  aria-label="Email verificado"
                />
              )}
            </div>
            <p className="text-nexus-muted text-sm">{user.email}</p>
            <p className="text-nexus-muted mt-0.5 text-xs">
              Registrado {formatRelativeTime(user.createdAt)}
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div className="border-nexus-border mt-5 grid grid-cols-2 gap-4 border-t pt-5 sm:grid-cols-3">
          <div>
            <p className="text-nexus-muted text-[10px] font-semibold tracking-wide uppercase">
              Roles
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.roles.map((role) => {
                const cfg = roleConfig[role]
                return (
                  <span
                    key={role}
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      cfg.className
                    )}
                  >
                    {cfg.label}
                  </span>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-nexus-muted text-[10px] font-semibold tracking-wide uppercase">
              Estado
            </p>
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                user.isVerified ? 'text-nexus-success' : 'text-amber-500'
              )}
            >
              {user.isVerified ? 'Verificado' : 'Sin verificar'}
            </p>
          </div>
          <div>
            <p className="text-nexus-muted text-[10px] font-semibold tracking-wide uppercase">
              Registrado
            </p>
            <p className="text-nexus-text mt-1 text-sm">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Role editing note */}
      <div className="border-nexus-border bg-nexus-card flex items-start gap-3 rounded-xl border p-4">
        <ShieldAlert className="text-nexus-accent mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-nexus-text text-sm font-semibold">Gestión de roles</p>
          <p className="text-nexus-muted mt-0.5 text-sm">
            La modificación de roles requiere acceso directo a la base de datos o herramientas de
            administración del servidor. La API no expone un endpoint de edición de roles por
            seguridad.
          </p>
        </div>
      </div>

      {/* Enrollments */}
      {enrollments.length > 0 && (
        <div>
          <h2 className="text-nexus-text mb-3 text-base font-semibold">
            Inscripciones ({enrollments.length})
          </h2>
          <div className="divide-nexus-border border-nexus-border divide-y rounded-xl border">
            {enrollments.map((enrollment) => {
              const pct = Math.round(enrollment.progress?.progressPercentage ?? 0)
              const statusLabels: Record<string, string> = {
                ACTIVE: 'Activo',
                COMPLETED: 'Completado',
                CANCELLED: 'Cancelado',
              }
              return (
                <div
                  key={enrollment.id}
                  className="bg-nexus-card flex items-center gap-4 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-nexus-text truncate text-sm">
                      Curso: {enrollment.courseId.slice(0, 8)}…
                    </p>
                    <p className="text-nexus-muted text-xs">
                      Inscripto {formatDate(enrollment.enrolledAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-nexus-muted text-xs">{pct}%</p>
                      <div className="bg-nexus-border mt-0.5 h-1 w-16 overflow-hidden rounded-full">
                        <div
                          className="bg-nexus-accent h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-nexus-muted text-xs">
                      {statusLabels[enrollment.status] ?? enrollment.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
