'use client'

import { useState, useRef } from 'react'
import { Search, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { User } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { userKeys } from '@/hooks/queries/users'
import { UserCoursesManager } from './UserCoursesManager'

interface AssignmentsPanelProps {
  initialUsers: User[]
}

export function AssignmentsPanel({ initialUsers }: AssignmentsPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [...userKeys.all, 'search', debouncedSearch] as const,
    queryFn: () =>
      api
        .get<PaginatedData<User>>('/users', { params: { search: debouncedSearch, limit: 30 } })
        .then((r) => r.data),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30 * 1000,
    placeholderData: undefined,
  })

  const users = debouncedSearch.length >= 2 ? (data?.data ?? []) : initialUsers

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <div className="border-nexus-border flex min-h-[600px] gap-0 overflow-hidden rounded-xl border">
      {/* Left panel — user list */}
      <div className="border-nexus-border bg-nexus-surface flex w-72 shrink-0 flex-col border-r">
        {/* Search */}
        <div className="border-nexus-border border-b p-3">
          <div className="relative">
            <Search
              className="text-nexus-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar usuario..."
              aria-label="Buscar usuario"
              className={cn(
                'border-nexus-border bg-nexus-card text-nexus-text w-full rounded-lg border py-2 pr-3 pl-9 text-sm',
                'placeholder:text-nexus-muted/60',
                'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
                'transition-colors'
              )}
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && debouncedSearch.length >= 2 ? (
            <p className="text-nexus-muted px-3 py-6 text-center text-sm">Buscando...</p>
          ) : users.length === 0 ? (
            <p className="text-nexus-muted px-3 py-6 text-center text-sm">
              No se encontraron usuarios
            </p>
          ) : (
            <ul className="divide-nexus-border divide-y">
              {users.map((user) => {
                const fullName = `${user.firstName} ${user.lastName}`.trim()
                const initials =
                  `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '?'
                const isSelected = selectedUserId === user.id

                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150',
                        isSelected ? 'bg-nexus-accent-muted' : 'hover:bg-nexus-card'
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={user.avatarUrl ?? undefined} alt={fullName} />
                        <AvatarFallback
                          className={cn(
                            'text-xs font-medium',
                            isSelected
                              ? 'bg-nexus-accent text-white'
                              : 'bg-nexus-accent-muted text-nexus-accent'
                          )}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-medium',
                            isSelected ? 'text-nexus-accent' : 'text-nexus-text'
                          )}
                        >
                          {fullName}
                        </p>
                        <p className="text-nexus-muted truncate text-xs">{user.email}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-nexus-border border-t px-3 py-2">
          <p className="text-nexus-faint text-xs">
            {users.length} usuario{users.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Right panel — selected user's courses */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedUser ? (
          <div className="space-y-5">
            {/* Selected user header */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage
                  src={selectedUser.avatarUrl ?? undefined}
                  alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                />
                <AvatarFallback className="bg-nexus-accent-muted text-nexus-accent text-sm font-medium">
                  {`${selectedUser.firstName[0] ?? ''}${selectedUser.lastName[0] ?? ''}`.toUpperCase() ||
                    '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-nexus-text font-semibold">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-nexus-muted text-sm">{selectedUser.email}</p>
              </div>
            </div>
            <UserCoursesManager userId={selectedUser.id} />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="bg-nexus-card flex h-14 w-14 items-center justify-center rounded-full">
              <Users className="text-nexus-muted h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-nexus-text font-medium">Seleccioná un usuario</p>
            <p className="text-nexus-muted max-w-xs text-sm">
              Elegí un usuario de la lista para ver y gestionar sus cursos asignados.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
