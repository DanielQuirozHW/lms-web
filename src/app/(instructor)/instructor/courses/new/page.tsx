import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { Category } from '@/types/models'
import { buttonVariants } from '@/components/ui/button'
import { CourseForm } from '@/components/features/instructor/CourseForm'

export const metadata: Metadata = { title: 'Crear curso | NexusLMS' }

export default async function NewCoursePage() {
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  let categories: Category[] = []
  try {
    const r = await api.get<Category[]>('/categories', { headers })
    categories = r.data
  } catch {
    // Render without categories — user can still create the course
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back */}
      <Link
        href="/instructor"
        className={buttonVariants({
          variant: 'ghost',
          size: 'sm',
          className: 'text-nexus-muted hover:text-nexus-text -ml-2 flex items-center gap-1',
        })}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Volver al dashboard
      </Link>

      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Crear curso</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          Completá la información básica para empezar. Podrás agregar módulos y lecciones después.
        </p>
      </div>

      <CourseForm mode="create" categories={categories} />
    </div>
  )
}
