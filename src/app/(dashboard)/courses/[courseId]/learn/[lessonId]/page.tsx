import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>
}

export const metadata: Metadata = { title: 'Lesson' }

export default async function LessonPage({ params }: PageProps) {
  const { courseId, lessonId } = await params

  if (!courseId || !lessonId) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Lesson Player</h1>
      {/* LessonPlayer will go here */}
    </div>
  )
}
