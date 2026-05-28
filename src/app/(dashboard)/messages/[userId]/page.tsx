import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import api, { isApiError } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { Message, PublicUser } from '@/types/models'
import type { ConversationWithPartner } from '@/hooks/queries/messages'
import { ConversationList } from '@/components/features/messages/ConversationList'
import { ChatWindow } from '@/components/features/messages/ChatWindow'

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  try {
    const r = await api.get<PublicUser>(`/users/${userId}`, { headers })
    const { firstName, lastName } = r.data
    return { title: `${firstName} ${lastName} | Mensajes | NexusLMS` }
  } catch {
    return { title: 'Conversación | NexusLMS' }
  }
}

export default async function ConversationPage({ params }: PageProps) {
  const { userId } = await params
  const session = await auth()
  const token = session?.accessToken
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Parallel: partner profile + initial messages + inbox (for conversation list)
  const [partnerResult, messagesResult, inboxResult] = await Promise.allSettled([
    api.get<PublicUser>(`/users/${userId}`, { headers }),
    api.get<PaginatedData<Message>>(`/messages/${userId}`, { headers }),
    api.get<PaginatedData<ConversationWithPartner>>('/messages', { headers }),
  ])

  // 404 if the user doesn't exist
  if (
    partnerResult.status === 'rejected' &&
    isApiError(partnerResult.reason) &&
    partnerResult.reason.response?.data.statusCode === 404
  ) {
    notFound()
  }

  const partner = partnerResult.status === 'fulfilled' ? partnerResult.value.data : null

  const initialMessages: Message[] =
    messagesResult.status === 'fulfilled'
      ? (messagesResult.value.data.data ?? []).slice().reverse() // oldest first
      : []

  const conversations: ConversationWithPartner[] =
    inboxResult.status === 'fulfilled' ? (inboxResult.value.data.data ?? []) : []

  return (
    // Break out of the dashboard padding to make the chat full height
    <div className="-m-4 -mb-20 flex h-[calc(100dvh-56px)] overflow-hidden lg:-m-6 lg:-mb-6">
      {/* Conversation list — hidden on mobile (full screen chat) */}
      <aside className="border-nexus-border bg-nexus-surface hidden w-80 shrink-0 flex-col border-r md:flex">
        <div className="border-nexus-border border-b px-4 py-3">
          <h1 className="text-nexus-text text-base font-semibold">Mensajes</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList conversations={conversations} activeUserId={userId} />
        </div>
      </aside>

      {/* Chat window — full width on mobile */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <ChatWindow
          userId={userId}
          initialMessages={initialMessages}
          partner={
            partner
              ? {
                  firstName: partner.firstName,
                  lastName: partner.lastName,
                  avatarUrl: partner.avatarUrl,
                }
              : null
          }
        />
      </main>
    </div>
  )
}
