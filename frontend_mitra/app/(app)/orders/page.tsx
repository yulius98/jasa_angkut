import Link from "next/link"
import { ClipboardList } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { PartnerOrderCard } from "@/components/orders/partner-order-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import { ApiError, serverFetch } from "@/lib/api"
import { requireSession } from "@/lib/session"
import { isActiveStatus } from "@/lib/orders"
import type { OrderListItem, Paginated } from "@/types"

export const dynamic = "force-dynamic"

const TABS = [
  { key: "active", label: "Aktif" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Batal" },
  { key: "all", label: "Semua" },
] as const

type TabKey = (typeof TABS)[number]["key"]

function filterOrders(orders: OrderListItem[], tab: TabKey): OrderListItem[] {
  switch (tab) {
    case "active":
      return orders.filter((o) => isActiveStatus(o.status))
    case "completed":
      return orders.filter((o) => o.status === "COMPLETED")
    case "cancelled":
      return orders.filter(
        (o) => o.status === "CANCELLED" || o.status === "DISPUTED"
      )
    default:
      return orders
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const [session, params] = await Promise.all([requireSession(), searchParams])
  const tab = (TABS.find((t) => t.key === params.tab)?.key ?? "active") as TabKey

  let orders: OrderListItem[] = []
  let error: string | null = null
  try {
    const res = await serverFetch<Paginated<OrderListItem>>(
      "/orders/partner/me?limit=50"
    )
    orders = res.data
  } catch (e) {
    error = e instanceof ApiError ? e.message : "Gagal memuat pesanan"
  }

  const filtered = filterOrders(orders, tab)

  return (
    <div>
      <AppHeader title="Pesanan" subtitle={session.user?.name} />

      <div className="sticky top-14 z-20 border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl gap-1 rounded-xl bg-muted p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.key === "active" ? "/orders" : `/orders?tab=${t.key}`}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition-colors",
                tab === t.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 lg:px-8 lg:py-8">
        <div className="mx-auto grid w-full max-w-5xl gap-3 lg:grid-cols-2">
          {error ? (
            <div className="lg:col-span-2">
              <ErrorState description={error} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="lg:col-span-2">
              <EmptyState
                icon={ClipboardList}
                title="Tidak ada pesanan"
                description={
                  tab === "active"
                    ? "Order yang kamu ambil akan muncul di sini."
                    : "Belum ada pesanan pada kategori ini."
                }
                action={
                  <Button nativeButton={false} render={<Link href="/jobs" />}>
                    Cari Order
                  </Button>
                }
              />
            </div>
          ) : (
            filtered.map((order) => (
              <PartnerOrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
