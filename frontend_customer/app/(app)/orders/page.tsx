import Link from "next/link"
import { ClipboardList, Plus } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { OrderCard } from "@/components/orders/order-card"
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
  { key: "all", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Batal" },
] as const

type TabKey = (typeof TABS)[number]["key"]

function filterOrders(orders: OrderListItem[], tab: TabKey): OrderListItem[] {
  switch (tab) {
    case "active":
      return orders.filter(
        (o) => isActiveStatus(o.status) || o.status === "PENDING"
      )
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
  const tab = (TABS.find((t) => t.key === params.tab)?.key ?? "all") as TabKey

  let orders: OrderListItem[] = []
  let error: string | null = null
  try {
    const res = await serverFetch<Paginated<OrderListItem>>(
      "/orders/me?limit=50"
    )
    orders = res.data
  } catch (e) {
    error = e instanceof ApiError ? e.message : "Gagal memuat pesanan"
  }

  const filtered = filterOrders(orders, tab)

  return (
    <div>
      <AppHeader
        title="Pesanan Saya"
        subtitle={session.user?.name}
        action={
          <Button
            size="icon"
            variant="ghost"
            aria-label="Pesan baru"
            nativeButton={false}
            render={<Link href="/orders/new" />}
          >
            <Plus className="size-5" />
          </Button>
        }
      />

      <div className="sticky top-14 z-20 border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.key === "all" ? "/orders" : `/orders?tab=${t.key}`}
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

      <div className="grid gap-3 px-4 py-4">
        {error ? (
          <ErrorState description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Tidak ada pesanan"
            description={
              tab === "all"
                ? "Pesanan yang kamu buat akan muncul di sini."
                : "Belum ada pesanan pada kategori ini."
            }
            action={
              <Button nativeButton={false} render={<Link href="/orders/new" />}>
                <Plus className="size-4" />
                Pesan Sekarang
              </Button>
            }
          />
        ) : (
          filtered.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  )
}
