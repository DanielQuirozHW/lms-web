'use client'

import { useState } from 'react'
import { Search, CheckCircle2, X, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { useImpersonateMutation } from '@/hooks/mutations/impersonation'
import type { User, UserRole } from '@/types/models'
import type { PaginationMeta } from '@/types/api'

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  STUDENT: { label: 'Estudiante', className: 'bg-nexus-muted/10 text-nexus-muted' },
  INSTRUCTOR: { label: 'Instructor', className: 'bg-nexus-accent/15 text-nexus-accent' },
  ADMIN: { label: 'Admin', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
}

interface UserTableProps {
  users: User[]
  meta: PaginationMeta
  currentPage: number
}

export function UserTable({ users, meta, currentPage }: UserTableProps) {
  const [search, setSearch] = useState('')
  const { data: session } = useSession()
  const {
    mutate: impersonate,
    isPending: isImpersonating,
    variables: pendingUserId,
  } = useImpersonateMutation()

  const currentUserId = session?.user.id
  const isAdmin = session?.user.roles.includes('ADMIN') ?? false
  const alreadyImpersonating = !!session?.impersonatedBy

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = `${u.firstName} ${u.lastName}`.toLowerCase()
    return name.includes(q) || u.email.toLowerCase().includes(q)
  })

  const prevParams = new URLSearchParams()
  prevParams.set('page', String(currentPage - 1))
  const nextParams = new URLSearchParams()
  nextParams.set('page', String(currentPage + 1))

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search
          className="text-nexus-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          aria-label="Buscar usuario"
          className="border-nexus-border bg-nexus-card text-nexus-text placeholder:text-nexus-muted/60 focus:border-nexus-accent focus:ring-nexus-accent/30 w-full rounded-lg border py-2 pr-4 pl-9 text-sm transition-colors focus:ring-2 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-nexus-text text-sm font-medium">
            {search ? 'No se encontraron usuarios' : 'Sin usuarios'}
          </p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-nexus-accent flex items-center gap-1 text-xs hover:underline"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="border-nexus-border overflow-x-auto rounded-xl border">
          <table className="w-full text-sm" aria-label="Lista de usuarios">
            <thead>
              <tr className="border-nexus-border bg-nexus-card border-b">
                {['Usuario', 'Email', 'Roles', 'Verificado', 'Registrado', ''].map((h) => (
                  <th
                    key={h}
                    className="text-nexus-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-nexus-border divide-y">
              {filtered.map((user) => {
                const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Sin nombre'
                const initials =
                  `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '?'

                return (
                  <tr
                    key={user.id}
                    className="bg-nexus-card hover:bg-nexus-accent-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={user.avatarUrl ?? undefined} alt={fullName} />
                          <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-nexus-text font-medium">{fullName}</span>
                      </div>
                    </td>
                    <td className="text-nexus-muted px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
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
                    </td>
                    <td className="px-4 py-3">
                      {user.isVerified ? (
                        <CheckCircle2
                          className="text-nexus-success h-4 w-4"
                          aria-label="Verificado"
                        />
                      ) : (
                        <span className="text-nexus-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="text-nexus-muted px-4 py-3">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className={buttonVariants({
                            variant: 'ghost',
                            size: 'sm',
                            className: 'text-nexus-muted hover:text-nexus-text h-7 px-2 text-xs',
                          })}
                        >
                          Ver perfil
                        </Link>

                        {isAdmin &&
                          user.id !== currentUserId &&
                          !alreadyImpersonating &&
                          (user.roles.includes('ADMIN') ? (
                            <span title="No se puede enmascarar admins" className="inline-flex">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                className="text-nexus-muted pointer-events-none h-7 cursor-not-allowed px-2 text-xs opacity-50"
                                aria-label="No se puede enmascarar admins"
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                                Ver como
                              </Button>
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => impersonate(user.id)}
                              disabled={isImpersonating}
                              className="text-nexus-muted hover:text-nexus-text h-7 px-2 text-xs"
                            >
                              {isImpersonating && pendingUserId === user.id ? (
                                <Loader2
                                  className="mr-1 h-3.5 w-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Eye className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              Ver como
                            </Button>
                          ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Paginación">
          {currentPage > 1 ? (
            <Link
              href={`/admin/users?${prevParams.toString()}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              aria-label="Página anterior"
            >
              ←
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'pointer-events-none opacity-50',
              })}
            >
              ←
            </span>
          )}
          <span className="text-nexus-muted text-sm">
            Página <span className="text-nexus-text font-semibold">{currentPage}</span> de{' '}
            <span className="text-nexus-text font-semibold">{meta.totalPages}</span>
          </span>
          {currentPage < meta.totalPages ? (
            <Link
              href={`/admin/users?${nextParams.toString()}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              aria-label="Página siguiente"
            >
              →
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'pointer-events-none opacity-50',
              })}
            >
              →
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
