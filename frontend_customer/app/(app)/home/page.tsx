import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Headset,
  MapPin,
  Package,
  PackagePlus,
  PackageSearch,
  Phone,
  Route,
  type LucideIcon,
} from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { OrderCard } from "@/components/orders/order-card"
import { SupportButton } from "@/components/chat/support-button"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ApiError, serverFetch } from "@/lib/api"
import { requireSession } from "@/lib/session"
import {
  ORDER_STATUS_META,
  VEHICLE_TYPE_META,
  formatRupiah,
} from "@/lib/format"
import { isFinalStatus, VEHICLE_ICON } from "@/lib/orders"
import type { OrderListItem, Paginated } from "@/types"

export const dynamic = "force-dynamic"

type OrdersResult =
  | { ok: true; data: OrderListItem[]; total: number }
  | { ok: false; message: string }

async function getOrders(): Promise<OrdersResult> {
  try {
    const res = await serverFetch<Paginated<OrderListItem>>(
      "/orders/me?limit=20"
    )
    return { ok: true, data: res.data, total: res.meta.total }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ApiError ? error.message : "Gagal memuat pesanan",
    }
  }
}

export default async function HomePage() {
  const [session, ordersResult] = await Promise.all([
    requireSession(),
    getOrders(),
  ])

  const firstName = (session.user?.name ?? "Pelanggan").split(" ")[0]
  const orders = ordersResult.ok ? ordersResult.data : []
  const ongoing = orders.find((order) => !isFinalStatus(order.status))
  const others = orders
    .filter((order) => order.id !== ongoing?.id)
    .slice(0, 3)

  const activeCount = orders.filter(
    (order) => !isFinalStatus(order.status)
  ).length
  const completedCount = orders.filter(
    (order) => order.status === "COMPLETED"
  ).length
  const totalCount = ordersResult.ok ? ordersResult.total : 0

  return (
    <>
      {/* ===== Handphone (< lg): tidak diubah ===== */}
      <div className="lg:hidden">
        <AppHeader
          title={`Halo, ${firstName}`}
          subtitle="Mau kirim apa hari ini?"
        />

        <div className="grid gap-5 px-4 py-5">
          {!ordersResult.ok ? (
            <ErrorState description={ordersResult.message} />
          ) : ongoing ? (
            <OngoingCard order={ongoing} />
          ) : (
            <Card className="gap-3 bg-primary p-5 text-primary-foreground shadow-sm">
              <div className="grid gap-1">
                <p className="text-lg font-semibold">Butuh kirim barang?</p>
                <p className="text-sm text-primary-foreground/80">
                  Pesan mitra terdekat dan lacak pengiriman real-time.
                </p>
              </div>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                nativeButton={false}
                render={<Link href="/orders/new" />}
              >
                <PackagePlus className="size-4" />
                Pesan Sekarang
              </Button>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              href="/orders/new"
              icon={PackagePlus}
              label="Pesan Baru"
            />
            <QuickAction
              href="/orders"
              icon={ClipboardList}
              label="Pesanan Saya"
            />
          </div>

          <Card className="gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Phone className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Butuh bantuan?</p>
                <p className="text-xs text-muted-foreground">
                  Chat tim dukungan Jasa Antar
                </p>
              </div>
            </div>
            <SupportButton variant="outline" className="w-full" />
          </Card>

          {orders.length > 0 ? (
            <section className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Pesanan terbaru</h2>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs"
                  nativeButton={false}
                  render={<Link href="/orders" />}
                >
                  Lihat semua
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
              {others.length === 0 && ongoing ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada pesanan lain.
                </p>
              ) : (
                <div className="grid gap-3">
                  {others.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </section>
          ) : ordersResult.ok ? (
            <EmptyState
              icon={ClipboardList}
              title="Belum ada pesanan"
              description="Pesanan yang kamu buat akan muncul di sini."
            />
          ) : null}
        </div>
      </div>

      {/* ===== Komputer / laptop (>= lg) ===== */}
      <div className="hidden lg:block">
        <DesktopHeader firstName={firstName} />

        <div className="mx-auto w-full max-w-6xl px-8 py-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="grid content-start gap-6 xl:col-span-2">
              {!ordersResult.ok ? (
                <ErrorState description={ordersResult.message} />
              ) : ongoing ? (
                <DesktopOngoingCard order={ongoing} />
              ) : (
                <DesktopHeroCard />
              )}

              <DesktopQuickActions />

              {orders.length > 0 ? (
                <section className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">
                      Pesanan terbaru
                    </h2>
                    <Button
                      variant="link"
                      size="sm"
                      nativeButton={false}
                      render={<Link href="/orders" />}
                    >
                      Lihat semua
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                  {others.length === 0 && ongoing ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada pesanan lain.
                    </p>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {others.map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  )}
                </section>
              ) : ordersResult.ok ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Belum ada pesanan"
                  description="Pesanan yang kamu buat akan muncul di sini."
                  action={
                    <Button
                      nativeButton={false}
                      render={<Link href="/orders/new" />}
                    >
                      <PackagePlus className="size-4" />
                      Pesan Sekarang
                    </Button>
                  }
                />
              ) : null}
            </div>

            <aside className="grid content-start gap-6 xl:col-span-1">
              <DesktopStatsCard
                total={totalCount}
                active={activeCount}
                completed={completedCount}
              />
              <DesktopSupportCard />
              <DesktopStepsCard />
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Komponen mobile (dipakai apa adanya seperti sebelumnya)             */
/* ------------------------------------------------------------------ */

function OngoingCard({ order }: { order: OrderListItem }) {
  const VehicleIcon = VEHICLE_ICON[order.vehicleType]

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="gap-4 border-primary/30 p-5 shadow-sm transition-colors active:bg-muted/50">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Pesanan berjalan
          </span>
          <StatusBadge meta={ORDER_STATUS_META[order.status]} />
        </div>

        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <VehicleIcon className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {VEHICLE_TYPE_META[order.vehicleType].label}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {order.orderNumber}
            </p>
          </div>
        </div>

        <div className="grid gap-1 border-t pt-3 text-sm">
          <p className="line-clamp-1 text-muted-foreground">
            {order.pickupAddress}
          </p>
          <p className="line-clamp-1 font-medium">{order.dropoffAddress}</p>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-base font-semibold tabular-nums">
            {formatRupiah(order.finalPrice ?? order.estimatedPrice)}
          </span>
        </div>
      </Card>
    </Link>
  )
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Link href={href} className="block">
      <Card className="items-center gap-2 p-4 text-center transition-colors active:bg-muted/50">
        <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <span className="text-sm font-medium">{label}</span>
      </Card>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Komponen desktop / laptop                                           */
/* ------------------------------------------------------------------ */

function DesktopHeader({ firstName }: { firstName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-8">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            Halo, {firstName}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            Mau kirim apa hari ini?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            className="h-10 gap-2 px-4"
            nativeButton={false}
            render={<Link href="/orders/new" />}
          >
            <PackagePlus className="size-4" />
            Pesan Baru
          </Button>
        </div>
      </div>
    </header>
  )
}

function DesktopHeroCard() {
  return (
    <Card className="relative gap-5 overflow-hidden bg-primary p-8 text-primary-foreground ring-primary/20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-primary-foreground/10 blur-2xl"
      />
      <div className="grid max-w-xl gap-2">
        <p className="text-2xl font-semibold tracking-tight">
          Butuh kirim barang?
        </p>
        <p className="text-primary-foreground/80">
          Pesan mitra terdekat dan lacak pengiriman secara real-time, dari
          penjemputan sampai barang tiba di tujuan.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="h-11 gap-2 px-5"
          nativeButton={false}
          render={<Link href="/orders/new" />}
        >
          <PackagePlus className="size-5" />
          Pesan Sekarang
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-11 gap-2 border-transparent bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          nativeButton={false}
          render={<Link href="/orders" />}
        >
          Lihat Pesanan
        </Button>
      </div>
    </Card>
  )
}

function DesktopOngoingCard({ order }: { order: OrderListItem }) {
  const VehicleIcon = VEHICLE_ICON[order.vehicleType]

  return (
    <Card className="gap-5 border-primary/30 p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          Pesanan berjalan
        </span>
        <StatusBadge meta={ORDER_STATUS_META[order.status]} />
      </div>

      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <VehicleIcon className="size-7" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold">
            {VEHICLE_TYPE_META[order.vehicleType].label}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {order.orderNumber}
          </p>
        </div>
      </div>

      <div className="grid gap-1.5 rounded-xl bg-muted/50 p-4 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <span className="line-clamp-1 text-muted-foreground">
            {order.pickupAddress}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span className="line-clamp-1 font-medium">
            {order.dropoffAddress}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tabular-nums">
            {formatRupiah(order.finalPrice ?? order.estimatedPrice)}
          </span>
          <Button
            className="gap-2"
            nativeButton={false}
            render={<Link href={`/orders/${order.id}`} />}
          >
            <Route className="size-4" />
            Lacak Pesanan
          </Button>
        </div>
      </div>
    </Card>
  )
}

function DesktopQuickActions() {
  const items: {
    href: string
    icon: LucideIcon
    title: string
    description: string
  }[] = [
    {
      href: "/orders/new",
      icon: PackagePlus,
      title: "Pesan Baru",
      description: "Buat pengiriman dan lihat estimasi harga.",
    },
    {
      href: "/orders",
      icon: PackageSearch,
      title: "Pesanan Saya",
      description: "Pantau status dan lacak pengiriman.",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="group block">
          <Card className="h-full gap-2 p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="size-6" />
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-base font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {item.description}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function DesktopStatsCard({
  total,
  active,
  completed,
}: {
  total: number
  active: number
  completed: number
}) {
  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "Total pesanan", value: total, icon: Package },
    { label: "Sedang aktif", value: active, icon: Clock },
    { label: "Selesai", value: completed, icon: CheckCircle2 },
  ]

  return (
    <Card className="gap-4 p-5">
      <p className="text-sm font-semibold">Ringkasan</p>
      <ul className="grid gap-3">
        {stats.map((stat) => (
          <li key={stat.label} className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="size-5" />
            </span>
            <span className="flex-1 text-sm text-muted-foreground">
              {stat.label}
            </span>
            <span className="text-lg font-semibold tabular-nums">
              {stat.value}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function DesktopSupportCard() {
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Headset className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Butuh bantuan?</p>
          <p className="text-xs text-muted-foreground">
            Chat tim dukungan Jasa Antar
          </p>
        </div>
      </div>
      <SupportButton variant="outline" className="h-10 w-full" />
    </Card>
  )
}

function DesktopStepsCard() {
  const steps = [
    "Buat pesanan & lihat estimasi",
    "Mitra terdekat ditugaskan",
    "Lacak pengiriman real-time",
    "Barang tiba & pembayaran selesai",
  ]

  return (
    <Card className="gap-4 p-5">
      <p className="text-sm font-semibold">Cara pesan</p>
      <ol className="grid gap-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <span className="text-sm text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
