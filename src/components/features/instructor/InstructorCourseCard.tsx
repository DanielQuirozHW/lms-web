'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Users,
  Pencil,
  LayoutList,
  Archive,
  Globe,
  Loader2,
  BarChart2,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { usePublishCourse, useArchiveCourse, useDuplicateCourse } from '@/hooks/mutations/courses'
import type { CourseDetail, CourseStatus } from '@/types/models'

const statusConfig: Record<CourseStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Borrador',
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  PUBLISHED: {
    label: 'Publicado',
    className: 'bg-nexus-success/15 text-nexus-success',
  },
  ARCHIVED: {
    label: 'Archivado',
    className: 'bg-nexus-muted/10 text-nexus-muted',
  },
}

interface InstructorCourseCardProps {
  course: CourseDetail
}

export function InstructorCourseCard({ course }: InstructorCourseCardProps) {
  const router = useRouter()
  const { mutate: publish, isPending: isPublishing } = usePublishCourse(course.id)
  const { mutate: archive, isPending: isArchiving } = useArchiveCourse(course.id)
  const { mutate: duplicate, isPending: isDuplicating } = useDuplicateCourse(course.id)
  const [confirmDuplicate, setConfirmDuplicate] = useState(false)

  const status = statusConfig[course.status]

  function handlePublish() {
    publish(undefined, {
      onSuccess: () => {
        toast.success('Curso publicado')
        router.refresh()
      },
      onError: () => toast.error('No se pudo publicar el curso'),
    })
  }

  function handleArchive() {
    archive(undefined, {
      onSuccess: () => {
        toast.success('Curso archivado')
        router.refresh()
      },
      onError: () => toast.error('No se pudo archivar el curso'),
    })
  }

  return (
    <article className="border-nexus-border bg-nexus-card flex flex-col overflow-hidden rounded-xl border">
      {/* Cover */}
      <div className="bg-nexus-bg relative aspect-video overflow-hidden">
        {course.coverUrl ? (
          <Image
            src={course.coverUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="text-nexus-muted/30 h-10 w-10" aria-hidden="true" />
          </div>
        )}
        {/* Status badge */}
        <span
          className={cn(
            'absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-nexus-text line-clamp-2 text-sm leading-snug font-semibold">
            {course.title}
          </h3>
          <p className="text-nexus-text mt-1 text-sm font-semibold">
            {course.price === null ? (
              <span className="text-nexus-success">Gratis</span>
            ) : (
              formatPrice(course.price)
            )}
          </p>
        </div>

        {/* Stats row */}
        <div className="text-nexus-muted flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {course.enrollmentsCount ?? 0} estudiantes
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {course.lessonsCount ?? 0} lecciones
          </span>
        </div>

        <div className="flex-1" />

        {/* Navigation actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/instructor/courses/${course.id}/edit`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'border-nexus-border text-nexus-muted hover:text-nexus-text flex items-center gap-1.5',
            })}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Editar
          </Link>
          <Link
            href={`/instructor/courses/${course.id}/modules`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'border-nexus-border text-nexus-muted hover:text-nexus-text flex items-center gap-1.5',
            })}
          >
            <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
            Módulos
          </Link>
          <Link
            href={`/instructor/courses/${course.id}/analytics`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'border-nexus-border text-nexus-muted hover:text-nexus-text flex items-center gap-1.5',
            })}
          >
            <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
            Analíticas
          </Link>

          {/* Duplicate — disabled for archived courses */}
          {confirmDuplicate ? (
            <div className="border-nexus-border flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs">
              <button
                type="button"
                onClick={() => duplicate()}
                disabled={isDuplicating}
                className="text-nexus-accent hover:text-nexus-accent-hover font-medium transition-colors disabled:opacity-50"
              >
                {isDuplicating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  'Confirmar'
                )}
              </button>
              <span className="text-nexus-muted">/</span>
              <button
                type="button"
                onClick={() => setConfirmDuplicate(false)}
                className="text-nexus-muted hover:text-nexus-text transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDuplicate(true)}
              disabled={course.status === 'ARCHIVED'}
              title={
                course.status === 'ARCHIVED' ? 'No se puede duplicar un curso archivado' : undefined
              }
              className="border-nexus-border text-nexus-muted hover:text-nexus-text flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Duplicar
            </Button>
          )}
        </div>

        {/* Quick status action */}
        {course.status === 'DRAFT' && (
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white"
          >
            {isPublishing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Globe className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isPublishing ? 'Publicando...' : 'Publicar'}
          </Button>
        )}

        {course.status === 'PUBLISHED' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleArchive}
            disabled={isArchiving}
            className="border-nexus-border text-nexus-muted hover:text-nexus-text w-full"
          >
            {isArchiving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Archive className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isArchiving ? 'Archivando...' : 'Archivar'}
          </Button>
        )}
      </div>
    </article>
  )
}
