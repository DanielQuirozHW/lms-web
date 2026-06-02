import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { User } from '@/types/models'
import type { PaginatedData } from '@/types/api'
import { AssignmentsPanel } from '@/components/features/admin/AssignmentsPanel'

export const metadata: Metadata = {
  title: 'Asignaciones | NexusLMS',
  description: 'Asigná cursos a usuarios desde un solo lugar.',
}

export default async function AssignmentsPage() {
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  const result = await api
    .get<PaginatedData<User>>('/users', { params: { limit: 30 }, headers })
    .catch(() => null)

  const initialUsers: User[] = result?.data.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold tracking-tight">Asignaciones</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          Asigná y gestioná cursos por usuario desde un solo lugar
        </p>
      </div>

      <AssignmentsPanel initialUsers={initialUsers} />
    </div>
  )
}
