'use client'

import type { LucideIcon } from 'lucide-react'
import { BookOpen, CheckCircle2, Award, Flame } from 'lucide-react'
import { useMyEnrollments } from '@/hooks/queries/users'
import { useStreakStats } from '@/hooks/queries/users'
import { useCertificates } from '@/hooks/queries/certificates'

interface StatCardProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: string | number
  label: string
  loading?: boolean
}

function StatCard({ icon: Icon, iconBg, iconColor, value, label, loading }: StatCardProps) {
  return (
    <div
      className="bg-nexus-card border-nexus-border flex flex-col gap-3 rounded-[18px] border p-5"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}
    >
      <div
        className="flex h-[42px] w-[42px] items-center justify-center rounded-[12px]"
        style={{ background: iconBg }}
      >
        <Icon className="h-5 w-5" style={{ color: iconColor }} aria-hidden="true" />
      </div>
      {loading ? (
        <div className="animate-pulse space-y-1.5">
          <div className="bg-nexus-border h-7 w-12 rounded-md" />
          <div className="bg-nexus-border h-3.5 w-20 rounded" />
        </div>
      ) : (
        <>
          <p className="text-nexus-text text-[28px] leading-none font-extrabold tracking-[-0.02em]">
            {value}
          </p>
          <p className="text-nexus-muted text-[13px] font-medium">{label}</p>
        </>
      )}
    </div>
  )
}

export function ProfileStatsGrid() {
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useMyEnrollments()
  const { data: streakData, isLoading: streakLoading } = useStreakStats()
  const { data: certificates, isLoading: certsLoading } = useCertificates()

  const enrollments = enrollmentsData?.data ?? []
  const inProgress = enrollments.filter((e) => e.status === 'ACTIVE').length
  const completed = enrollments.filter((e) => e.status === 'COMPLETED').length
  const certCount = certificates?.length ?? 0
  const streak = streakData?.currentStreak ?? 0

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={BookOpen}
        iconBg="rgba(124,108,255,.14)"
        iconColor="var(--nexus-accent)"
        value={inProgress}
        label="Cursos en progreso"
        loading={enrollmentsLoading}
      />
      <StatCard
        icon={CheckCircle2}
        iconBg="rgba(16,185,129,.12)"
        iconColor="#10B981"
        value={completed}
        label="Cursos completados"
        loading={enrollmentsLoading}
      />
      <StatCard
        icon={Award}
        iconBg="rgba(234,140,12,.12)"
        iconColor="#EA8C0C"
        value={certCount}
        label="Certificados"
        loading={certsLoading}
      />
      <StatCard
        icon={Flame}
        iconBg="rgba(242,100,60,.14)"
        iconColor="#F2643C"
        value={streak}
        label="Racha actual (días)"
        loading={streakLoading}
      />
    </div>
  )
}
