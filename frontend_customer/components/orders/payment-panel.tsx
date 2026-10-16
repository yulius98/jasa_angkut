"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Banknote, CheckCircle2, CreditCard, Info, RotateCcw } from "lucide-react"
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
import type { OrderStatus, Payment, PaymentMethodSettings } from "@/types"

interface PaymentPanelProps {
  orderId: string
  amount: string
  status: OrderStatus
  payment: Payment | null
  paymentSettings: PaymentMethodSettings
}

export function PaymentPanel({
  orderId,
  amount,
  status,
  payment,
  paymentSettings,
}: PaymentPanelProps) {
  const router = useRouter()
  const [payingCash, setPayingCash] = useState(false)

  const onlineEnabled = Boolean(paymentSettings.gateway)
  const cashEnabled = paymentSettings.cashEnabled

  if (!isUnpaid(status)) {
    return null
  }

  // Checkout online sekarang terjadi DI DALAM app (embed Midtrans Snap atau
  // Xendit Components), bukan redirect ke halaman gateway. Karena itu tombolnya
  // cuma membuka halaman pembayaran kita sendiri.
  function openCheckout() {
    router.push(`/orders/${orderId}/payment`)
  }

  async function payCash() {
    setPayingCash(true)
    const result = await createPaymentAction(orderId, "CASH")
    if (!result.ok) {
      setPayingCash(false)
      toast.error(result.message)
      return
    }

    setPayingCash(false)
    toast.success("Pembayaran tunai dicatat")
    router.refresh()
  }

  // Tombol lanjut/ganti metode untuk pembayaran yang sudah ada tapi belum lunas.
  const canResumeOnline =
    onlineEnabled &&
    payment !== null &&
    (payment.status === "PENDING" || payment.status === "FAILED") &&
    payment.method !== "CASH"

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

      {canResumeOnline ? (
        <Button size="lg" className="h-11 w-full" onClick={openCheckout}>
          {payment?.status === "FAILED" ? (
            <RotateCcw className="size-4" />
          ) : (
            <CreditCard className="size-4" />
          )}
          {payment?.status === "FAILED"
            ? "Coba metode lain"
            : "Lanjutkan pembayaran"}
        </Button>
      ) : null}

      {!payment ? (
        <div className="grid gap-2 border-t pt-3">
          {onlineEnabled ? (
            <Button size="lg" className="h-11 w-full" onClick={openCheckout}>
              <CreditCard className="size-4" />
              Bayar Online
            </Button>
          ) : null}
          {cashEnabled ? (
            <Button
              variant="outline"
              size="lg"
              className="h-11 w-full"
              onClick={payCash}
              disabled={payingCash}
            >
              {payingCash ? <Spinner /> : <Banknote className="size-4" />}
              Bayar Tunai ke Mitra
            </Button>
          ) : null}
          {!onlineEnabled && !cashEnabled ? (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Belum ada metode pembayaran yang tersedia. Hubungi dukungan.
            </p>
          ) : null}
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
          Pembayaran sebelumnya belum berhasil. Kamu bisa mencoba lagi atau
          memilih metode pembayaran lain.
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
        Pembayaran online {PAYMENT_METHOD_META[payment.method].label} belum
        diselesaikan.
      </span>
    </div>
  )
}
