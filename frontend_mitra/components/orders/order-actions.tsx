"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Flag, MessageCircle, XCircle } from "lucide-react"
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
import { ReasonDialog } from "@/components/shared/reason-dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  cancelOrderAction,
  disputeOrderAction,
  updateOrderStatusAction,
} from "@/lib/actions/orders"
import { createOrderConversationAction } from "@/lib/actions/chat"
import {
  NEXT_STATUS_ACTION_LABEL,
  canCancel,
  canDispute,
  nextStatus,
} from "@/lib/orders"
import type { OrderStatus } from "@/types"

interface OrderActionsProps {
  orderId: string
  status: OrderStatus
  customerName: string | null
}

export function OrderActions({
  orderId,
  status,
  customerName,
}: OrderActionsProps) {
  const router = useRouter()
  const [pendingChat, startChat] = useTransition()
  const [pendingStatus, startStatus] = useTransition()
  const [reason, setReason] = useState<"cancel" | "dispute" | null>(null)
  const [confirmComplete, setConfirmComplete] = useState(false)

  const next = nextStatus(status)
  const showCancel = canCancel(status)
  const showDispute = canDispute(status)

  function advance() {
    if (!next) return
    startStatus(async () => {
      const result = await updateOrderStatusAction(orderId, next)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setConfirmComplete(false)
      toast.success("Status pesanan diperbarui")
      router.refresh()
    })
  }

  function handleNext() {
    if (next === "COMPLETED") {
      setConfirmComplete(true)
      return
    }
    advance()
  }

  async function handleCancel(value: string) {
    setReason(null)
    const result = await cancelOrderAction(orderId, value)
    if (result.ok) {
      toast.success("Pesanan dibatalkan")
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  async function handleDispute(value: string) {
    setReason(null)
    const result = await disputeOrderAction(orderId, value)
    if (result.ok) {
      toast.success("Dispute diajukan")
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

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

  return (
    <Card className="gap-3 p-4">
      <h2 className="text-sm font-semibold">Tindakan mitra</h2>
      <div className="grid gap-2">
        {next ? (
          <Button
            size="lg"
            className="h-12 w-full text-base"
            onClick={handleNext}
            disabled={pendingStatus}
          >
            {pendingStatus ? (
              <Spinner />
            ) : next === "COMPLETED" ? (
              <CheckCircle2 className="size-5" />
            ) : null}
            {NEXT_STATUS_ACTION_LABEL[status] ?? "Lanjutkan"}
          </Button>
        ) : null}

        <Button
          variant="outline"
          size="lg"
          className="h-11 w-full"
          onClick={openChat}
          disabled={pendingChat}
        >
          {pendingChat ? <Spinner /> : <MessageCircle className="size-4" />}
          Chat dengan{customerName ? ` ${customerName}` : " pelanggan"}
        </Button>

        {showCancel ? (
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full"
            onClick={() => setReason("cancel")}
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
            onClick={() => setReason("dispute")}
          >
            <Flag className="size-4" />
            Ajukan Dispute
          </Button>
        ) : null}
      </div>

      <ReasonDialog
        open={reason === "cancel"}
        onOpenChange={(open) => !open && setReason(null)}
        title="Batalkan pesanan"
        description="Alasan pembatalan akan tercatat pada histori pesanan."
        confirmLabel="Batalkan Pesanan"
        destructive
        onConfirm={handleCancel}
      />
      <ReasonDialog
        open={reason === "dispute"}
        onOpenChange={(open) => !open && setReason(null)}
        title="Ajukan dispute"
        description="Jelaskan kendalanya. Admin akan memeriksa laporanmu."
        confirmLabel="Ajukan Dispute"
        onConfirm={handleDispute}
      />

      <Dialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan pesanan?</DialogTitle>
            <DialogDescription>
              Pastikan barang sudah diterima pelanggan. Status pesanan akan
              menjadi selesai dan tidak bisa diubah lagi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmComplete(false)}
              disabled={pendingStatus}
            >
              Batal
            </Button>
            <Button onClick={advance} disabled={pendingStatus}>
              {pendingStatus ? <Spinner /> : <CheckCircle2 className="size-4" />}
              Selesaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
