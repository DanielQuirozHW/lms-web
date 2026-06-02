'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/models'
import { isMarketplace } from '@/lib/config'

interface CoursesFilterProps {
  categories: Category[]
}

const ENROLLMENT_TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'FREE', label: 'Gratuitos' },
  { value: 'PAID', label: 'Pagos' },
  { value: 'CODE', label: 'Con código' },
  { value: 'ASSIGNED', label: 'Asignados' },
] as const

export function CoursesFilter({ categories }: CoursesFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategoryId = searchParams.get('categoryId') ?? ''
  const activeEnrollmentType = searchParams.get('enrollmentType') ?? ''
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(
    updates: Partial<{
      categoryId: string
      search: string
      page: string
      enrollmentType: string
    }>
  ) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if ('categoryId' in updates) {
      if (updates.categoryId) params.set('categoryId', updates.categoryId)
      else params.delete('categoryId')
    }
    if ('search' in updates) {
      if (updates.search) params.set('search', updates.search)
      else params.delete('search')
    }
    if ('enrollmentType' in updates) {
      if (updates.enrollmentType) params.set('enrollmentType', updates.enrollmentType)
      else params.delete('enrollmentType')
    }

    const qs = params.toString()
    return qs ? `/courses?${qs}` : '/courses'
  }

  function handleCategory(categoryId: string) {
    router.push(buildUrl({ categoryId }))
  }

  function handleEnrollmentType(type: string) {
    router.push(buildUrl({ enrollmentType: type }))
  }

  function handleSearch(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.replace(buildUrl({ search: value }))
    }, 300)
  }

  function clearSearch() {
    setSearchInput('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.replace(buildUrl({ search: '' }))
  }

  const pillClass = (active: boolean) =>
    cn(
      'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
      active
        ? 'bg-nexus-accent text-white'
        : 'border-nexus-border bg-nexus-card text-nexus-muted hover:border-nexus-accent hover:text-nexus-accent border'
    )

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

      {/* Category pills */}
      {categories.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Filtrar por categoría"
        >
          <button
            type="button"
            onClick={() => handleCategory('')}
            className={pillClass(activeCategoryId === '')}
            aria-pressed={activeCategoryId === ''}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategory(cat.id)}
              className={pillClass(activeCategoryId === cat.id)}
              aria-pressed={activeCategoryId === cat.id}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Enrollment type pills — marketplace only */}
      {isMarketplace && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Filtrar por tipo de inscripción"
        >
          {ENROLLMENT_TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleEnrollmentType(value)}
              className={pillClass(activeEnrollmentType === value)}
              aria-pressed={activeEnrollmentType === value}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
