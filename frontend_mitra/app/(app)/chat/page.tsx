import Link from "next/link"
import { MessageCircle } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { SupportButton } from "@/components/chat/support-button"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ApiError, serverFetch } from "@/lib/api"
import { requireSession } from "@/lib/session"
import { ORDER_STATUS_META, formatRelative } from "@/lib/format"
import { UserRole } from "@/types"
import type { ConversationSummary } from "@/types"

export const dynamic = "force-dynamic"

export default async function ChatPage() {
  const session = await requireSession()

  let conversations: ConversationSummary[] = []
  let error: string | null = null
  try {
    const res = await serverFetch<{ data: ConversationSummary[] }>(
      "/chat/conversations"
    )
    conversations = res.data
  } catch (e) {
    error = e instanceof ApiError ? e.message : "Gagal memuat percakapan"
  }

  return (
    <div>
      <AppHeader title="Chat" subtitle={session.user?.name} />

      <div className="grid gap-4 px-4 py-4">
        <SupportButton className="h-11 w-full" />

        {error ? (
          <ErrorState description={error} />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Belum ada percakapan"
            description="Mulai chat dengan pelanggan dari halaman pesanan, atau hubungi dukungan di atas."
          />
        ) : (
          <div className="grid gap-2">
            {conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                currentUserId={session.user?.id ?? ""}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function otherName(
  conversation: ConversationSummary,
  currentUserId: string
): string {
  if (conversation.type === "SUPPORT") return "Dukungan Jasa Antar"
  const other = conversation.participants.find(
    (p) => p.userId !== currentUserId
  )
  if (other) {
    if (other.user.role === UserRole.ADMIN || other.user.role === UserRole.SUPER_ADMIN) {
      return "Dukungan Jasa Antar"
    }
    return other.user.name
  }
  if (conversation.order) return `Pesanan ${conversation.order.orderNumber}`
  return "Percakapan"
}

function ConversationRow({
  conversation,
  currentUserId,
}: {
  conversation: ConversationSummary
  currentUserId: string
}) {
  const name = otherName(conversation, currentUserId)
  const last = conversation.lastMessage
  const isUnsolicited =
    last && last.senderId !== null && conversation.unreadCount > 0

  return (
    <Link href={`/chat/${conversation.id}`} className="block">
      <Card className="flex-row items-center gap-3 p-4 transition-colors active:bg-muted/50">
        <Avatar className="size-11 rounded-full">
          <AvatarFallback className="bg-primary/10 text-primary">
            {name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            {last ? (
              <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                {formatRelative(last.createdAt)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {conversation.type === "ORDER" && conversation.order ? (
                <StatusBadge
                  meta={ORDER_STATUS_META[conversation.order.status]}
                  className="mr-1.5"
                />
              ) : null}
              {last ? last.body : "Mulai percakapan"}
            </p>
            {isUnsolicited ? (
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {conversation.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  )
}
