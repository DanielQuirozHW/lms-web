'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Award, BookOpen, Check, Loader2, RotateCcw } from 'lucide-react'
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
  const isActive = item.status === 'ACTIVE'
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
      className="bg-nexus-card flex flex-col overflow-hidden rounded-[18px]"
      style={{
        border: '1px solid var(--nexus-border)',
        boxShadow: 'var(--nexus-card-shadow)',
        cursor: 'pointer',
      }}
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

        {/* Large icon container */}
        <span
          style={{
            position: 'absolute',
            left: 16,
            top: 16,
            width: 46,
            height: 46,
            borderRadius: 13,
            background: 'rgba(255,255,255,.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <BookOpen style={{ width: 22, height: 22 }} />
        </span>

        {/* Category chip */}
        {item.categoryName && (
          <span
            className="absolute bottom-[13px] left-4 inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[11px] font-extrabold"
            style={{ background: 'rgba(255,255,255,.92)', color: gradient.chipColor }}
          >
            {item.categoryName}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col" style={{ padding: '15px 16px 16px', gap: 12 }}>
        {/* Title */}
        <h3
          className={cn('line-clamp-2 leading-[1.28] font-extrabold tracking-[-0.01em]', {
            'text-nexus-faint': isCancelled,
            'text-nexus-text': !isCancelled,
          })}
          style={{ fontSize: 16, minHeight: 41 }}
        >
          {item.courseTitle}
        </h3>

        {/* ACTIVE: progress section */}
        {isActive && (
          <div className="flex flex-col" style={{ gap: 7, marginTop: 1 }}>
            <div
              className="flex items-center justify-between font-semibold"
              style={{ fontSize: 12, color: 'var(--nexus-muted)' }}
            >
              <span>
                {item.completedLessons} / {item.totalLessons} lecciones
              </span>
              <span className="font-extrabold" style={{ color: 'var(--nexus-text)' }}>
                {pct}%
              </span>
            </div>
            <div
              className="overflow-hidden"
              style={{
                height: 8,
                borderRadius: 99,
                background: 'var(--nexus-progress-track)',
              }}
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
                  borderRadius: 99,
                  background: gradient.barBg,
                }}
              />
            </div>
          </div>
        )}

        {/* COMPLETED: status section */}
        {isCompleted && (
          <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 1 }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold"
              style={{ background: 'var(--nexus-green-bg)', color: 'var(--nexus-green)' }}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Completado
            </span>
          </div>
        )}

        {/* CANCELLED: status section */}
        {isCancelled && (
          <div className="flex flex-col" style={{ gap: 7, marginTop: 1 }}>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold"
                style={{
                  background: 'var(--nexus-progress-track)',
                  color: 'var(--nexus-faint)',
                }}
              >
                Cancelado
              </span>
            </div>
            <span className="font-semibold" style={{ fontSize: 12, color: 'var(--nexus-muted)' }}>
              Quedaste en {pct}%
            </span>
            <div
              className="overflow-hidden"
              style={{
                height: 6,
                borderRadius: 99,
                background: 'var(--nexus-progress-track)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 99,
                  background: 'var(--nexus-muted)',
                  opacity: 0.6,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* ACTIVE — Continuar */}
        {isActive && (
          <Link
            href={continuePath}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
            style={{
              padding: 11,
              background: 'linear-gradient(135deg,#7C6CFF,#6D5BF0)',
              boxShadow: '0 10px 20px -10px rgba(109,91,240,.7)',
            }}
          >
            Continuar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}

        {/* COMPLETED — two buttons: cert + ghost repasar */}
        {isCompleted && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() =>
                generateCert(
                  { enrollmentId: item.enrollmentId },
                  { onSuccess: () => router.push('/certificates') }
                )
              }
              className="flex flex-1 items-center justify-center gap-[7px] rounded-[12px] text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                padding: 11,
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
            <Link
              href={continuePath}
              className="flex shrink-0 items-center justify-center rounded-[12px] transition-opacity hover:opacity-80"
              style={{
                width: 44,
                padding: 11,
                border: '1px solid var(--nexus-border)',
                background: 'transparent',
                color: 'var(--nexus-muted)',
              }}
              title="Repasar curso"
              aria-label="Repasar curso"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {/* CANCELLED — Reanudar */}
        {isCancelled && (
          <button
            type="button"
            onClick={handleReenroll}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] text-[13.5px] font-bold transition-opacity hover:opacity-80 disabled:opacity-60"
            style={{
              padding: 11,
              border: '1px solid var(--nexus-border)',
              background: 'transparent',
              color: 'var(--nexus-accent)',
            }}
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
