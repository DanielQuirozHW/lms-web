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
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    const qs = params.toString()
    router.push(qs ? `/my-courses?${qs}` : '/my-courses')
  }

  return (
    <div
      role="tablist"
      aria-label="Filtrar cursos por estado"
      className="flex items-center overflow-x-auto rounded-[14px]"
      style={{ background: 'var(--nexus-search-bg)', padding: 4, gap: 3 }}
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
              'flex shrink-0 items-center rounded-[11px] font-bold whitespace-nowrap transition-all duration-200',
              isActive
                ? 'bg-nexus-card text-nexus-accent'
                : 'text-nexus-muted hover:text-nexus-text bg-transparent'
            )}
            style={{
              gap: 7,
              padding: '9px 15px',
              fontSize: 13.5,
              boxShadow: isActive ? 'rgba(31,30,46,.16) 0px 4px 12px -6px' : undefined,
            }}
          >
            {label}
            <span
              className="flex items-center justify-center rounded-full font-extrabold"
              style={{
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                fontSize: 11,
                background: isActive ? 'var(--nexus-unread-row)' : 'var(--nexus-progress-track)',
                color: isActive ? 'var(--nexus-accent)' : 'var(--nexus-faint)',
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
