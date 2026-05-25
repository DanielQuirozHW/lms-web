import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params
  return { title: `Course ${courseId}` }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params

  if (!courseId) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Course Detail</h1>
      {/* CourseDetail will go here */}
    </div>
  )
}
