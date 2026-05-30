import type { Metadata } from 'next'
import { GraduationCap } from 'lucide-react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { Certificate } from '@/types/models'
import { CertificateCard } from '@/components/features/certificates/CertificateCard'

export const metadata: Metadata = {
  title: 'Mis certificados | NexusLMS',
  description: 'Tus certificados de cursos completados en NexusLMS.',
  openGraph: {
    title: 'Mis certificados | NexusLMS',
    description: 'Tus certificados de cursos completados en NexusLMS.',
    type: 'website',
  },
}

export default async function CertificatesPage() {
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  let certificates: Certificate[] = []
  try {
    const r = await api.get<Certificate[]>('/certificates', { headers })
    certificates = r.data ?? []
  } catch {
    // Render empty state on error
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Mis certificados</h1>
        <p className="text-nexus-muted mt-1 text-sm">
          {certificates.length} certificado{certificates.length !== 1 && 's'} obtenido
          {certificates.length !== 1 && 's'}
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="border-nexus-border flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <div className="bg-nexus-muted/10 flex h-14 w-14 items-center justify-center rounded-full">
            <GraduationCap className="text-nexus-muted h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-nexus-text font-medium">
              Completá un curso para obtener tu certificado
            </p>
            <p className="text-nexus-muted mt-1 text-sm">
              Los certificados se generan al completar todos los módulos de un curso.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  )
}
