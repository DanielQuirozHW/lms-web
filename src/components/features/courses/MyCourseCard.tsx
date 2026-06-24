'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Award, Check, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useEnrollMutation } from '@/hooks/mutations/enrollments'
import { useGenerateCertificate } from '@/hooks/mutations/certificates'
import { isApiError } from '@/lib/api'
import type { UserEnrollmentItem } from '@/types/models'

const CARD_GRADIENTS = [
  {
    bg: 'linear-gradient(135deg,#8B7CFF,#6D5BF0)',
    chipColor: '#6D5BF0',
    barBg: 'linear-gradient(90deg,#8B7CFF,#6D5BF0)',
  },
  {
    bg: 'linear-gradient(135deg,#34D89E,#10B981)',
    chipColor: '#10B981',
    barBg: 'linear-gradient(90deg,#34D89E,#10B981)',
  },
  {
    bg: 'linear-gradient(135deg,#46C2F0,#0E9FD9)',
    chipColor: '#0E9FD9',
    barBg: 'linear-gradient(90deg,#46C2F0,#0E9FD9)',
  },
  {
    bg: 'linear-gradient(135deg,#FBB54D,#EA8C0C)',
    chipColor: '#EA8C0C',
    barBg: 'linear-gradient(90deg,#FBB54D,#EA8C0C)',
  },
] as const

export interface MyCourseCardProps {
  item: UserEnrollmentItem
  index: number
}

export function MyCourseCard({ item, index }: MyCourseCardProps) {
  const router = useRouter()
  const { mutate: enroll, isPending } = useEnrollMutation()
  const { mutate: generateCert, isPending: isGenerating } = useGenerateCertificate()

  const gradient = CARD_GRADIENTS[index % 4]
  const pct = Math.round(item.progressPercentage ?? 0)
  const isCompleted = item.status === 'COMPLETED'
  const isCancelled = item.status === 'CANCELLED'
  const continuePath = `/courses/${item.courseId}`

  function handleReenroll() {
    enroll(
      { courseId: item.courseId },
      {
        onSuccess: () => {
          toast.success('¡Te reinscribiste exitosamente!')
          router.refresh()
        },
        onError: (error) => {
          if (isApiError(error) && error.response?.data.statusCode === 409) {
            router.refresh()
          } else {
            toast.error('No se pudo reinscribir. Intentá de nuevo.')
          }
        },
      }
    )
  }

  return (
    <article
      className="border-nexus-border bg-nexus-card flex flex-col overflow-hidden rounded-[18px] border"
      style={{ boxShadow: 'var(--nexus-card-shadow)' }}
    >
      {/* Gradient cover */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          height: 118,
          background: gradient.bg,
          filter: isCancelled ? 'grayscale(.55) saturate(.7)' : undefined,
        }}
        aria-hidden="true"
      >
        {/* Decorative circles */}
        <span
          style={{
            position: 'absolute',
            right: -22,
            top: -32,
            width: 118,
            height: 118,
            borderRadius: '50%',
            background: 'rgba(255,255,255,.10)',
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: -28,
            bottom: -44,
            width: 108,
            height: 108,
            borderRadius: '50%',
            background: 'rgba(255,255,255,.08)',
            pointerEvents: 'none',
          }}
        />
        {/* Category chip */}
        {item.categoryName && (
          <span
            className="absolute bottom-[13px] left-4 inline-flex items-center rounded-full px-[11px] py-[5px] text-[11px] font-extrabold"
            style={{ background: 'rgba(255,255,255,.92)', color: gradient.chipColor }}
          >
            {item.categoryName}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="h-2 shrink-0"
        style={{ background: 'var(--nexus-border)' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso: ${pct}%`}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isCompleted ? '#10B981' : gradient.barBg,
          }}
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title */}
        <h3
          className={cn('line-clamp-2 leading-snug font-bold', {
            'text-nexus-muted': isCancelled,
            'text-nexus-text': !isCancelled,
          })}
          style={{ fontSize: 15.5 }}
        >
          {item.courseTitle}
        </h3>

        {/* Category */}
        {item.categoryName && (
          <p className="text-nexus-muted -mt-1.5 truncate text-[12px]">{item.categoryName}</p>
        )}

        {/* Lesson count + percentage */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-nexus-muted text-[12px] font-semibold">
            {item.completedLessons} / {item.totalLessons} lecciones
          </span>
          <span
            className="shrink-0 text-[12px] font-extrabold"
            style={{ color: isCompleted ? '#10B981' : gradient.chipColor }}
          >
            {pct}%
          </span>
        </div>

        <div className="flex-1" />

        {/* ACTIVE — Continuar */}
        {item.status === 'ACTIVE' && (
          <Link
            href={continuePath}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg,#7C6CFF,#6D5BF0)',
              boxShadow: '0 10px 20px -10px rgba(109,91,240,.7)',
            }}
          >
            Continuar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}

        {/* COMPLETED — badge + certificado */}
        {isCompleted && (
          <div className="flex flex-col gap-2">
            <span
              className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold"
              style={{ background: 'rgba(16,185,129,.12)', color: '#10B981' }}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Completado
            </span>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() =>
                generateCert(
                  { enrollmentId: item.enrollmentId },
                  { onSuccess: () => router.push('/certificates') }
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg,#7C6CFF,#6D5BF0)',
                boxShadow: '0 10px 20px -10px rgba(109,91,240,.7)',
              }}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Award className="h-4 w-4" aria-hidden="true" />
              )}
              {isGenerating ? 'Generando...' : 'Ver certificado'}
            </button>
          </div>
        )}

        {/* CANCELLED — Reanudar */}
        {isCancelled && (
          <button
            type="button"
            onClick={handleReenroll}
            disabled={isPending}
            className="border-nexus-border hover:bg-nexus-nav-hover flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-[13.5px] font-bold transition-colors disabled:opacity-60"
            style={{ color: 'var(--nexus-accent)' }}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            )}
            {isPending ? 'Procesando...' : 'Reanudar curso'}
          </button>
        )}
      </div>
    </article>
  )
}
