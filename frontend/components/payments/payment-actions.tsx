"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PaymentMethod, PaymentStatus, type PaymentListItem } from "@/types"
import { markCashPaid } from "@/lib/actions/payments"

interface PaymentActionsProps {
  payment: PaymentListItem
}

export function PaymentActions({ payment }: PaymentActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const canMarkPaid =
    payment.method === PaymentMethod.CASH &&
    payment.status === PaymentStatus.PENDING

  if (!canMarkPaid) return null

  function handleConfirm() {
    startTransition(async () => {
      try {
        await markCashPaid(payment.id)
        toast.success("Pembayaran berhasil ditandai lunas")
        setOpen(false)
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal memperbarui pembayaran"
        toast.error(message)
      }
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7"
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        Tandai Lunas
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Tandai pembayaran lunas"
        description="Konfirmasi bahwa pembayaran tunai telah diterima? Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, tandai lunas"
        loading={pending}
        onConfirm={handleConfirm}
      />
    </>
  )
}
