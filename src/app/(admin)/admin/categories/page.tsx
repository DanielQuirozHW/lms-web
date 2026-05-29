import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { Category } from '@/types/models'
import { CategoryManager } from '@/components/features/admin/CategoryManager'

export const metadata: Metadata = { title: 'Categorías | NexusLMS' }

export default async function AdminCategoriesPage() {
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  let categories: Category[] = []
  try {
    const r = await api.get<Category[]>('/categories', { headers })
    categories = r.data
  } catch {
    // Render empty state on error
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Categorías</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          {categories.length} categoría{categories.length !== 1 && 's'} — usadas para clasificar
          cursos
        </p>
      </div>

      <CategoryManager initialCategories={categories} />
    </div>
  )
}
