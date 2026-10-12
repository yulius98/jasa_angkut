export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { Boxes, CalendarClock, Info, MapPin, Phone, Star } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { DesktopPageHeader } from "@/components/app/desktop-page-header"
import { OrderMap } from "@/components/orders/order-map"
import { OrderActions } from "@/components/orders/order-actions"
import { OrderProgress } from "@/components/orders/order-progress"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { PaymentPanel } from "@/components/orders/payment-panel"
import { PriceSummary } from "@/components/orders/price-summary"
import { RatingPanel } from "@/components/orders/rating-panel"
import { StatusBadge } from "@/components/shared/status-badge"
import { ErrorState } from "@/components/shared/error-state"
import { Card } from "@/components/ui/card"
import { ApiError, serverFetch } from "@/lib/api"
import { GOOGLE_MAPS_API_KEY } from "@/lib/config"
import { requireSession } from "@/lib/session"
import {
  ORDER_STATUS_META,
  VEHICLE_TYPE_META,
  formatDateTime,
  formatDistance,
  formatNumber,
  formatRupiah,
  toNumber,
} from "@/lib/format"
import { isActiveStatus } from "@/lib/orders"
import type {
  OrderDetail,
  Payment,
  Rating,
  TrackingPoint,
} from "@/types"

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    return await serverFetch<T>(path)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }] = await Promise.all([params, requireSession()])

  let order: OrderDetail
  try {
    order = await serverFetch<OrderDetail>(`/orders/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    return (
      <div className="px-4 py-6">
        <ErrorState description="Gagal memuat detail pesanan." />
      </div>
    )
  }

  const [payment, rating, latest, history] = await Promise.all([
    safeGet<Payment>(`/payments/order/${order.id}`),
    safeGet<Rating>(`/ratings/order/${order.id}`),
    safeGet<TrackingPoint>(`/tracking/orders/${order.id}/latest`),
    safeGet<TrackingPoint[]>(
      `/tracking/orders/${order.id}/history?limit=500`
    ),
  ])

  const pickup = {
    position: {
      lat: toNumber(order.pickupLatitude),
      lng: toNumber(order.pickupLongitude),
    },
    address: order.pickupAddress,
  }
  const dropoff = {
    position: {
      lat: toNumber(order.dropoffLatitude),
      lng: toNumber(order.dropoffLongitude),
    },
    address: order.dropoffAddress,
  }

  const map = (
    <OrderMap
      apiKey={GOOGLE_MAPS_API_KEY}
      orderId={order.id}
      status={order.status}
      pickup={pickup}
      dropoff={dropoff}
      initialLatest={latest}
      initialHistory={history ?? []}
    />
  )

  const memos = (
    <>
      {order.status === "CANCELLED" && order.cancelReason ? (
        <MemoNote title="Alasan pembatalan" content={order.cancelReason} />
      ) : null}
      {order.disputes?.length ? (
        <MemoNote
          title="Dispute"
          content="Dispute sedang diperiksa oleh admin. Kamu akan dihubungi."
        />
      ) : null}
    </>
  )

  return (
    <>
      {/* ===== Handphone (< lg): tidak diubah ===== */}
      <div className="lg:hidden">
        <AppHeader
          title={order.orderNumber}
          subtitle={formatDateTime(order.createdAt)}
          back
        />

        <div className="grid gap-4 px-4 py-4">
          <StatusSummaryCard order={order} />
          {map}
          <RouteCard order={order} />
          <OrderInfoCard order={order} />

          <Card className="gap-3 p-4">
            <h2 className="text-sm font-semibold">Rincian harga</h2>
            <PriceSummary
              estimatedPrice={order.estimatedPrice}
              discountAmount={order.discountAmount}
              finalPrice={order.finalPrice}
            />
          </Card>

          <PaymentPanel
            orderId={order.id}
            amount={order.finalPrice ?? order.estimatedPrice}
            status={order.status}
            payment={payment}
          />

          {order.status === "COMPLETED" ? (
            <RatingPanel
              orderId={order.id}
              partnerName={order.partner?.user.name ?? null}
              rating={rating}
            />
          ) : null}

          <OrderActions
            orderId={order.id}
            status={order.status}
            partnerId={order.partnerId}
            partnerName={order.partner?.user.name ?? null}
          />

          {order.status === "CANCELLED" && order.cancelReason ? (
            <MemoNote title="Alasan pembatalan" content={order.cancelReason} />
          ) : null}
          {order.disputes?.length ? (
            <MemoNote
              title="Dispute"
              content="Dispute sedang diperiksa oleh admin. Kamu akan dihubungi."
            />
          ) : null}

          <Card className="gap-4 p-4">
            <h2 className="text-sm font-semibold">Histori status</h2>
            <OrderTimeline history={order.statusHistory} />
          </Card>
        </div>
      </div>

      {/* ===== Desktop/laptop (>= lg) ===== */}
      <div className="hidden lg:block">
        <DesktopPageHeader
          title={order.orderNumber}
          subtitle={formatDateTime(order.createdAt)}
          backHref="/orders"
          maxWidthClassName="max-w-6xl"
          actions={<StatusBadge meta={ORDER_STATUS_META[order.status]} />}
        />

        <div className="mx-auto w-full max-w-6xl px-8 py-6">
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="grid gap-6 lg:col-span-2">
              <StatusSummaryCard order={order} />

              <Card className="gap-4 p-5">
                <h2 className="text-base font-semibold">Pelacakan</h2>
                {map}
              </Card>

              <RouteCard order={order} />
              <OrderInfoCard order={order} />

              <Card className="gap-4 p-5">
                <h2 className="text-base font-semibold">Histori status</h2>
                <OrderTimeline history={order.statusHistory} />
              </Card>
            </div>

            <div className="grid gap-6 lg:col-span-1">
              <Card className="gap-3 p-5">
                <h2 className="text-base font-semibold">Rincian harga</h2>
                <PriceSummary
                  estimatedPrice={order.estimatedPrice}
                  discountAmount={order.discountAmount}
                  finalPrice={order.finalPrice}
                />
              </Card>

              <PaymentPanel
                orderId={order.id}
                amount={order.finalPrice ?? order.estimatedPrice}
                status={order.status}
                payment={payment}
              />

              {order.status === "COMPLETED" ? (
                <RatingPanel
                  orderId={order.id}
                  partnerName={order.partner?.user.name ?? null}
                  rating={rating}
                />
              ) : null}

              {memos}

              <OrderActions
                orderId={order.id}
                status={order.status}
                partnerId={order.partnerId}
                partnerName={order.partner?.user.name ?? null}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Komponen bagian (dipakai mobile & desktop)                          */
/* ------------------------------------------------------------------ */

function StatusSummaryCard({ order }: { order: OrderDetail }) {
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <p className="text-sm text-muted-foreground">Status</p>
          <StatusBadge meta={ORDER_STATUS_META[order.status]} />
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Total</p>
          <p className="text-lg font-bold tabular-nums">
            {formatRupiah(order.finalPrice ?? order.estimatedPrice)}
          </p>
        </div>
      </div>
      {isActiveStatus(order.status) ? (
        <div className="border-t pt-4">
          <OrderProgress status={order.status} />
        </div>
      ) : null}
      {order.scheduledAt ? (
        <p className="flex items-center gap-2 border-t pt-3 text-sm text-muted-foreground">
          <CalendarClock className="size-4" />
          Penjemputan dijadwalkan {formatDateTime(order.scheduledAt)}
        </p>
      ) : null}
    </Card>
  )
}

function RouteCard({ order }: { order: OrderDetail }) {
  return (
    <Card className="gap-3 p-4">
      <h2 className="text-sm font-semibold">Rute</h2>
      <div className="grid gap-2">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Jemput</p>
            <p>{order.pickupAddress}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Tujuan</p>
            <p>{order.dropoffAddress}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">Jarak</span>
        <span className="tabular-nums">{formatDistance(order.distanceKm)}</span>
      </div>
    </Card>
  )
}

function OrderInfoCard({ order }: { order: OrderDetail }) {
  return (
    <Card className="gap-3 p-4">
      {order.partner ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Phone className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{order.partner.user.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {toNumber(order.partner.rating) > 0
                    ? formatNumber(order.partner.rating)
                    : "Belum ada rating"}
                </span>
                <span>{order.partner.user.phone}</span>
              </div>
            </div>
          </div>
          <StatusBadge meta={ORDER_STATUS_META[order.status]} />
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Menunggu mitra mengambil pesanan ini. Kamu akan melihat detail mitra
            setelahnya.
          </span>
        </div>
      )}

      {order.vehicle ? (
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Boxes className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {order.vehicle.brand} {order.vehicle.model}
              </p>
              <p className="text-xs text-muted-foreground">
                {VEHICLE_TYPE_META[order.vehicle.type].label} ·{" "}
                {order.vehicle.plateNumber}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {order.itemDescription ? (
        <div className="grid gap-1 border-t pt-3">
          <p className="text-[11px] text-muted-foreground">Deskripsi barang</p>
          <p className="text-sm">{order.itemDescription}</p>
        </div>
      ) : null}
    </Card>
  )
}

function MemoNote({ title, content }: { title: string; content: string }) {
  return (
    <Card className="gap-2 p-4">
      <Info className="size-4 text-muted-foreground" />
      <div className="grid gap-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{content}</p>
      </div>
    </Card>
  )
}
