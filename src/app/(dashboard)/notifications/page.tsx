import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notificaciones | NexusLMS',
  description: 'Tus notificaciones de NexusLMS — inscripciones, calificaciones y actividad.',
  openGraph: {
    title: 'Notificaciones | NexusLMS',
    description: 'Tus notificaciones de NexusLMS — inscripciones, calificaciones y actividad.',
    type: 'website',
  },
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
      {/* NotificationList will go here */}
    </div>
  )
}
