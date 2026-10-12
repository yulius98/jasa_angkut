"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { refreshWithdrawalStatus } from "@/lib/actions/withdrawals"
import type { Withdrawal } from "@/types"

export function WithdrawalActions({ withdrawal }: { withdrawal: Withdrawal }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      try {
        await refreshWithdrawalStatus(withdrawal.id)
        toast.success("Status pencairan diperbarui")
        setOpen(false)
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal menyegarkan status"
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
        Refresh Status
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Sinkronkan status pencairan?"
        description={`Ambil status terbaru untuk ${withdrawal.referenceNo} dari provider ${withdrawal.provider}.`}
        confirmLabel="Ya, sinkronkan"
        loading={pending}
        onConfirm={handleConfirm}
      />
    </>
  )
}
