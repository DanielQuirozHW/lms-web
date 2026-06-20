'use client'

import { cn } from '@/lib/utils'
import { useWeeklyActivity } from '@/hooks/queries/users'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function getTodayIndex(): number {
  const jsDay = new Date().getDay() // 0 = Sunday
  return jsDay === 0 ? 6 : jsDay - 1 // Mon=0 … Sun=6
}

function formatMinutes(total: number): string {
  if (total === 0) return '0 min'
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} m`
}

const BAR_H = 80
const BAR_W = 28
const BAR_GAP = 9
const TOTAL_W = 7 * BAR_W + 6 * BAR_GAP // 250

export function WeeklyActivity() {
  const { data, isLoading } = useWeeklyActivity()
  const todayIndex = getTodayIndex()

  const EMPTY = Array.from({ length: 7 }, () => ({ date: '', lessonsCompleted: 0 }))
  const days = isLoading ? EMPTY : (data?.days ?? EMPTY)
  const timeLabel = isLoading ? '' : formatMinutes(data?.totalMinutesThisWeek ?? 0)

  const maxValue = Math.max(...days.map((d) => d.lessonsCompleted ?? 0), 1)

  return (
    <div
      className="border-nexus-border bg-nexus-card rounded-[18px] border p-5"
      style={{ boxShadow: 'var(--nexus-card-shadow)' }}
    >
      <div className="mb-[18px] flex items-center justify-between">
        <h3 className="text-nexus-text text-base font-extrabold">Actividad semanal</h3>
        {timeLabel && <span className="text-nexus-success text-[13px] font-bold">{timeLabel}</span>}
      </div>

      <svg
        viewBox={`0 0 ${TOTAL_W} ${BAR_H}`}
        width="100%"
        role="img"
        aria-label="Gráfico de actividad semanal"
      >
        {days.map((day, i) => {
          const isToday = i === todayIndex
          const completed = day.lessonsCompleted ?? 0
          const rawH = (completed / maxValue) * BAR_H
          const barH = isLoading ? BAR_H * 0.25 : Math.max(rawH, 4)
          const x = i * (BAR_W + BAR_GAP)
          const y = BAR_H - barH

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={BAR_W}
              height={barH}
              rx={6}
              fill="var(--nexus-accent)"
              opacity={isLoading ? 0.2 : isToday ? 1 : 0.28}
            />
          )
        })}
      </svg>

      <div className="mt-[9px] flex justify-between px-0.5">
        {DAY_LABELS.map((label, i) => (
          <span
            key={i}
            className={cn(
              'w-[28px] text-center text-[11.5px] font-semibold',
              i === todayIndex ? 'text-nexus-accent' : 'text-nexus-faint'
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
