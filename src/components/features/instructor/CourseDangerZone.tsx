'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Archive, Trash2, Loader2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { usePublishCourse, useArchiveCourse, useDeleteCourse } from '@/hooks/mutations/courses'
import type { CourseStatus } from '@/types/models'

interface CourseDangerZoneProps {
  courseId: string
  courseStatus: CourseStatus
  courseTitle: string
}

export function CourseDangerZone({ courseId, courseStatus, courseTitle }: CourseDangerZoneProps) {
  const router = useRouter()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const { mutate: publish, isPending: isPublishing } = usePublishCourse(courseId)
  const { mutate: archive, isPending: isArchiving } = useArchiveCourse(courseId)
  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse()

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

  function handleDelete() {
    deleteCourse(courseId, {
      onSuccess: () => {
        toast.success('Curso eliminado')
        router.push('/instructor/courses')
      },
      onError: () => toast.error('No se pudo eliminar el curso'),
    })
  }

  return (
    <>
      <section
        className="border-destructive/30 rounded-xl border p-6"
        aria-labelledby="danger-zone-heading"
      >
        <h2 id="danger-zone-heading" className="text-destructive mb-1 text-base font-semibold">
          Zona de peligro
        </h2>
        <p className="text-nexus-muted mb-5 text-sm">
          Estas acciones tienen efectos permanentes o afectan la visibilidad del curso.
        </p>

        <div className="flex flex-wrap gap-2">
          {courseStatus === 'DRAFT' && (
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-nexus-success hover:bg-nexus-success/90 text-white"
            >
              {isPublishing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Globe className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              {isPublishing ? 'Publicando...' : 'Publicar curso'}
            </Button>
          )}

          {courseStatus === 'PUBLISHED' && (
            <Button
              variant="outline"
              onClick={handleArchive}
              disabled={isArchiving}
              className="border-nexus-border text-nexus-muted hover:text-nexus-text"
            >
              {isArchiving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Archive className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              {isArchiving ? 'Archivando...' : 'Archivar curso'}
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 ml-auto"
          >
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Eliminar curso
          </Button>
        </div>
      </section>

      {/* Delete confirmation dialog */}
      {isDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-course-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setIsDeleteOpen(false)
          }}
        >
          <div className="border-nexus-border bg-nexus-card w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="bg-destructive/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <TriangleAlert className="text-destructive h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="delete-course-title" className="text-nexus-text text-base font-semibold">
                  ¿Eliminar este curso?
                </h3>
                <p className="text-nexus-muted mt-1 text-sm">
                  <strong className="text-nexus-text">&ldquo;{courseTitle}&rdquo;</strong> será
                  eliminado permanentemente junto con todos sus módulos, lecciones e inscripciones.
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="border-nexus-border text-nexus-muted"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar curso'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
