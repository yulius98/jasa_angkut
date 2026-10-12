"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "cn"
import { markReadAction, sendMessageAction } from "@/lib/actions/chat"
import { formatDateTime } from "@/lib/format"
import type { ChatMessage } from "@/types"

const POLL_INTERVAL_MS = 4000

interface ChatThreadProps {
  conversationId: string
  currentUserId: string
  initialMessages: ChatMessage[]
}

export function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
}: ChatThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [pollError, setPollError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  // Tandai sudah dibaca saat ruang dibuka.
  useEffect(() => {
    markReadAction(conversationId).then((result) => {
      if (result.ok) router.refresh()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // Poling pesan baru.
  useEffect(() => {
    let cancelled = false

    async function tick() {
      try {
        const res = await fetch(`/api/proxy/chat/${conversationId}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error("bad response")
        const data = (await res.json()) as { messages: ChatMessage[] }
        if (cancelled) return
        setMessages(data.messages)
        setPollError(null)
      } catch {
        if (!cancelled) setPollError("Gagal memuat pesan baru. Mencoba lagi…")
      }
    }

    const timer = setInterval(tick, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [conversationId])

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || sending) return

    setSending(true)
    const result = await sendMessageAction(conversationId, trimmed)
    if (!result.ok) {
      setSending(false)
      toast.error(result.message)
      return
    }

    const sent = result.data
    setMessages((prev) =>
      prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]
    )
    setBody("")
    setSending(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="overflow-y-auto px-4 py-3">
        {pollError ? (
          <p className="mb-2 text-center text-xs text-destructive">
            {pollError}
          </p>
        ) : null}
        <div className="grid gap-2">
          {messages.map((message) => {
            const mine = message.senderId === currentUserId
            return (
              <div
                key={message.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted"
                  )}
                >
                  {!mine ? (
                    <p className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                      {message.sender.name}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">
                    {message.body}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-right text-[10px] tabular-nums",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={submit} className="border-t bg-background p-3">
        <div className="flex items-center gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tulis pesan…"
            maxLength={2000}
            autoComplete="off"
            aria-label="Pesan"
            className="h-11 flex-1 rounded-full px-4"
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 rounded-full"
            disabled={!body.trim() || sending}
            aria-label="Kirim"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}