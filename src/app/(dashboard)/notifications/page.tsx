import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications' }

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
      {/* NotificationList will go here */}
    </div>
  )
}
