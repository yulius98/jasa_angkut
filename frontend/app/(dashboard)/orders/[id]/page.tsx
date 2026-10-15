import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { OrderMap } from "@/components/orders/order-map"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { PriceSummary } from "@/components/orders/price-summary"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ApiError, serverFetch } from "@/lib/api"
import { getGoogleMapsApiKey } from "@/lib/server-config"
import {
  formatDateTime,
  formatDistance,
  formatNumber,
  formatRupiah,
  ORDER_STATUS_META,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
  toNumber,
  VEHICLE_TYPE_META,
} from "@/lib/format"
import type { OrderDetail, Payment, TrackingPoint } from "@/types"

function formatCoordinate(value: string): string {
  const n = toNumber(value)
  return n.toFixed(6)
}

function formatRating(rating: string | undefined | null): string {
  const value = Number(rating)
  return Number.isFinite(value) && value > 0 ? value.toFixed(1) : "—"
}

// Data sekunder: bila tidak ada (404) atau gagal dimuat, halaman tetap tampil.
async function fetchOptional<T>(path: string): Promise<T | null> {
  try {
    return await serverFetch<T>(path, { cache: "no-store" })
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return null
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let order: OrderDetail
  try {
    order = await serverFetch<OrderDetail>(`/orders/${id}`, {
      cache: "no-store",
    })
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat detail pesanan"
        description={err.message}
        action={<Link href="/orders">Kembali ke daftar pesanan</Link>}
      />
    )
  }

  const [payment, latest, history, googleMapsApiKey] = await Promise.all([
    fetchOptional<Payment>(`/payments/order/${id}`),
    fetchOptional<TrackingPoint>(`/tracking/orders/${id}/latest`),
    fetchOptional<TrackingPoint[]>(`/tracking/orders/${id}/history?limit=500`),
    getGoogleMapsApiKey(),
  ])

  const trackingHistory = history ?? []
  const statusMeta = ORDER_STATUS_META[order.status]

  const summaryRows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "No. Order", value: <span className="tabular-nums">{order.orderNumber}</span> },
    { label: "Status", value: <StatusBadge meta={statusMeta} /> },
    { label: "Dibuat", value: formatDateTime(order.createdAt) },
    { label: "Dikonfirmasi", value: formatDateTime(order.confirmedAt) },
    { label: "Selesai", value: formatDateTime(order.completedAt) },
    { label: "Pemesan", value: order.customer?.user.name ?? "—" },
  ]

  const routeRows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Jarak", value: formatDistance(order.distanceKm) },
    {
      label: "Deskripsi barang",
      value: order.itemDescription || "—",
    },
    { label: "Dijadwalkan", value: formatDateTime(order.scheduledAt) },
    {
      label: "Tipe kendaraan",
      value: <StatusBadge meta={VEHICLE_TYPE_META[order.vehicleType]} />,
    },
  ]

  const pickupPoint = {
    position: {
      lat: toNumber(order.pickupLatitude),
      lng: toNumber(order.pickupLongitude),
    },
    address: order.pickupAddress,
  }
  const dropoffPoint = {
    position: {
      lat: toNumber(order.dropoffLatitude),
      lng: toNumber(order.dropoffLongitude),
    },
    address: order.dropoffAddress,
  }

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description="Detail pesanan, pembayaran, dan pelacakan perjalanan."
      >
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft />
          Kembali
        </Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div className="grid gap-1">
                <CardTitle className="text-base">Ringkasan</CardTitle>
                <CardDescription>
                  Informasi utama pesanan beserta waktu pentingnya.
                </CardDescription>
              </div>
              <StatusBadge meta={statusMeta} />
            </CardHeader>
            <CardContent>
              {order.status === "CANCELLED" && order.cancelReason ? (
                <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  Dibatalkan: {order.cancelReason}
                </p>
              ) : null}
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {summaryRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[8.5rem_1fr] items-baseline gap-2 border-b py-1.5 last:border-0"
                  >
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-sm font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rute & Muatan</CardTitle>
              <CardDescription>
                Titik jemput, titik tujuan, dan detail muatan.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1 rounded-lg border p-3">
                  <span className="inline-flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                    <span className="size-2.5 rounded-full bg-[#16a34a]" />
                    Pickup
                  </span>
                  <p className="text-sm">{order.pickupAddress}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCoordinate(order.pickupLatitude)},{" "}
                    {formatCoordinate(order.pickupLongitude)}
                  </p>
                </div>
                <div className="grid gap-1 rounded-lg border p-3">
                  <span className="inline-flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                    <span className="size-2.5 rounded-full bg-[#dc2626]" />
                    Dropoff
                  </span>
                  <p className="text-sm">{order.dropoffAddress}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCoordinate(order.dropoffLatitude)},{" "}
                    {formatCoordinate(order.dropoffLongitude)}
                  </p>
                </div>
              </div>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {routeRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[8.5rem_1fr] items-baseline gap-2 border-b py-1.5 last:border-0"
                  >
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-sm font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Harga</CardTitle>
              <CardDescription>
                Rincian estimasi, diskon, dan harga final.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PriceSummary
                estimatedPrice={order.estimatedPrice}
                discountAmount={order.discountAmount}
                finalPrice={order.finalPrice}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histori Status</CardTitle>
              <CardDescription>
                Urutan perubahan status beserta catatannya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderTimeline history={order.statusHistory} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pembayaran</CardTitle>
              <CardDescription>
                Status pembayaran beserta komisi platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payment ? (
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <div className="grid grid-cols-[8.5rem_1fr] items-baseline gap-2 border-b py-1.5">
                    <dt className="text-sm text-muted-foreground">Metode</dt>
                    <dd className="text-sm font-medium">
                      {PAYMENT_METHOD_META[payment.method].label}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[8.5rem_1fr] items-baseline gap-2 border-b py-1.5">
                    <dt className="text-sm text-muted-foreground">Status</dt>
                    <dd>
                      <StatusBadge meta={PAYMENT_STATUS_META[payment.status]} />
                    </dd>
                  </div>
                  <div className="grid grid-cols-[8.5rem_1fr] items-baseline gap-2 border-b py-1.5">
                    <dt className="text-sm text-muted-foreground">Jumlah</dt>
                    <dd className="text-sm font-medium tabular-nums">
                      {formatRupiah(payment.amount)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[8.5rem_1fr] items-baseline gap-2 border-b py-1.5">
                    <dt className="text-sm text-muted-foreground">Komisi</dt>
                    <dd className="text-sm font-medium tabular-nums">
                      {formatRupiah(payment.commissionAmount)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[8.5rem_1fr] items-baseline gap-2 border-b py-1.5">
                    <dt className="text-sm text-muted-foreground">
                      Penghasilan mitra
                    </dt>
                    <dd className="text-sm font-medium tabular-nums">
                      {formatRupiah(payment.partnerEarning)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[8.5rem_1fr] items-baseline gap-2 py-1.5">
                    <dt className="text-sm text-muted-foreground">Dibayar</dt>
                    <dd className="text-sm font-medium">
                      {formatDateTime(payment.paidAt)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pesanan ini belum memiliki data pembayaran.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peta Perjalanan</CardTitle>
              <CardDescription>
                Posisi mitra, rute histori, dan titik jemput/tujuan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderMap
                apiKey={googleMapsApiKey}
                orderId={order.id}
                status={order.status}
                pickup={pickupPoint}
                dropoff={dropoffPoint}
                initialLatest={latest}
                initialHistory={trackingHistory}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Partner & Kendaraan</CardTitle>
              <CardDescription>
                Mitra yang ditugaskan beserta kendaraannya.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {order.partner ? (
                <div className="grid gap-1">
                  <Link
                    href={`/partners/${order.partner.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {order.partner.user.name}
                  </Link>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {order.partner.user.phone ?? "—"} &middot; Rating{" "}
                    {formatRating(order.partner.rating)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Belum ada mitra yang ditugaskan untuk pesanan ini.
                </p>
              )}

              {order.vehicle ? (
                <div className="grid gap-1 rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {order.vehicle.brand} {order.vehicle.model}
                    </span>
                    <StatusBadge meta={VEHICLE_TYPE_META[order.vehicle.type]} />
                  </div>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {order.vehicle.plateNumber}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Belum ada kendaraan terkait.
                </p>
              )}

              {order.rating ? (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Rating pesanan</p>
                  <p className="text-sm font-medium tabular-nums">
                    {formatNumber(order.rating.score)} / 5
                    {order.rating.comment
                      ? ` — ${order.rating.comment}`
                      : ""}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
