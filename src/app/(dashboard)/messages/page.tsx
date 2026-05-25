import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Messages' }

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
      {/* Inbox list will go here */}
    </div>
  )
}
