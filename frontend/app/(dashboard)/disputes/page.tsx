import Link from "next/link"

import { ApiError, serverFetch } from "@/lib/api"
import {
  DISPUTE_STATUS_META,
  ORDER_STATUS_META,
  disputeStatusMeta,
  formatDateTime,
  formatRupiah,
} from "@/lib/format"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { TablePagination } from "@/components/shared/table-pagination"
import { DisputeActions } from "@/components/disputes/dispute-actions"
import { DisputeStatusFilter } from "@/components/disputes/dispute-status-filter"
import type { DisputeListItem } from "@/types"

const PAGE_SIZE = 20

function parsePage(raw: string | undefined, total: number): number {
  const page = Number(raw)
  if (!Number.isInteger(page) || page < 1) return 1
  return Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
}

function buildUrl(status: string | undefined, page: number): string {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    page: String(page),
  })
  if (status) params.set("status", status)
  return `/admin/disputes?${params.toString()}`
}

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const sp = await searchParams
  const status =
    sp.status && sp.status in DISPUTE_STATUS_META ? sp.status : undefined
  const requestedPage = Number(sp.page)
  const pageRequested =
    Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1

  let data: DisputeListItem[] = []
  let total = 0
  let page = 1

  try {
    const result = await serverFetch<{
      data: DisputeListItem[]
      meta: { page: number; limit: number; total: number }
    }>(buildUrl(status, pageRequested), { cache: "no-store" })
    data = result.data
    total = result.meta.total
    page = parsePage(sp.page, total)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat data dispute"
        description={err.message}
        action={<Link href="/disputes">Coba lagi</Link>}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const columns: Column<DisputeListItem>[] = [
    {
      key: "orderNumber",
      label: "Order",
      render: (row) => (
        <div className="grid gap-0.5">
          <span className="font-medium tabular-nums">
            {row.order?.orderNumber ?? "-"}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTime(row.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "orderStatus",
      label: "Status Pesanan",
      render: (row) =>
        row.order ? (
          <StatusBadge meta={ORDER_STATUS_META[row.order.status]} />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "finalPrice",
      label: "Harga Final",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) =>
        row.order?.finalPrice ? formatRupiah(row.order.finalPrice) : "-",
    },
    {
      key: "reason",
      label: "Alasan",
      render: (row) => (
        <p className="max-w-xs truncate text-sm" title={row.reason}>
          {row.reason}
        </p>
      ),
    },
    {
      key: "status",
      label: "Status Dispute",
      render: (row) => <StatusBadge meta={disputeStatusMeta(row.status)} />,
    },
    {
      key: "resolvedAt",
      label: "Diselesaikan",
      render: (row) => (
        <span className="tabular-nums">
          {row.resolvedAt ? formatDateTime(row.resolvedAt) : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      headerClassName: "w-40",
      cellClassName: "text-right",
      render: (row) => <DisputeActions dispute={row} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Dispute"
        description="Tinjau sengketa pesanan dan selesaikan. Menyelesaikan dispute tidak otomatis mengubah status pesanan."
      >
        <DisputeStatusFilter value={status ?? "ALL"} basePath="/disputes" />
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada dispute"
        emptyDescription={
          status
            ? "Tidak ada dispute dengan status ini."
            : "Belum ada sengketa yang diajukan."
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
