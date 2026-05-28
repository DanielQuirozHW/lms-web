import type { Metadata } from 'next'
import { MessageSquare } from 'lucide-react'
import { auth } from '@/lib/auth'
import api from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { ConversationWithPartner } from '@/hooks/queries/messages'
import { ConversationList } from '@/components/features/messages/ConversationList'

export const metadata: Metadata = { title: 'Mensajes | NexusLMS' }

export default async function MessagesPage() {
  const session = await auth()
  const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}

  let conversations: ConversationWithPartner[] = []
  try {
    const r = await api.get<PaginatedData<ConversationWithPartner>>('/messages', { headers })
    conversations = r.data.data ?? []
  } catch {
    // Render empty state on failure
  }

  return (
    // Break out of the dashboard padding to make the chat full height
    <div className="-m-4 -mb-20 flex h-[calc(100dvh-56px)] overflow-hidden lg:-m-6 lg:-mb-6">
      {/* Conversation list */}
      <aside className="border-nexus-border bg-nexus-surface flex w-full flex-col border-r md:w-80 md:shrink-0">
        <div className="border-nexus-border border-b px-4 py-3">
          <h1 className="text-nexus-text text-base font-semibold">Mensajes</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList conversations={conversations} />
        </div>
      </aside>

      {/* Empty state — desktop only */}
      <main className="hidden flex-1 flex-col items-center justify-center gap-3 md:flex">
        <div className="bg-nexus-accent/15 flex h-16 w-16 items-center justify-center rounded-full">
          <MessageSquare className="text-nexus-accent h-8 w-8" aria-hidden="true" />
        </div>
        <p className="text-nexus-text text-sm font-medium">Seleccioná una conversación</p>
        <p className="text-nexus-muted text-xs">Elegí un contacto a la izquierda para empezar</p>
      </main>
    </div>
  )
}
