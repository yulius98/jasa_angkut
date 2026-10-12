import Link from "next/link"
import { MessageCircle } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { DesktopPageHeader } from "@/components/app/desktop-page-header"
import { SupportButton } from "@/components/chat/support-button"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ApiError, serverFetch } from "@/lib/api"
import { requireSession } from "@/lib/session"
import { ORDER_STATUS_META, formatRelative } from "@/lib/format"
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
    <>
      {/* ===== Handphone (< lg): tidak diubah ===== */}
      <div className="lg:hidden">
        <AppHeader title="Chat" subtitle={session.user?.name} />

        <div className="grid gap-4 px-4 py-4">
          <SupportButton className="h-11 w-full" />

          {error ? (
            <ErrorState description={error} />
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="Belum ada percakapan"
              description="Mulai chat dengan mitra dari halaman pesanan, atau hubungi dukungan di atas."
            />
          ) : (
            <div className="grid gap-2">
              {conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== Desktop/laptop (>= lg) ===== */}
      <div className="hidden lg:block">
        <DesktopPageHeader
          title="Chat"
          subtitle={session.user?.name}
          maxWidthClassName="max-w-3xl"
          actions={<SupportButton variant="outline" className="h-10" />}
        />

        <div className="mx-auto w-full max-w-3xl px-8 py-6">
          {error ? (
            <ErrorState description={error} />
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="Belum ada percakapan"
              description="Mulai chat dengan mitra dari halaman pesanan, atau hubungi dukungan lewat tombol di atas."
            />
          ) : (
            <div className="grid gap-2">
              {conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ConversationRow({
  conversation,
}: {
  conversation: ConversationSummary
}) {
  const other =
    conversation.type === "SUPPORT"
      ? { name: "Dukungan Jasa Antar", role: null }
      : conversationOrderTitle(conversation)

  const last = conversation.lastMessage
  const isUnsolicited =
    last && last.senderId !== null && conversation.unreadCount > 0

  return (
    <Link href={`/chat/${conversation.id}`} className="block">
      <Card className="flex-row items-center gap-3 p-4 transition-colors active:bg-muted/50 lg:hover:bg-muted/50">
        <Avatar className="size-11 rounded-full">
          <AvatarFallback className="bg-primary/10 text-primary">
            {(other.name ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{other.name}</p>
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

function conversationOrderTitle(conversation: ConversationSummary): {
  name: string
  role: string | null
} {
  if (conversation.order) {
    return { name: `Pesanan ${conversation.order.orderNumber}`, role: null }
  }
  return { name: "Percakapan", role: null }
}
