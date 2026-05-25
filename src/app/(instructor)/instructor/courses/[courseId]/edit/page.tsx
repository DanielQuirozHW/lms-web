import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export const metadata: Metadata = { title: 'Edit Course' }

export default async function EditCoursePage({ params }: PageProps) {
  const { courseId } = await params
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
      {/* EditCourseForm courseId={courseId} will go here */}
      <span className="hidden">{courseId}</span>
    </div>
  )
}
