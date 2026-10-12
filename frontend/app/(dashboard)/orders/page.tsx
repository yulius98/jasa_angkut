import Link from "next/link"

import { ApiError, serverFetch } from "@/lib/api"
import {
  formatDate,
  formatRupiah,
  ORDER_STATUS_META,
  VEHICLE_TYPE_META,
} from "@/lib/format"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { TablePagination } from "@/components/shared/table-pagination"
import { Button } from "@/components/ui/button"
import { OrderStatusFilter } from "@/components/orders/order-status-filter"
import type { OrderListItem } from "@/types"

const PAGE_SIZE = 20

function parsePage(raw: string | undefined, total: number): number {
  const page = Number(raw)
  if (!Number.isInteger(page) || page < 1) return 1
  return Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
}

function buildUrl(status: string | undefined, page: number): string {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) })
  if (status) params.set("status", status)
  return `/orders?${params.toString()}`
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const sp = await searchParams
  const status =
    sp.status && sp.status in ORDER_STATUS_META ? sp.status : undefined
  const requestedPage = Number(sp.page)
  const pageRequested = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1

  let data: OrderListItem[] = []
  let total = 0
  let page = 1

  try {
    const result = await serverFetch<{
      data: OrderListItem[]
      meta: { page: number; limit: number; total: number }
    }>(buildUrl(status, pageRequested), {
      cache: "no-store",
    })
    data = result.data
    total = result.meta.total
    page = parsePage(sp.page, total)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat data pesanan"
        description={err.message}
        action={<Link href="/orders">Coba lagi</Link>}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const columns: Column<OrderListItem>[] = [
    {
      key: "orderNumber",
      label: "No. Order",
      render: (row) => (
        <div className="grid gap-0.5">
          <span className="font-medium tabular-nums">{row.orderNumber}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDate(row.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "vehicleType",
      label: "Tipe Kendaraan",
      render: (row) => <StatusBadge meta={VEHICLE_TYPE_META[row.vehicleType]} />,
    },
    {
      key: "route",
      label: "Rute",
      render: (row) => (
        <div className="grid max-w-md gap-0.5">
          <span className="truncate text-sm">{row.pickupAddress}</span>
          <span className="truncate text-xs text-muted-foreground">
            → {row.dropoffAddress}
          </span>
        </div>
      ),
    },
    {
      key: "finalPrice",
      label: "Harga",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <span className="tabular-nums">
          {formatRupiah(row.finalPrice ?? row.estimatedPrice)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge meta={ORDER_STATUS_META[row.status]} />,
    },
    {
      key: "customer",
      label: "Pelanggan",
      render: (row) => row.customer?.user.name ?? "—",
    },
    {
      key: "partner",
      label: "Mitra",
      render: (row) => (
        <div className="grid gap-0.5">
          <span>{row.partner?.user.name ?? "—"}</span>
          {row.partner?.user.phone ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {row.partner.user.phone}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      headerClassName: "w-20",
      cellClassName: "text-right",
      render: (row) => (
        <Button render={<Link href={`/orders/${row.id}`} />} variant="outline" size="sm" className="h-7" nativeButton={false}>
          Detail
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Pesanan"
        description="Pantau seluruh pesanan beserta status dan perjalanannya."
      >
        <OrderStatusFilter value={status ?? "ALL"} basePath="/orders" />
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada pesanan"
        emptyDescription={
          status
            ? "Tidak ada pesanan dengan status ini."
            : "Belum ada pesanan masuk."
        }
      />

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        buildHref={(p) => buildUrl(status, p)}
      />
    </>
  )
}
