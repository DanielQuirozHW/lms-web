'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, BookOpen, CornerDownLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { CatalogCourse } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import { cn } from '@/lib/utils'

const RECENT_KEY = 'nexus_recent_searches'
const MAX_RECENT = 5

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function persistRecent(term: string, current: string[]): void {
  const updated = [term, ...current.filter((s) => s !== term)].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {
    // storage unavailable
  }
}

export function HeaderSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [recentsKey, setRecentsKey] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  // Ctrl+K / Cmd+K — event handler, not setState in body
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Escape — event handler, not setState in body
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setQuery('')
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Click-outside
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // recentsKey increments to force re-read after add/clear
  const recents = useMemo(() => {
    if (typeof window === 'undefined') return []
    return readRecents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentsKey])

  const isSearching = debouncedQuery.length >= 2

  // Search results
  const { data: searchData, isFetching } = useQuery({
    queryKey: ['header-search', debouncedQuery],
    queryFn: () =>
      api
        .get<PaginatedData<CatalogCourse>>('/courses', {
          params: { search: debouncedQuery, limit: 5 },
        })
        .then((r) => r.data),
    enabled: isSearching,
    staleTime: 30 * 1000,
  })

  // Suggestions — top courses when idle
  const { data: suggestionsData } = useQuery({
    queryKey: ['header-search-suggestions'],
    queryFn: () =>
      api
        .get<PaginatedData<CatalogCourse>>('/courses', { params: { limit: 3 } })
        .then((r) => r.data),
    enabled: open && !isSearching,
    staleTime: 5 * 60 * 1000,
  })

  const searchResults = isSearching ? (searchData?.data ?? []) : []
  const suggestions = !isSearching ? (suggestionsData?.data ?? []) : []

  function handleSelectCourse(course: CatalogCourse) {
    persistRecent(course.title, recents)
    setRecentsKey((k) => k + 1)
    setQuery('')
    setOpen(false)
    router.push(`/courses/${course.slug}`)
  }

  function handleSelectRecent(term: string) {
    setQuery(term)
    inputRef.current?.focus()
  }

  function handleClearRecents() {
    try {
      localStorage.removeItem(RECENT_KEY)
    } catch {
      // ignore
    }
    setRecentsKey((k) => k + 1)
  }

  return (
    <div ref={wrapperRef} className="relative hidden lg:block">
      {/* Search box */}
      <div
        className={cn(
          'flex h-10.5 w-70 items-center gap-2.25 rounded-[13px] border px-3.5 transition-all duration-150',
          open ? 'border-nexus-accent bg-nexus-card' : 'bg-nexus-search-bg border-transparent'
        )}
        style={open ? { boxShadow: '0 0 0 3px var(--nexus-accent-muted)' } : undefined}
      >
        <Search className="text-nexus-muted h-4.75 w-4.75 shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Buscar cursos…"
          className="text-nexus-text placeholder:text-nexus-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
          role="combobox"
          aria-label="Buscar cursos"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls="header-search-listbox"
          aria-autocomplete="list"
        />
        <kbd className="border-nexus-border bg-nexus-surface text-nexus-muted rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold">
          ⌘K
        </kbd>
      </div>

      {/* Inline dropdown */}
      {open && (
        <div
          id="header-search-listbox"
          className="bg-nexus-card border-nexus-border absolute top-[calc(100%+12px)] left-0 z-60 w-95 overflow-hidden rounded-[18px] border"
          style={{ boxShadow: 'var(--nexus-menu-shadow)' }}
          role="listbox"
          aria-label="Resultados de búsqueda"
        >
          {!isSearching && (
            <>
              {/* Recent searches */}
              {recents.length > 0 && (
                <div className="px-4 pt-3.5 pb-2">
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-nexus-faint text-[11px] font-bold tracking-widest uppercase">
                      Búsquedas recientes
                    </p>
                    <button
                      type="button"
                      onClick={handleClearRecents}
                      className="text-nexus-muted hover:text-nexus-text text-[12px] font-medium transition-colors"
                    >
                      Borrar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recents.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSelectRecent(term)}
                        className="border-nexus-border bg-nexus-search-bg text-nexus-text hover:border-nexus-accent hover:text-nexus-accent flex items-center gap-1.5 rounded-full border px-3 py-1.75 text-[13px] font-semibold transition-colors"
                      >
                        <Clock className="h-3.25 w-3.25 shrink-0" aria-hidden="true" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="px-2 pt-1 pb-3">
                  <p className="text-nexus-faint mb-1.5 px-2 pt-2 text-[11px] font-bold tracking-widest uppercase">
                    Sugerencias
                  </p>
                  {suggestions.map((course) => (
                    <CourseResultRow
                      key={course.id}
                      course={course}
                      onSelect={handleSelectCourse}
                    />
                  ))}
                </div>
              )}

              {recents.length === 0 && suggestions.length === 0 && (
                <p className="text-nexus-muted px-4 py-6 text-center text-sm">
                  Escribe para buscar cursos
                </p>
              )}
            </>
          )}

          {isSearching && (
            <div className="px-2 pt-3.5 pb-3">
              <p className="text-nexus-faint mb-1.5 px-2 pb-1 text-[11px] font-bold tracking-widest uppercase">
                Cursos
              </p>
              {isFetching && (
                <p className="text-nexus-muted px-2 py-4 text-center text-sm">Buscando...</p>
              )}
              {!isFetching && searchResults.length === 0 && (
                <p className="text-nexus-muted px-2 py-4 text-center text-sm">
                  Sin resultados para &ldquo;{debouncedQuery}&rdquo;
                </p>
              )}
              {searchResults.map((course) => (
                <CourseResultRow key={course.id} course={course} onSelect={handleSelectCourse} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CourseResultRow({
  course,
  onSelect,
}: {
  course: CatalogCourse
  onSelect: (c: CatalogCourse) => void
}) {
  const categoryLabel = course.category?.name ?? null

  return (
    <button
      type="button"
      role="option"
      aria-selected={false}
      onClick={() => onSelect(course)}
      className="hover:bg-nexus-menu-hover flex w-full items-center gap-3 rounded-[11px] p-2.5 text-left transition-colors"
    >
      <span className="bg-nexus-accent-muted text-nexus-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]">
        <BookOpen className="h-4.75 w-4.75" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-nexus-text truncate text-[14px] font-bold">{course.title}</p>
        <p className="text-nexus-muted mt-px text-[12px]">
          Curso{categoryLabel ? ` · ${categoryLabel}` : ''}
        </p>
      </div>
      <CornerDownLeft className="text-nexus-faint h-4 w-4 shrink-0" aria-hidden="true" />
    </button>
  )
}
