'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, BookOpen } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { courseKeys } from '@/hooks/queries/courses'
import type { Course } from '@/types/models'
import type { PaginatedData } from '@/types/api'

const RECENT_KEY = 'nexus_recent_searches'
const MAX_RECENT = 5

function readRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeRecentSearch(term: string, current: string[]): void {
  const updated = [term, ...current.filter((s) => s !== term)].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {
    // storage full or unavailable
  }
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  // Increment to force useMemo re-read after add/clear
  const [recentsKey, setRecentsKey] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Debounce — setState is in a setTimeout callback, not synchronously in effect body
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  // Ctrl+K / Cmd+K — called from event listener callback, not synchronously in effect body
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpenChange])

  // Escape — called from event listener callback, not synchronously in effect body
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Focus input when opened — pure DOM side effect, no setState
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  // Recents: derived synchronously from localStorage, no setState in effect
  // recentsKey increments force a re-derive after add or clear
  const recentSearches = useMemo(() => {
    if (!open || typeof window === 'undefined') return []
    return readRecentSearches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recentsKey])

  const isSearching = debouncedQuery.length >= 2

  const { data, isFetching } = useQuery({
    queryKey: courseKeys.list({ search: debouncedQuery }),
    queryFn: () =>
      api
        .get<PaginatedData<Course>>('/courses', { params: { search: debouncedQuery } })
        .then((r) => r.data),
    enabled: isSearching,
    staleTime: 30 * 1000,
  })

  const results = isSearching ? (data?.data ?? []) : []

  // All close paths reset query here (in event handlers, not effects)
  function close() {
    setQuery('')
    onOpenChange(false)
  }

  function handleSelectCourse(course: Course) {
    writeRecentSearch(course.title, recentSearches)
    setRecentsKey((k) => k + 1)
    close()
    router.push(`/courses/${course.id}`)
  }

  function handleSelectRecent(term: string) {
    setQuery(term)
  }

  function clearRecents() {
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch {
      // ignore
    }
    setRecentsKey((k) => k + 1)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-16"
      onClick={close}
    >
      <div
        className="border-nexus-border bg-nexus-card w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Buscar cursos"
        aria-modal="true"
      >
        {/* Input row */}
        <div className="border-nexus-border flex items-center gap-2 border-b px-4 py-3">
          <Search className="text-nexus-muted h-4 w-4 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cursos..."
            className="text-nexus-text placeholder:text-nexus-muted flex-1 bg-transparent text-sm outline-none"
            aria-label="Término de búsqueda"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-nexus-muted hover:text-nexus-text shrink-0"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="border-nexus-border text-nexus-muted hidden rounded border px-1.5 py-0.5 text-xs sm:block">
            ESC
          </kbd>
        </div>

        {/* Results body */}
        <div className="max-h-80 overflow-y-auto py-1">
          {isFetching && isSearching && (
            <p className="text-nexus-muted px-4 py-6 text-center text-sm">Buscando...</p>
          )}

          {!isFetching && isSearching && results.length === 0 && (
            <p className="text-nexus-muted px-4 py-6 text-center text-sm">
              Sin resultados para &ldquo;{debouncedQuery}&rdquo;
            </p>
          )}

          {isSearching && results.length > 0 && (
            <div>
              <p className="text-nexus-muted px-4 pt-2 pb-1 text-xs font-medium tracking-wide uppercase">
                Cursos
              </p>
              {results.slice(0, 6).map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleSelectCourse(course)}
                  className="hover:bg-nexus-surface flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
                >
                  <BookOpen className="text-nexus-accent h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-nexus-text truncate text-sm font-medium">{course.title}</p>
                    {course.description && (
                      <p className="text-nexus-muted truncate text-xs">{course.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isSearching && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 pt-2 pb-1">
                <p className="text-nexus-muted text-xs font-medium tracking-wide uppercase">
                  Recientes
                </p>
                <button
                  type="button"
                  onClick={clearRecents}
                  className="text-nexus-muted hover:text-nexus-text text-xs"
                >
                  Borrar
                </button>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleSelectRecent(term)}
                  className="hover:bg-nexus-surface flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
                >
                  <Clock className="text-nexus-muted h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-nexus-text text-sm">{term}</span>
                </button>
              ))}
            </div>
          )}

          {!isSearching && recentSearches.length === 0 && (
            <p className="text-nexus-muted px-4 py-6 text-center text-sm">
              Escribe para buscar cursos
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
