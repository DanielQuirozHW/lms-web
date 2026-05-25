import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Courses — Instructor' }

export default function InstructorCoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        {/* CreateCourseButton will go here */}
      </div>
      {/* InstructorCourseList will go here */}
    </div>
  )
}
