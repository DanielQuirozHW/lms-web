'use client'

import { useActivityHeatmap, useStreakStats } from '@/hooks/queries/users'
import type { ActivityHeatmapDay } from '@/types/models'

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function getCellBg(level: 0 | 1 | 2 | 3): string {
  switch (level) {
    case 1:
      return 'rgba(124,108,255,.35)'
    case 2:
      return 'rgba(124,108,255,.60)'
    case 3:
      return 'var(--nexus-accent)'
    default:
      return 'var(--nexus-border)'
  }
}

function buildGrid(heatmapData: ActivityHeatmapDay[]): (0 | 1 | 2 | 3)[] {
  const map = new Map<string, 0 | 1 | 2 | 3>()
  for (const d of heatmapData) {
    map.set(d.date, d.level)
  }

  const today = new Date()
  const cells: (0 | 1 | 2 | 3)[] = []

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    cells.push(map.get(iso) ?? 0)
  }

  return cells
}

export function ProfileConsistencyCard() {
  const { data: heatmapData, isLoading: heatmapLoading } = useActivityHeatmap()
  const { data: streakData } = useStreakStats()

  const days: ActivityHeatmapDay[] = heatmapData?.weeks?.flatMap((w) => w.days) ?? []
  const cells = buildGrid(days)
  const currentStreak = streakData?.currentStreak ?? 0
  const longestStreak = streakData?.longestStreak ?? 0

  return (
    <div
      className="bg-nexus-card border-nexus-border flex flex-col gap-5 rounded-[22px] border p-5"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}
    >
      {/* Header */}
      <div>
        <h2 className="text-nexus-text text-[16px] font-extrabold">Constancia</h2>
        <p className="text-nexus-muted mt-0.5 text-[13px]">Actividad de los últimos 3 meses</p>
      </div>

      {heatmapLoading ? (
        <div className="animate-pulse">
          <div className="bg-nexus-border h-32.75 w-full rounded-[10px]" />
        </div>
      ) : (
        <div className="flex gap-3">
          {/* Day labels */}
          <div className="flex shrink-0 flex-col" style={{ gap: '5px', paddingTop: '1px' }}>
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-nexus-faint flex items-center justify-end text-[10px] font-bold"
                style={{ height: '13px', width: '12px' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 13px)',
              gridAutoFlow: 'column',
              gridTemplateRows: 'repeat(7, 13px)',
              gap: '5px',
            }}
          >
            {cells.map((level, i) => (
              <div
                key={i}
                className="rounded-[3px]"
                style={{
                  width: '13px',
                  height: '13px',
                  background: getCellBg(level),
                  transition: 'background .15s',
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-nexus-text text-[20px] font-extrabold">{longestStreak}</span>
            <span className="text-nexus-muted ml-1.5 text-[12px]">días récord</span>
          </div>
          <div>
            <span className="text-nexus-accent text-[20px] font-extrabold">{currentStreak}</span>
            <span className="text-nexus-muted ml-1.5 text-[12px]">racha actual</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5">
          <span className="text-nexus-faint text-[11px]">Menos</span>
          {([0, 1, 2, 3] as const).map((level) => (
            <div
              key={level}
              className="rounded-[3px]"
              style={{ width: '11px', height: '11px', background: getCellBg(level) }}
              aria-hidden="true"
            />
          ))}
          <span className="text-nexus-faint text-[11px]">Más</span>
        </div>
      </div>
    </div>
  )
}
