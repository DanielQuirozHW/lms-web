'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/models'

interface CoursesFilterProps {
  categories: Category[]
}

export function CoursesFilter({ categories }: CoursesFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategoryId = searchParams.get('categoryId') ?? ''
  // Local state only for the input's "draft" value while the user is typing.
  // The URL (via useSearchParams) is the real source of truth.
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(updates: Partial<{ categoryId: string; search: string; page: string }>) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page') // reset to page 1 on any filter change

    if ('categoryId' in updates) {
      if (updates.categoryId) params.set('categoryId', updates.categoryId)
      else params.delete('categoryId')
    }
    if ('search' in updates) {
      if (updates.search) params.set('search', updates.search)
      else params.delete('search')
    }

    const qs = params.toString()
    return qs ? `/courses?${qs}` : '/courses'
  }

  function handleCategory(categoryId: string) {
    router.push(buildUrl({ categoryId }))
  }

  function handleSearch(value: string) {
    setSearchInput(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      // Use replace so rapid keystrokes don't stack history entries
      router.replace(buildUrl({ search: value }))
    }, 300)
  }

  function clearSearch() {
    setSearchInput('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.replace(buildUrl({ search: '' }))
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search
          className="text-nexus-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar cursos..."
          aria-label="Buscar cursos"
          className={cn(
            'border-nexus-border bg-nexus-card w-full rounded-lg border py-2 pr-9 pl-9',
            'text-nexus-text placeholder:text-nexus-muted/60 text-sm',
            'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
            'transition-colors'
          )}
        />
        {searchInput && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Limpiar búsqueda"
            className="text-nexus-muted hover:text-nexus-text absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category pills — horizontally scrollable */}
      {categories.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Filtrar por categoría"
        >
          <button
            type="button"
            onClick={() => handleCategory('')}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeCategoryId === ''
                ? 'bg-nexus-accent text-white'
                : 'border-nexus-border bg-nexus-card text-nexus-muted hover:border-nexus-accent hover:text-nexus-accent border'
            )}
            aria-pressed={activeCategoryId === ''}
          >
            Todos
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategory(cat.id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeCategoryId === cat.id
                  ? 'bg-nexus-accent text-white'
                  : 'border-nexus-border bg-nexus-card text-nexus-muted hover:border-nexus-accent hover:text-nexus-accent border'
              )}
              aria-pressed={activeCategoryId === cat.id}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
