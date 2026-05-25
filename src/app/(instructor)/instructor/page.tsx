import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Instructor Dashboard' }

export default function InstructorDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
      {/* InstructorStats will go here */}
    </div>
  )
}
