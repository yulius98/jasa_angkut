import Link from "next/link"

import { ApiError, serverFetch } from "@/lib/api"
import {
  formatDate,
  formatNumber,
  PARTNER_STATUS_META,
} from "@/lib/format"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { TablePagination } from "@/components/shared/table-pagination"
import { Button } from "@/components/ui/button"
import { StatusFilter } from "@/components/partners/status-filter"
import type { PartnerListItem } from "@/types"

const PAGE_SIZE = 20

function parsePage(raw: string | undefined, total: number): number {
  const page = Number(raw)
  if (!Number.isInteger(page) || page < 1) return 1
  return Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
}

function buildUrl(status: string | undefined, page: number): string {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) })
  if (status) params.set("status", status)
  return `/partners?${params.toString()}`
}

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const sp = await searchParams
  const status =
    sp.status && sp.status in PARTNER_STATUS_META ? sp.status : undefined
  const requestedPage = Number(sp.page)
  const pageRequested = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1

  let data: PartnerListItem[] = []
  let total = 0
  let page = 1

  try {
    const result = await serverFetch<{
      data: PartnerListItem[]
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
        title="Gagal memuat data mitra"
        description={err.message}
        action={<Link href="/partners">Coba lagi</Link>}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const columns: Column<PartnerListItem>[] = [
    {
      key: "name",
      label: "Nama",
      render: (row) => (
        <div className="grid gap-0.5">
          <span className="font-medium">{row.user.name}</span>
          <span className="text-xs text-muted-foreground">{row.user.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Telepon",
      render: (row) => <span className="tabular-nums">{row.user.phone ?? "-"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge meta={PARTNER_STATUS_META[row.status]} />
      ),
    },
    {
      key: "vehicles",
      label: "Kendaraan",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatNumber(row._count.vehicles),
    },
    {
      key: "rating",
      label: "Rating",
      render: (row) => {
        const rating = Number(row.rating)
        return (
          <span className="tabular-nums">
            {Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : "—"}
          </span>
        )
      },
    },
    {
      key: "createdAt",
      label: "Bergabung",
      render: (row) => (
        <span className="tabular-nums">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      headerClassName: "w-20",
      cellClassName: "text-right",
      render: (row) => (
        <Button render={<Link href={`/partners/${row.id}`} />} variant="outline" size="sm" className="h-7">
          Detail
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Verifikasi Mitra"
        description="Tinjau dan kelola pengajuan mitra."
      >
        <StatusFilter value={status ?? "ALL"} basePath="/partners" />
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada mitra"
        emptyDescription={
          status
            ? "Tidak ada mitra dengan status ini."
            : "Belum ada mitra terdaftar."
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