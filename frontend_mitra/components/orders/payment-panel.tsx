"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Banknote, CheckCircle2, Info } from "lucide-react"
import { toast } from "sonner"

import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { markPaidAction } from "@/lib/actions/payments"
import {
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
  formatDateTime,
  formatRupiah,
} from "@/lib/format"
import type { Payment } from "@/types"

interface PaymentPanelProps {
  orderId: string
  amount: string
  payment: Payment | null
}

export function PaymentPanel({ orderId, amount, payment }: PaymentPanelProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function markPaid() {
    if (!payment) return
    setPending(true)
    const result = await markPaidAction(payment.id, orderId)
    setPending(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success("Pembayaran ditandai lunas")
    router.refresh()
  }

  const canMarkPaid =
    payment?.status === "PENDING" && payment.method !== "VIRTUAL_ACCOUNT"

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Pembayaran</h2>
        {payment ? (
          <StatusBadge meta={PAYMENT_STATUS_META[payment.status]} />
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">Total tagihan</span>
        <span className="text-base font-semibold tabular-nums">
          {formatRupiah(amount)}
        </span>
      </div>

      {payment ? (
        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Metode</span>
          <span>{PAYMENT_METHOD_META[payment.method].label}</span>
        </div>
      ) : null}

      {!payment ? (
        <InfoNote>
          Pelanggan belum memilih metode pembayaran. Untuk pembayaran tunai
          langsung, minta pelanggan memilih “Bayar Tunai” di aplikasinya.
        </InfoNote>
      ) : payment.status === "PAID" ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>
            Lunas
            {payment.paidAt ? ` pada ${formatDateTime(payment.paidAt)}` : ""}.
          </span>
        </div>
      ) : payment.status === "REFUNDED" ? (
        <InfoNote>Pembayaran telah dikembalikan (refund).</InfoNote>
      ) : payment.status === "FAILED" ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Pembayaran gagal. Minta pelanggan meninjau pembayarannya.
        </p>
      ) : canMarkPaid ? (
        <div className="grid gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Konfirmasi hanya setelah kamu menerima uang dari pelanggan.
          </p>
          <Button
            size="lg"
            className="h-11 w-full"
            onClick={markPaid}
            disabled={pending}
          >
            {pending ? <Spinner /> : <Banknote className="size-4" />}
            Tandai Lunas
          </Button>
        </div>
      ) : (
        <InfoNote>
          Menunggu pelanggan menyelesaikan pembayaran{" "}
          {PAYMENT_METHOD_META[payment.method].label}.
        </InfoNote>
      )}
    </Card>
  )
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
