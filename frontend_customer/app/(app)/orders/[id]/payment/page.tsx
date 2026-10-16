export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"

import { AppHeader } from "@/components/app/app-header"
import { DesktopPageHeader } from "@/components/app/desktop-page-header"
import { PaymentCheckout } from "@/components/orders/payment-checkout"
import { ErrorState } from "@/components/shared/error-state"
import { ApiError, serverFetch } from "@/lib/api"
import { getPaymentMethodSettings } from "@/lib/server-config"
import { requireSession } from "@/lib/session"
import { isUnpaid } from "@/lib/orders"
import type { OrderDetail, Payment } from "@/types"

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    return await serverFetch<T>(path)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export default async function OrderPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ checkout?: string }>
}) {
  const [{ id }, query] = await Promise.all([
    params,
    searchParams,
    requireSession(),
  ])

  let order: OrderDetail
  try {
    order = await serverFetch<OrderDetail>(`/orders/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    return (
      <div className="px-4 py-6">
        <ErrorState description="Gagal memuat data pesanan." />
      </div>
    )
  }

  // Order yang sudah dibatalkan/sengketa tidak bisa dibayar -- kembalikan ke
  // halaman pesanan.
  if (!isUnpaid(order.status)) {
    redirect(`/orders/${order.id}`)
  }

  const [payment, paymentSettings] = await Promise.all([
    safeGet<Payment>(`/payments/order/${order.id}`),
    getPaymentMethodSettings(),
  ])

  const canPay = Boolean(order.finalPrice)

  return (
    <>
      {/* ===== Handphone (< lg) ===== */}
      <div className="lg:hidden">
        <AppHeader title="Pembayaran" subtitle={order.orderNumber} back />
        <div className="px-4 py-5">
          {canPay ? (
            <PaymentCheckout
              orderId={order.id}
              orderNumber={order.orderNumber}
              amount={order.finalPrice as string}
              paymentSettings={paymentSettings}
              initialPayment={payment}
              resume={query.checkout === "resume"}
            />
          ) : (
            <ErrorState description="Pesanan ini belum punya harga final." />
          )}
        </div>
      </div>

      {/* ===== Desktop (>= lg) ===== */}
      <div className="hidden lg:block">
        <DesktopPageHeader
          title="Pembayaran"
          subtitle={order.orderNumber}
          backHref={`/orders/${order.id}`}
          maxWidthClassName="max-w-3xl"
        />
        <div className="mx-auto w-full max-w-3xl px-8 py-8">
          {canPay ? (
            <PaymentCheckout
              orderId={order.id}
              orderNumber={order.orderNumber}
              amount={order.finalPrice as string}
              paymentSettings={paymentSettings}
              initialPayment={payment}
              resume={query.checkout === "resume"}
            />
          ) : (
            <ErrorState description="Pesanan ini belum punya harga final." />
          )}
        </div>
      </div>
    </>
  )
}
