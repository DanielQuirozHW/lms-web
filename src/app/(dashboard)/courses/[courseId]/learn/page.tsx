import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default async function LearnIndexPage({ params }: PageProps) {
  const { courseId } = await params
  redirect(`/courses/${courseId}`)
}
