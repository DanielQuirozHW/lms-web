import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Course Catalog' }

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
      {/* CourseList will go here */}
    </div>
  )
}
