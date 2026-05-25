import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Users — Admin' }

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      {/* UserTable will go here */}
    </div>
  )
}
