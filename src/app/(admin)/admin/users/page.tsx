import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { User } from '@/types/models'
import type { PaginatedData, PaginationMeta } from '@/types/api'
import { UserTable } from '@/components/features/admin/UserTable'

export const metadata: Metadata = {
  title: 'Usuarios | NexusLMS',
  description: 'Gestión de usuarios de la plataforma NexusLMS.',
  openGraph: {
    title: 'Usuarios | NexusLMS',
    description: 'Gestión de usuarios de la plataforma NexusLMS.',
    type: 'website',
  },
}

const LIMIT = 20

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  let users: User[] = []
  let meta: PaginationMeta = { total: 0, page: 1, limit: LIMIT, totalPages: 1 }

  try {
    const r = await api.get<PaginatedData<User>>('/users', {
      params: { page, limit: LIMIT },
      headers,
    })
    users = r.data.data ?? []
    meta = r.data.meta
  } catch {
    // Render empty state on error
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Usuarios</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          {meta.total} usuario{meta.total !== 1 && 's'} registrado{meta.total !== 1 && 's'}
        </p>
      </div>

      <UserTable users={users} meta={meta} currentPage={page} />
    </div>
  )
}
