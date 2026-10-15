export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import {
  Boxes,
  CalendarClock,
  Info,
  MapPin,
  Phone,
  Star,
} from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { OrderMap } from "@/components/orders/order-map"
import { OrderActions } from "@/components/orders/order-actions"
import { LocationTracker } from "@/components/orders/location-tracker"
import { OrderProgress } from "@/components/orders/order-progress"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { PaymentPanel } from "@/components/orders/payment-panel"
import { PriceSummary } from "@/components/orders/price-summary"
import { StatusBadge } from "@/components/shared/status-badge"
import { ErrorState } from "@/components/shared/error-state"
import { Card } from "@/components/ui/card"
import { ApiError, serverFetch } from "@/lib/api"
import { getGoogleMapsApiKey } from "@/lib/server-config"
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
    return null
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

  const [payment, rating, latest, history, googleMapsApiKey] = await Promise.all([
    safeGet<Payment>(`/payments/order/${order.id}`),
    safeGet<Rating>(`/ratings/order/${order.id}`),
    safeGet<TrackingPoint>(`/tracking/orders/${order.id}/latest`),
    safeGet<TrackingPoint[]>(
      `/tracking/orders/${order.id}/history?limit=500`
    ),
    getGoogleMapsApiKey(),
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

  const active = isActiveStatus(order.status)
  const customerName = order.customer?.user.name ?? null

  return (
    <div>
      <AppHeader
        title={order.orderNumber}
        subtitle={formatDateTime(order.createdAt)}
        back
      />

      <div className="px-4 py-4 lg:px-8 lg:py-8">
        <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="grid gap-4 lg:col-span-2">
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
              {active ? (
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

            <OrderMap
              apiKey={googleMapsApiKey}
              orderId={order.id}
              status={order.status}
              pickup={pickup}
              dropoff={dropoff}
              initialLatest={latest}
              initialHistory={history ?? []}
            />

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
                <span className="tabular-nums">
                  {formatDistance(order.distanceKm)}
                </span>
              </div>
            </Card>

            <Card className="gap-3 p-4">
              <h2 className="text-sm font-semibold">Pelanggan & barang</h2>
              {order.customer ? (
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Phone className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {order.customer.user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.customer.user.phone}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Data pelanggan tidak tersedia.
                </p>
              )}

              <div className="border-t pt-3">
                <p className="text-[11px] text-muted-foreground">
                  Tipe kendaraan
                </p>
                <p className="text-sm">
                  {VEHICLE_TYPE_META[order.vehicleType].label}
                </p>
              </div>

              {order.vehicle ? (
                <div className="flex items-center gap-3 border-t pt-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Boxes className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {order.vehicle.brand} {order.vehicle.model}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.vehicle.plateNumber}
                    </p>
                  </div>
                </div>
              ) : null}

              {order.itemDescription ? (
                <div className="grid gap-1 border-t pt-3">
                  <p className="text-[11px] text-muted-foreground">
                    Deskripsi barang
                  </p>
                  <p className="text-sm">{order.itemDescription}</p>
                </div>
              ) : null}
            </Card>

            <Card className="gap-3 p-4">
              <h2 className="text-sm font-semibold">Rincian harga</h2>
              <PriceSummary
                estimatedPrice={order.estimatedPrice}
                discountAmount={order.discountAmount}
                finalPrice={order.finalPrice}
              />
            </Card>
          </div>

          <div className="grid gap-4">
            <LocationTracker orderId={order.id} active={active} />

            <OrderActions
              orderId={order.id}
              status={order.status}
              customerName={customerName}
            />

            <PaymentPanel
              orderId={order.id}
              amount={order.finalPrice ?? order.estimatedPrice}
              payment={payment}
            />

            {order.status === "COMPLETED" ? (
              <RatingCard rating={rating} />
            ) : null}

            {order.status === "CANCELLED" && order.cancelReason ? (
              <MemoNote title="Alasan pembatalan" content={order.cancelReason} />
            ) : null}
            {order.disputes?.length ? (
              <MemoNote
                title="Dispute"
                content="Dispute sedang diperiksa admin. Kamu akan dihubungi."
              />
            ) : null}

            <Card className="gap-4 p-4">
              <h2 className="text-sm font-semibold">Histori status</h2>
              <OrderTimeline history={order.statusHistory} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function RatingCard({ rating }: { rating: Rating | null }) {
  return (
    <Card className="gap-3 p-4">
      <h2 className="text-sm font-semibold">Penilaian pelanggan</h2>
      {rating ? (
        <>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={
                  index < rating.score
                    ? "size-4 fill-amber-400 text-amber-400"
                    : "size-4 text-muted-foreground/40"
                }
              />
            ))}
            <span className="ml-1 text-sm font-medium tabular-nums">
              {formatNumber(rating.score)}/5
            </span>
          </div>
          {rating.comment ? (
            <p className="text-sm text-muted-foreground">{rating.comment}</p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pelanggan belum memberi penilaian untuk pesanan ini.
        </p>
      )}
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
