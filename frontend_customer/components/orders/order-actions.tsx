"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Flag, MessageCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  cancelOrderAction,
  disputeOrderAction,
} from "@/lib/actions/orders"
import { createOrderConversationAction } from "@/lib/actions/chat"
import { canCancel, canDispute } from "@/lib/orders"
import type { OrderStatus } from "@/types"

interface OrderActionsProps {
  orderId: string
  status: OrderStatus
  partnerId: string | null
  partnerName: string | null
}

export function OrderActions({
  orderId,
  status,
  partnerId,
  partnerName,
}: OrderActionsProps) {
  const router = useRouter()
  const [pendingChat, startChat] = useTransition()
  const [dialog, setDialog] = useState<"cancel" | "dispute" | null>(null)

  function openChat() {
    startChat(async () => {
      const result = await createOrderConversationAction(orderId)
      if (result.ok) {
        router.push(`/chat/${result.data.id}`)
        return
      }
      toast.error(result.message)
    })
  }

  async function handleCancel(reason: string) {
    setDialog(null)
    const result = await cancelOrderAction(orderId, reason)
    if (result.ok) {
      toast.success("Pesanan dibatalkan")
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  async function handleDispute(reason: string) {
    setDialog(null)
    const result = await disputeOrderAction(orderId, reason)
    if (result.ok) {
      toast.success("Dispute diajukan")
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const showChat = Boolean(partnerId)
  const showCancel = canCancel(status)
  const showDispute = canDispute(status)

  if (!showChat && !showCancel && !showDispute) {
    return null
  }

  return (
    <Card className="gap-3 p-4">
      <h2 className="text-sm font-semibold">Tindakan</h2>
      <div className="grid gap-2">
        {showChat ? (
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full"
            onClick={openChat}
            disabled={pendingChat}
          >
            {pendingChat ? <Spinner /> : <MessageCircle className="size-4" />}
            Chat dengan{partnerName ? ` ${partnerName}` : " mitra"}
          </Button>
        ) : null}
        {showCancel ? (
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full"
            onClick={() => setDialog("cancel")}
          >
            <XCircle className="size-4" />
            Batalkan Pesanan
          </Button>
        ) : null}
        {showDispute ? (
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full text-destructive"
            onClick={() => setDialog("dispute")}
          >
            <Flag className="size-4" />
            Ajukan Dispute
          </Button>
        ) : null}
      </div>

      <ReasonDialog
        open={dialog === "cancel"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Batalkan pesanan"
        description="Alasan pembatalan akan tercatat pada histori pesanan."
        confirmLabel="Batalkan Pesanan"
        minLength={5}
        hint="minimal 5 karakter"
        onConfirm={handleCancel}
      />
      <ReasonDialog
        open={dialog === "dispute"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Ajukan dispute"
        description="Jelaskan masalahnya. Admin akan memeriksa."
        confirmLabel="Ajukan Dispute"
        minLength={10}
        hint="minimal 10 karakter"
        onConfirm={handleDispute}
      />
    </Card>
  )
}

function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  minLength,
  hint,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  minLength: number
  hint: string
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const valid = reason.trim().length >= minLength

  function confirm() {
    setLoading(true)
    onConfirm(reason.trim())
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Tuliskan alasan (${hint})`}
            aria-label="Alasan"
            disabled={loading}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">
            {reason.trim().length}/1000 karakter &middot; {hint}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant={title === "Batalkan pesanan" ? "destructive" : "default"}
            disabled={!valid || loading}
            onClick={confirm}
          >
            {loading ? <Spinner /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}