'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Users, TrendingUp, Trophy, Star } from 'lucide-react'
import type { EnrollmentDetail, StudentGrade, RatingSummary } from '@/types/models'
import type { ModuleWithLessons } from '@/hooks/queries/modules'

// ─── Color palette (dark-mode safe hex values) ────────────────────────────────

const ACCENT = '#4A7FD4'
const MUTED = '#6b7280'
const BORDER = '#374151'
const SUCCESS = '#14b8a6'
const RED = '#ef4444'
const AMBER = '#f59e0b'

// ─── Data helpers ─────────────────────────────────────────────────────────────

function computeModuleFunnel(
  enrollments: EnrollmentDetail[],
  modules: ModuleWithLessons[]
): { name: string; pct: number }[] {
  if (enrollments.length === 0 || modules.length === 0) return []

  // Cumulative lesson thresholds per module (sequential completion assumption)
  const thresholds = modules.map((_, i) =>
    modules.slice(0, i + 1).reduce((sum, m) => sum + m.lessons.length, 0)
  )

  return modules.map((module, i) => ({
    name: module.title.length > 18 ? `${module.title.slice(0, 16)}…` : module.title,
    pct: Math.round(
      (enrollments.filter((e) => e.progress.completedLessons >= thresholds[i]).length /
        enrollments.length) *
        100
    ),
  }))
}

function computeGradeDistribution(
  enrollments: EnrollmentDetail[],
  studentGrades: StudentGrade[]
): { name: string; count: number; min: number }[] {
  // Prefer per-student gradebook grades; fall back to enrollment.progress.finalGrade
  const gradeMap = new Map(studentGrades.map((g) => [g.enrollmentId, g.finalGrade]))
  const grades = enrollments
    .map((e) => gradeMap.get(e.id) ?? e.progress.finalGrade)
    .filter((g): g is number => g !== null)

  const ranges = [
    { name: '0–20', min: 0, max: 20 },
    { name: '21–40', min: 21, max: 40 },
    { name: '41–60', min: 41, max: 60 },
    { name: '61–80', min: 61, max: 80 },
    { name: '81–100', min: 81, max: 100 },
  ]

  return ranges.map(({ name, min, max }) => ({
    name,
    min,
    count: grades.filter((g) => g >= min && g <= max).length,
  }))
}

function computeEnrollmentOverTime(
  enrollments: EnrollmentDetail[]
): { date: string; count: number }[] {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d
  })

  return days.map((day) => {
    const dayStr = day.toISOString().split('T')[0]
    const label = `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`
    return {
      date: label,
      count: enrollments.filter((e) => {
        const enrolledDay = e.enrolledAt.split('T')[0]
        return enrolledDay !== undefined && enrolledDay <= dayStr
      }).length,
    }
  })
}

// ─── Overview cards ────────────────────────────────────────────────────────────

interface OverviewCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
}

function OverviewCard({ label, value, sub, icon }: OverviewCardProps) {
  return (
    <div className="border-nexus-border bg-nexus-card flex items-start gap-4 rounded-xl border p-5">
      <div className="bg-nexus-accent/10 rounded-lg p-2.5">{icon}</div>
      <div>
        <p className="text-nexus-muted text-sm">{label}</p>
        <p className="text-nexus-text text-2xl font-bold">{value}</p>
        {sub && <p className="text-nexus-muted text-xs">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-nexus-border bg-nexus-card rounded-xl border p-5">
      <h2 className="text-nexus-text mb-4 text-base font-semibold">{title}</h2>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface CourseAnalyticsProps {
  enrollments: EnrollmentDetail[]
  gradebookData: StudentGrade[]
  ratingSummary: RatingSummary | null
  modules: ModuleWithLessons[]
}

export function CourseAnalytics({
  enrollments,
  gradebookData,
  ratingSummary,
  modules,
}: CourseAnalyticsProps) {
  // ── Overview card values ───────────────────────────────────────────────────
  const totalStudents = enrollments.length
  const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length
  const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0

  const gradesWithValue = enrollments
    .map((e) => e.progress.finalGrade)
    .filter((g): g is number => g !== null)
  const avgGrade =
    gradesWithValue.length > 0
      ? Math.round(gradesWithValue.reduce((s, v) => s + v, 0) / gradesWithValue.length)
      : null

  const avgRating = ratingSummary ? ratingSummary.averageScore.toFixed(1) : null
  const ratingScale =
    ratingSummary?.scale === 'STARS_5'
      ? '/ 5'
      : ratingSummary?.scale === 'NUMERIC_10'
        ? '/ 10'
        : '/ 100'

  // ── Chart data — memoized to avoid O(n) recomputation on every render ───────
  const funnelData = useMemo(
    () => computeModuleFunnel(enrollments, modules),
    [enrollments, modules]
  )
  const gradeDistData = useMemo(
    () => computeGradeDistribution(enrollments, gradebookData),
    [enrollments, gradebookData]
  )
  const overTimeData = useMemo(() => computeEnrollmentOverTime(enrollments), [enrollments])

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: `1px solid ${BORDER}`,
    borderRadius: '8px',
    color: '#f9fafb',
    fontSize: 12,
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <OverviewCard
          label="Total estudiantes"
          value={String(totalStudents)}
          icon={<Users className="text-nexus-accent h-5 w-5" aria-hidden="true" />}
        />
        <OverviewCard
          label="Tasa de finalización"
          value={`${completionRate}%`}
          sub={`${completedCount} completados`}
          icon={<TrendingUp className="text-nexus-success h-5 w-5" aria-hidden="true" />}
        />
        <OverviewCard
          label="Promedio de notas"
          value={avgGrade !== null ? `${avgGrade}%` : '—'}
          sub={gradesWithValue.length > 0 ? `${gradesWithValue.length} calificados` : undefined}
          icon={<Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />}
        />
        <OverviewCard
          label="Calificación promedio"
          value={avgRating ? `${avgRating} ${ratingScale}` : '—'}
          sub={ratingSummary ? `${ratingSummary.totalRatings} valoraciones` : undefined}
          icon={<Star className="h-5 w-5 text-amber-400" aria-hidden="true" />}
        />
      </div>

      {/* Completion funnel + Grade distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSection title="Progreso por módulo">
          {funnelData.length === 0 ? (
            <p className="text-nexus-muted py-12 text-center text-sm">Sin datos disponibles</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} margin={{ top: 5, right: 5, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown) => [`${value as number}%`, 'Completaron']}
                  cursor={{ fill: 'rgba(74,127,212,0.08)' }}
                />
                <Bar dataKey="pct" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartSection>

        <ChartSection title="Distribución de calificaciones">
          {gradesWithValue.length === 0 ? (
            <p className="text-nexus-muted py-12 text-center text-sm">Sin datos disponibles</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown) => [value as number, 'Estudiantes']}
                  cursor={{ fill: 'rgba(74,127,212,0.08)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {gradeDistData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.min < 60 ? RED : entry.min < 80 ? AMBER : SUCCESS}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartSection>
      </div>

      {/* Enrollment over time */}
      <ChartSection title="Inscripciones en los últimos 30 días">
        {totalStudents === 0 ? (
          <p className="text-nexus-muted py-12 text-center text-sm">Sin inscripciones aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overTimeData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 11 }} interval={4} />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: unknown) => [value as number, 'Inscriptos acumulados']}
                cursor={{ stroke: ACCENT, strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={ACCENT}
                strokeWidth={2}
                dot={{ fill: ACCENT, r: 3 }}
                activeDot={{ r: 5, fill: ACCENT }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartSection>
    </div>
  )
}
