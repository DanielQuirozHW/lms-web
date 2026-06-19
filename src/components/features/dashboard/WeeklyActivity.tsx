'use client'

import { useWeeklyActivity } from '@/hooks/queries/users'

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getTodayIndex(): number {
  const jsDay = new Date().getDay() // 0 = Sunday
  return jsDay === 0 ? 6 : jsDay - 1 // Mon=0 … Sun=6
}

const BAR_H = 72
const LABEL_H = 18
const BAR_W = 28
const BAR_GAP = 12
const TOTAL_W = 7 * BAR_W + 6 * BAR_GAP // 244
const TOTAL_H = BAR_H + LABEL_H + 6

export function WeeklyActivity() {
  const { data, isLoading } = useWeeklyActivity()
  const todayIndex = getTodayIndex()

  const EMPTY = Array.from({ length: 7 }, () => ({ date: '', lessonsCompleted: 0 }))
  const days = isLoading ? EMPTY : (data?.days ?? EMPTY)

  const maxValue = Math.max(...days.map((d) => d.lessonsCompleted ?? 0), 1)

  return (
    <div className="bg-nexus-card border-nexus-border rounded-xl border p-5">
      <h3 className="text-nexus-text mb-4 text-sm font-semibold">Actividad semanal</h3>
      <svg
        viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
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
            <g key={i} opacity={isLoading ? 0.25 : 1}>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={6}
                fill={isToday ? 'var(--nexus-accent)' : 'var(--nexus-accent-muted)'}
              />
              {completed > 0 && !isLoading && (
                <text
                  x={x + BAR_W / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill={isToday ? 'var(--nexus-accent)' : 'var(--nexus-muted)'}
                  fontFamily="var(--font-plus-jakarta-sans)"
                  fontWeight={600}
                >
                  {completed}
                </text>
              )}
              <text
                x={x + BAR_W / 2}
                y={BAR_H + LABEL_H + 2}
                textAnchor="middle"
                fontSize={10}
                fill={isToday ? 'var(--nexus-accent)' : 'var(--nexus-muted)'}
                fontFamily="var(--font-plus-jakarta-sans)"
                fontWeight={isToday ? 700 : 500}
              >
                {DAY_LABELS[i]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
