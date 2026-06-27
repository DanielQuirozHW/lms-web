'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ArrowDownUp } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recientes' },
  { value: 'progress', label: 'Progreso' },
  { value: 'name', label: 'Nombre (A→Z)' },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]['value']

export function MyCoursesSort() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawSort = searchParams.get('sort') ?? 'recent'
  const activeSort: SortValue = SORT_OPTIONS.some((o) => o.value === rawSort)
    ? (rawSort as SortValue)
    : 'recent'
  const activeLabel = SORT_OPTIONS.find((o) => o.value === activeSort)?.label ?? 'Recientes'

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'recent') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    const qs = params.toString()
    router.push(qs ? `/my-courses?${qs}` : '/my-courses')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center font-bold transition-opacity hover:opacity-80"
        style={{
          gap: 9,
          height: 42,
          padding: '0 15px',
          borderRadius: 13,
          border: '1px solid var(--nexus-border)',
          background: 'var(--nexus-card)',
          fontSize: 13.5,
          color: 'var(--nexus-text)',
          boxShadow: 'var(--nexus-card-shadow)',
          whiteSpace: 'nowrap',
        }}
      >
        <ArrowDownUp style={{ width: 15, height: 15, color: 'var(--nexus-muted)' }} />
        <span>
          Ordenar: <span style={{ color: 'var(--nexus-accent)' }}>{activeLabel}</span>
        </span>
        <ChevronDown
          style={{
            width: 14,
            height: 14,
            color: 'var(--nexus-muted)',
            transform: open ? 'rotate(180deg)' : undefined,
            transition: 'transform .2s',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 overflow-hidden rounded-[13px]"
          style={{
            minWidth: 180,
            background: 'var(--nexus-card)',
            border: '1px solid var(--nexus-border)',
            boxShadow: 'var(--nexus-menu-shadow)',
          }}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSort(value)}
              className="flex w-full items-center px-4 py-2.5 text-left text-[13.5px] font-semibold transition-colors"
              style={{
                color: activeSort === value ? 'var(--nexus-accent)' : 'var(--nexus-text)',
                background: activeSort === value ? 'var(--nexus-accent-muted)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (activeSort !== value) {
                  e.currentTarget.style.background = 'var(--nexus-menu-hover)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  activeSort === value ? 'var(--nexus-accent-muted)' : 'transparent'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
