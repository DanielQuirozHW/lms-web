import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create Course' }

export default function NewCoursePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create a new course</h1>
      {/* CreateCourseForm will go here */}
    </div>
  )
}
