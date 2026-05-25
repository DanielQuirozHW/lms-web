import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ userId: string }>
}

export const metadata: Metadata = { title: 'Conversation' }

export default async function ConversationPage({ params }: PageProps) {
  const { userId } = await params
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-xl font-semibold">Conversation with {userId}</h1>
      {/* MessageThread + MessageInput will go here */}
    </div>
  )
}
