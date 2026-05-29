import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { GlobalAnnouncement } from '@/types/models'
import { GlobalAnnouncementManager } from '@/components/features/admin/GlobalAnnouncementManager'

export const metadata: Metadata = {
  title: 'Alertas globales | NexusLMS',
  description: 'Gestión de alertas y anuncios globales de la plataforma.',
  openGraph: {
    title: 'Alertas globales | NexusLMS',
    description: 'Gestión de alertas y anuncios globales de la plataforma.',
    type: 'website',
  },
}

export default async function AdminAnnouncementsPage() {
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  let announcements: GlobalAnnouncement[] = []
  try {
    const r = await api.get<GlobalAnnouncement[]>('/announcements/global', { headers })
    announcements = r.data ?? []
  } catch {
    // Render with empty list on error
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Alertas globales</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          Creá y gestioná anuncios visibles para todos los usuarios.
        </p>
      </div>

      <GlobalAnnouncementManager initialAnnouncements={announcements} />
    </div>
  )
}
