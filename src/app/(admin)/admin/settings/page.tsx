import type { Metadata } from 'next'
import { MaintenanceToggle } from '@/components/features/admin/MaintenanceToggle'

export const metadata: Metadata = {
  title: 'Configuración | NexusLMS',
  description: 'Configuración general de la plataforma NexusLMS.',
  openGraph: {
    title: 'Configuración | NexusLMS',
    description: 'Configuración general de la plataforma NexusLMS.',
    type: 'website',
  },
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-nexus-text text-2xl font-bold">Configuración</h1>
        <p className="text-nexus-muted mt-1 text-sm">Opciones avanzadas de la plataforma.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-nexus-text text-base font-semibold">Modo mantenimiento</h2>
        <MaintenanceToggle />
      </section>
    </div>
  )
}
