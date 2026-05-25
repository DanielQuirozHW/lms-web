import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'All Courses — Admin' }

export default function AdminCoursesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">All Courses</h1>
      {/* AdminCourseTable will go here */}
    </div>
  )
}
