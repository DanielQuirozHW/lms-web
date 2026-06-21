'use client'

import { useActivityHeatmap, useStreakStats } from '@/hooks/queries/users'
import type { ActivityHeatmapDay } from '@/types/models'

function getCellBg(level: 0 | 1 | 2 | 3): string {
  switch (level) {
    case 1:
      return 'rgba(124,108,255,.35)'
    case 2:
      return 'rgba(124,108,255,.60)'
    case 3:
      return 'var(--nexus-accent)'
    default:
      return 'var(--nexus-progress-track)'
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
      className="bg-nexus-card border-nexus-border rounded-[18px] border p-[22px]"
      style={{ boxShadow: 'var(--nexus-card-shadow)' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--nexus-text)' }}>Constancia</div>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--nexus-faint)' }}>
          Últimas 12 semanas
        </span>
      </div>

      {heatmapLoading ? (
        <div className="animate-pulse">
          <div className="bg-nexus-border h-[131px] w-full rounded-[10px]" />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 13px)',
            gridAutoFlow: 'column',
            gridTemplateRows: 'repeat(7, 13px)',
            gap: 5,
          }}
        >
          {cells.map((level, i) => (
            <span
              key={i}
              style={{
                width: 13,
                height: 13,
                borderRadius: 4,
                background: getCellBg(level),
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid var(--nexus-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div>
            <div
              style={{ fontWeight: 800, fontSize: 20, color: 'var(--nexus-text)', lineHeight: 1 }}
            >
              {currentStreak}
            </div>
            <div style={{ fontSize: 12, color: 'var(--nexus-faint)', marginTop: 2 }}>
              racha actual
            </div>
          </div>
          <div
            style={{ width: 1, height: 32, background: 'var(--nexus-border)' }}
            aria-hidden="true"
          />
          <div>
            <div
              style={{ fontWeight: 800, fontSize: 20, color: 'var(--nexus-text)', lineHeight: 1 }}
            >
              {longestStreak} días
            </div>
            <div style={{ fontSize: 12, color: 'var(--nexus-faint)', marginTop: 2 }}>
              racha más larga
            </div>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            color: 'var(--nexus-faint)',
          }}
        >
          menos{' '}
          <span style={{ display: 'flex', gap: 3 }}>
            {([0, 1, 2, 3] as const).map((level) => (
              <span
                key={level}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  background: getCellBg(level),
                  display: 'inline-block',
                }}
                aria-hidden="true"
              />
            ))}
          </span>{' '}
          más
        </div>
      </div>
    </div>
  )
}
