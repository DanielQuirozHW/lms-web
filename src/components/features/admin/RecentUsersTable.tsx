'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { User, UserRole } from '@/types/models'

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  STUDENT: { label: 'Estudiante', className: 'bg-nexus-muted/10 text-nexus-muted' },
  INSTRUCTOR: { label: 'Instructor', className: 'bg-nexus-accent/15 text-nexus-accent' },
  ADMIN: { label: 'Admin', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
}

interface RecentUsersTableProps {
  users: User[]
}

export function RecentUsersTable({ users }: RecentUsersTableProps) {
  return (
    <div className="border-nexus-border bg-nexus-card rounded-xl border">
      {/* Header */}
      <div className="border-nexus-border flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-nexus-text text-base font-semibold">Usuarios recientes</h2>
        <Link
          href="/admin/users"
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'text-nexus-muted hover:text-nexus-text text-xs',
          })}
        >
          Ver todos →
        </Link>
      </div>

      {users.length === 0 ? (
        <p className="text-nexus-muted px-5 py-8 text-center text-sm">Sin usuarios registrados</p>
      ) : (
        <ul>
          {users.map((user, i) => {
            const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Sin nombre'
            const initials =
              `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '?'

            return (
              <li
                key={user.id}
                className={cn(
                  'flex items-center gap-3 px-5 py-3',
                  i < users.length - 1 && 'border-nexus-border border-b'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={fullName} />
                  <AvatarFallback className="bg-nexus-accent/20 text-nexus-accent text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-nexus-text truncate text-sm font-medium">{fullName}</p>
                  <p className="text-nexus-muted truncate text-xs">{user.email}</p>
                </div>

                <div className="flex shrink-0 flex-wrap justify-end gap-1">
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

                <time
                  dateTime={user.createdAt}
                  className="text-nexus-muted hidden shrink-0 text-xs sm:block"
                  title={user.createdAt}
                >
                  {formatDate(user.createdAt)}
                </time>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
