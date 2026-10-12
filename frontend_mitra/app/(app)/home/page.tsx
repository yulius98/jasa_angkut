import Link from "next/link"
import {
  ClipboardList,
  MessageCircle,
  PackageSearch,
  Star,
  Truck,
  Wallet,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { OnlineToggle } from "@/components/partner/online-toggle"
import { PartnerStatusCard } from "@/components/partner/partner-status-card"
import { PartnerOrderCard } from "@/components/orders/partner-order-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { StatCard } from "@/components/shared/stat-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ApiError, serverFetch } from "@/lib/api"
import { requireSession } from "@/lib/session"
import { formatNumber, toNumber } from "@/lib/format"
import { isActiveStatus } from "@/lib/orders"
import { PartnerStatus, type OrderListItem, type Paginated, type Partner } from "@/types"

export const dynamic = "force-dynamic"

const QUICK_ACTIONS = [
  {
    href: "/jobs",
    label: "Cari Order",
    description: "Lihat order tersedia",
    icon: PackageSearch,
  },
  {
    href: "/vehicles",
    label: "Kendaraan",
    description: "Kelola armada",
    icon: Truck,
  },
  {
    href: "/chat",
    label: "Chat",
    description: "Pelanggan & dukungan",
    icon: MessageCircle,
  },
] as const

export default async function HomePage() {
  const session = await requireSession()

  let partner: Partner | null = null
  try {
    partner = await serverFetch<Partner>("/partners/me")
  } catch {
    partner = null
  }

  let orders: OrderListItem[] = []
  let ordersError: string | null = null
  try {
    const res = await serverFetch<Paginated<OrderListItem>>(
      "/orders/partner/me?limit=50"
    )
    orders = res.data
  } catch (e) {
    ordersError = e instanceof ApiError ? e.message : "Gagal memuat pesanan"
  }

  const activeOrders = orders.filter((o) => isActiveStatus(o.status))
  const completedOrders = orders.filter((o) => o.status === "COMPLETED")
  const approved = partner?.status === PartnerStatus.APPROVED
  const rating = toNumber(partner?.rating)

  return (
    <div>
      <header className="sticky top-0 z-30 border-b bg-background/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Selamat datang,</p>
            <p className="truncate text-sm font-semibold">
              {session.user?.name}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {partner ? (
              <OnlineToggle
                isOnline={partner.isOnline}
                canToggle={approved}
              />
            ) : null}
          </div>
        </div>
      </header>

      <div className="px-4 py-4 lg:px-8 lg:py-8">
        <div className="mx-auto grid w-full max-w-6xl gap-4 lg:gap-6">
          <div className="hidden items-end justify-between gap-3 lg:flex">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                Beranda
              </h1>
              <p className="text-sm text-muted-foreground">
                Ringkasan aktivitas mitra {session.user?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {partner ? (
                <OnlineToggle
                  isOnline={partner.isOnline}
                  canToggle={approved}
                />
              ) : null}
            </div>
          </div>

          {!partner ? (
            <ErrorState
              title="Profil mitra tidak ditemukan"
              description="Akunmu belum terdaftar sebagai mitra. Hubungi admin untuk bantuan."
            />
          ) : (
            <PartnerStatusCard partner={partner} />
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Order aktif"
              value={formatNumber(activeOrders.length)}
              icon={ClipboardList}
              href="/orders"
              accent
            />
            <StatCard
              label="Order selesai"
              value={formatNumber(completedOrders.length)}
              icon={Wallet}
              href="/orders"
            />
            <StatCard
              label="Rating"
              value={rating > 0 ? formatNumber(rating) : "-"}
              hint={rating > 0 ? "dari pelanggan" : "belum ada rating"}
              icon={Star}
            />
            <StatCard
              label="Total trip"
              value={formatNumber(partner?.totalTrips ?? 0)}
              icon={Truck}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="grid gap-4 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Order aktif</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/orders" />}
                >
                  Lihat semua
                </Button>
              </div>

              {ordersError ? (
                <ErrorState description={ordersError} />
              ) : activeOrders.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Belum ada order aktif"
                  description={
                    approved
                      ? "Nyalakan status online lalu cari order di sekitarmu."
                      : "Order akan muncul setelah akunmu disetujui admin."
                  }
                  action={
                    approved ? (
                      <Button
                        nativeButton={false}
                        render={<Link href="/jobs" />}
                      >
                        <PackageSearch className="size-4" />
                        Cari Order
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid gap-3">
                  {activeOrders.slice(0, 4).map((order) => (
                    <PartnerOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <Card className="gap-2 p-4">
                <h2 className="text-sm font-semibold">Aksi cepat</h2>
                <div className="grid gap-1">
                  {QUICK_ACTIONS.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
                    >
                      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <action.icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {action.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {action.description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card className="gap-2 p-4">
                <h2 className="text-sm font-semibold">Tips mitra</h2>
                <ul className="grid gap-2 text-xs text-muted-foreground">
                  <li>
                    Tetap <span className="font-medium">online</span> saat siap
                    jalan agar order di sekitarmu muncul.
                  </li>
                  <li>
                    Perbarui status order secara berkala supaya pelanggan bisa
                    melacak pengiriman.
                  </li>
                  <li>
                    Tambahkan kendaraan sesuai tipe agar semakin banyak order
                    yang cocok untukmu.
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
