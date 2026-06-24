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
    const qs = params.toString()
    router.push(qs ? `/my-courses?${qs}` : '/my-courses')
  }

  return (
    <div
      role="tablist"
      aria-label="Filtrar cursos por estado"
      className="flex items-center gap-1 overflow-x-auto rounded-[14px] p-1"
      style={{ background: 'var(--nexus-bg)' }}
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
              'flex shrink-0 items-center gap-1.5 rounded-[11px] px-3.5 py-2.25 text-[13.5px] font-bold whitespace-nowrap transition-all duration-200',
              isActive
                ? 'bg-nexus-card text-nexus-accent'
                : 'text-nexus-muted hover:text-nexus-text'
            )}
            style={isActive ? { boxShadow: 'rgba(31,30,46,.16) 0px 4px 12px -6px' } : undefined}
          >
            {label}
            <span
              className="flex min-w-[18px] items-center justify-center rounded-full px-[5px] text-[11px] font-extrabold"
              style={{
                height: 18,
                background: isActive ? 'var(--nexus-accent-muted)' : 'var(--nexus-border)',
                color: isActive ? 'var(--nexus-accent)' : 'var(--nexus-muted)',
              }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
