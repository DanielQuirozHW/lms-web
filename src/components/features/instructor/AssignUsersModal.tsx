'use client'

import { useState, useRef } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { User } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { userKeys } from '@/hooks/queries/users'
import { useBulkEnroll } from '@/hooks/mutations/enrollments'

interface AssignUsersModalProps {
  courseId: string
  enrolledUserIds: string[]
}

export function AssignUsersModal({ courseId, enrolledUserIds }: AssignUsersModalProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [...userKeys.all, 'search', debouncedSearch] as const,
    queryFn: () =>
      api
        .get<PaginatedData<User>>('/users', { params: { search: debouncedSearch, limit: 20 } })
        .then((r) => r.data),
    enabled: open && debouncedSearch.length >= 2,
    staleTime: 30 * 1000,
  })

  const users = data?.data ?? []

  const { mutate: bulkEnroll, isPending } = useBulkEnroll()

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  function toggleUser(userId: string) {
    if (enrolledUserIds.includes(userId)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  function handleClose() {
    setOpen(false)
    setSearch('')
    setDebouncedSearch('')
    setSelected(new Set())
  }

  function handleAssign() {
    bulkEnroll(
      { userIds: Array.from(selected), courseId },
      {
        onSuccess: () => {
          const count = selected.size
          toast.success(
            `${count} usuario${count !== 1 ? 's' : ''} asignado${count !== 1 ? 's' : ''}`
          )
          handleClose()
        },
        onError: () => toast.error('No se pudo completar la asignación'),
      }
    )
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
        size="sm"
      >
        <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Asignar usuarios
      </Button>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose()
        }}
      >
        <SheetContent
          side="right"
          className="border-nexus-border bg-nexus-surface flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetTitle className="border-nexus-border border-b px-5 py-4 text-base font-semibold">
            Asignar usuarios al curso
          </SheetTitle>

          {/* Search */}
          <div className="border-nexus-border border-b px-4 py-3">
            <div className="relative">
              <Search
                className="text-nexus-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar por nombre o email..."
                aria-label="Buscar usuarios"
                autoFocus
                className={cn(
                  'border-nexus-border bg-nexus-card text-nexus-text w-full rounded-lg border py-2 pr-4 pl-9 text-sm',
                  'placeholder:text-nexus-muted/60',
                  'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
                  'transition-colors'
                )}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {debouncedSearch.length < 2 ? (
              <p className="text-nexus-muted px-4 py-10 text-center text-sm">
                Escribí al menos 2 caracteres para buscar
              </p>
            ) : isLoading ? (
              <p className="text-nexus-muted px-4 py-10 text-center text-sm">Buscando...</p>
            ) : users.length === 0 ? (
              <p className="text-nexus-muted px-4 py-10 text-center text-sm">
                No se encontraron usuarios
              </p>
            ) : (
              <ul className="divide-nexus-border divide-y">
                {users.map((user) => {
                  const alreadyEnrolled = enrolledUserIds.includes(user.id)
                  const isSelected = selected.has(user.id)
                  const fullName = `${user.firstName} ${user.lastName}`.trim()
                  const initials =
                    `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '?'

                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => toggleUser(user.id)}
                        disabled={alreadyEnrolled}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
                          alreadyEnrolled
                            ? 'cursor-default opacity-50'
                            : isSelected
                              ? 'bg-nexus-accent-muted'
                              : 'hover:bg-nexus-card'
                        )}
                      >
                        {/* Checkbox indicator */}
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                            isSelected && !alreadyEnrolled
                              ? 'bg-nexus-accent border-nexus-accent text-white'
                              : 'border-nexus-border-strong'
                          )}
                          aria-hidden="true"
                        >
                          {isSelected && !alreadyEnrolled && (
                            <svg
                              viewBox="0 0 10 8"
                              className="h-2.5 w-2.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 4l2.5 2.5L9 1" />
                            </svg>
                          )}
                        </span>

                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={user.avatarUrl ?? undefined} alt={fullName} />
                          <AvatarFallback className="bg-nexus-accent-muted text-nexus-accent text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="text-nexus-text truncate text-sm font-medium">{fullName}</p>
                          <p className="text-nexus-muted truncate text-xs">{user.email}</p>
                        </div>

                        {alreadyEnrolled && (
                          <span className="text-nexus-muted bg-nexus-card shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                            Ya inscripto
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-nexus-border flex items-center justify-between border-t px-4 py-3">
            <span className="text-nexus-muted text-sm">
              {selected.size > 0
                ? `${selected.size} usuario${selected.size !== 1 ? 's' : ''} seleccionado${selected.size !== 1 ? 's' : ''}`
                : 'Ninguno seleccionado'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="border-nexus-border text-nexus-muted"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={selected.size === 0 || isPending}
                className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
              >
                {isPending ? 'Asignando...' : 'Asignar seleccionados'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
