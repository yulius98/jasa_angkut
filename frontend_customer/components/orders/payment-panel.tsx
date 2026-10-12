"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Banknote, CheckCircle2, CreditCard, Info } from "lucide-react"
import { toast } from "sonner"

import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { createPaymentAction } from "@/lib/actions/payments"
import {
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
  formatDateTime,
  formatRupiah,
} from "@/lib/format"
import { isUnpaid } from "@/lib/orders"
import type { OrderStatus, Payment } from "@/types"

interface PaymentPanelProps {
  orderId: string
  amount: string
  status: OrderStatus
  payment: Payment | null
}

export function PaymentPanel({
  orderId,
  amount,
  status,
  payment,
}: PaymentPanelProps) {
  const router = useRouter()
  const [action, setAction] = useState<"online" | "cash" | null>(null)

  if (!isUnpaid(status)) {
    return null
  }

  async function pay(method: "VIRTUAL_ACCOUNT" | "CASH") {
    setAction(method === "VIRTUAL_ACCOUNT" ? "online" : "cash")
    const result = await createPaymentAction(orderId, method)
    if (!result.ok) {
      setAction(null)
      toast.error(result.message)
      return
    }

    const data = result.data
    const gatewayUrl = data.redirectUrl ?? data.invoiceUrl
    if (method === "VIRTUAL_ACCOUNT" && gatewayUrl) {
      // Redirect ke halaman pembayaran gateway (Midtrans/Xendit).
      window.location.href = gatewayUrl
      return
    }

    setAction(null)
    toast.success(
      method === "CASH" ? "Pembayaran tunai dicatat" : "Pembayaran dibuat"
    )
    router.refresh()
  }

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Pembayaran</h2>
        {payment ? <StatusBadge meta={PAYMENT_STATUS_META[payment.status]} /> : null}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">Total dibayar</span>
        <span className="text-base font-semibold tabular-nums">
          {formatRupiah(amount)}
        </span>
      </div>

      {payment ? <PaymentDetail payment={payment} /> : null}

      {!payment ? (
        <div className="grid gap-2 border-t pt-3">
          <Button
            size="lg"
            className="h-11 w-full"
            onClick={() => pay("VIRTUAL_ACCOUNT")}
            disabled={action !== null}
          >
            {action === "online" ? <Spinner /> : <CreditCard className="size-4" />}
            Bayar Online
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full"
            onClick={() => pay("CASH")}
            disabled={action !== null}
          >
            {action === "cash" ? <Spinner /> : <Banknote className="size-4" />}
            Bayar Tunai ke Mitra
          </Button>
        </div>
      ) : null}
    </Card>
  )
}

function PaymentDetail({ payment }: { payment: Payment }) {
  if (payment.status === "PAID") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>
          Pembayaran {PAYMENT_METHOD_META[payment.method].label} lunas
          {payment.paidAt ? ` pada ${formatDateTime(payment.paidAt)}` : ""}.
        </span>
      </div>
    )
  }

  if (payment.status === "FAILED") {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          Pembayaran gagal. Hubungi dukungan untuk membantu menyelesaikan
          pembayaran.
        </span>
      </div>
    )
  }

  if (payment.status === "REFUNDED") {
    return (
      <p className="text-sm text-muted-foreground">
        Pembayaran telah dikembalikan (refund).
      </p>
    )
  }

  // PENDING
  if (payment.method === "CASH") {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          Bayar tunai langsung ke mitra saat barang tiba. Mitra akan menandai
          pembayaran lunas di lapangan.
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      <span>
        Pembayaran online {PAYMENT_METHOD_META[payment.method].label} masih
        diproses. Selesaikan lewat halaman pembayaran yang sudah terbuka.
      </span>
    </div>
  )
}