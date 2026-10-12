import { notFound } from "next/navigation"

import { AppHeader } from "@/components/app/app-header"
import { DesktopPageHeader } from "@/components/app/desktop-page-header"
import { ChatThread } from "@/components/chat/chat-thread"
import { ErrorState } from "@/components/shared/error-state"
import { ApiError, serverFetch } from "@/lib/api"
import { requireSession } from "@/lib/session"
import { ORDER_STATUS_META } from "@/lib/format"
import type {
  ChatMessage,
  ConversationDetail,
  Paginated,
} from "@/types"

export const dynamic = "force-dynamic"

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, session] = await Promise.all([params, requireSession()])

  let conversation: ConversationDetail
  try {
    conversation = await serverFetch<ConversationDetail>(
      `/chat/conversations/${id}`
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    return (
      <div className="px-4 py-6">
        <ErrorState description="Gagal memuat percakapan." />
      </div>
    )
  }

  let messages: ChatMessage[] = []
  try {
    const res = await serverFetch<Paginated<ChatMessage>>(
      `/chat/conversations/${id}/messages?limit=100`
    )
    messages = res.data
  } catch {
    // Percakapan tetap bisa dibuka; pesan dimuat ulang lewat polling.
  }

  const isSupport = conversation.type === "SUPPORT"
  const title = isSupport
    ? "Dukungan Jasa Antar"
    : conversation.order
      ? `Pesanan ${conversation.order.orderNumber}`
      : "Percakapan"
  const subtitle = isSupport
    ? "Tim dukungan"
    : conversation.order
      ? ORDER_STATUS_META[conversation.order.status].label
      : undefined

  return (
    <div className="flex h-dvh flex-col pb-24 lg:pb-0">
      {/* Header mobile (disembunyikan pada desktop). */}
      <AppHeader title={title} subtitle={subtitle} back />

      {/* Header desktop. */}
      <DesktopPageHeader
        title={title}
        subtitle={subtitle}
        backHref="/chat"
        maxWidthClassName="max-w-3xl"
      />

      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
        <ChatThread
          conversationId={id}
          currentUserId={session.user?.id ?? ""}
          initialMessages={messages}
        />
      </div>
    </div>
  )
}