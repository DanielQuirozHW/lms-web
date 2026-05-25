import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export const metadata: Metadata = { title: 'Students' }

export default async function CourseStudentsPage({ params }: PageProps) {
  const { courseId } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Enrolled Students</h1>
      {/* StudentList courseId={courseId} will go here */}
      <span className="hidden">{courseId}</span>
    </div>
  )
}
