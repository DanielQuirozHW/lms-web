import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Courses' }

export default function MyCoursesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
      {/* Enrolled courses list will go here */}
    </div>
  )
}
