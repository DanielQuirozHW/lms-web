'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface CourseTabCounts {
  all: number
  active: number
  completed: number
  cancelled: number
}

interface MyCoursesFilterProps {
  counts: CourseTabCounts
}

const TABS = [
  { label: 'Todos', value: '' },
  { label: 'En progreso', value: 'ACTIVE' },
  { label: 'Completados', value: 'COMPLETED' },
  { label: 'Cancelados', value: 'CANCELLED' },
] as const

type TabValue = (typeof TABS)[number]['value']

export function MyCoursesFilter({ counts }: MyCoursesFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeStatus = (searchParams.get('status') ?? '') as TabValue

  const countMap: Record<TabValue, number> = {
    '': counts.all,
    ACTIVE: counts.active,
    COMPLETED: counts.completed,
    CANCELLED: counts.cancelled,
  }

  function handleTab(value: string) {
    const params = new URLSearchParams()
    if (value) params.set('status', value)
    // Reset pagination on tab change
    const qs = params.toString()
    router.push(qs ? `/my-courses?${qs}` : '/my-courses')
  }

  return (
    <div
      role="tablist"
      aria-label="Filtrar cursos por estado"
      className="border-nexus-border flex gap-0 overflow-x-auto border-b"
    >
      {TABS.map(({ label, value }) => {
        const isActive = activeStatus === value
        const count = countMap[value]

        return (
          <button
            key={value}
            role="tab"
            type="button"
            onClick={() => handleTab(value)}
            aria-selected={isActive}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-nexus-accent text-nexus-accent'
                : 'text-nexus-muted hover:text-nexus-text border-transparent'
            )}
          >
            {label}
            {count > 0 && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  isActive
                    ? 'bg-nexus-accent/15 text-nexus-accent'
                    : 'bg-nexus-card text-nexus-muted'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
