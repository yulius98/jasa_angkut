import Link from "next/link"

import { ApiError, serverFetch } from "@/lib/api"
import { formatDate, formatNumber, type StatusMeta } from "@/lib/format"
import { CustomerSearch } from "@/components/customers/customer-search"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { TablePagination } from "@/components/shared/table-pagination"
import type { CustomerListItem } from "@/types"

const PAGE_SIZE = 20

function parsePage(raw: string | undefined, total: number): number {
  const page = Number(raw)
  if (!Number.isInteger(page) || page < 1) return 1
  return Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
}

function buildUrl(search: string | undefined, page: number): string {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    page: String(page),
  })
  if (search) params.set("search", search)
  return `/admin/customers?${params.toString()}`
}

function customerStatusMeta(row: CustomerListItem): StatusMeta {
  if (!row.isActive) return { label: "Nonaktif", variant: "destructive" }
  if (row.isVerified) return { label: "Terverifikasi", variant: "default" }
  return { label: "Belum verifikasi", variant: "secondary" }
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const sp = await searchParams
  const search = sp.search?.trim() || undefined
  const requestedPage = Number(sp.page)
  const pageRequested =
    Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1

  let data: CustomerListItem[] = []
  let total = 0
  let page = 1

  try {
    const result = await serverFetch<{
      data: CustomerListItem[]
      meta: { page: number; limit: number; total: number }
    }>(buildUrl(search, pageRequested), { cache: "no-store" })
    data = result.data
    total = result.meta.total
    page = parsePage(sp.page, total)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat data pelanggan"
        description={err.message}
        action={<Link href="/customers">Coba lagi</Link>}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const columns: Column<CustomerListItem>[] = [
    {
      key: "name",
      label: "Nama",
      render: (row) => (
        <div className="grid gap-0.5">
          <span className="font-medium">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Telepon",
      render: (row) => <span className="tabular-nums">{row.phone ?? "-"}</span>,
    },
    {
      key: "orders",
      label: "Pesanan",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatNumber(row.customerProfile?._count.orders ?? 0),
    },
    {
      key: "addresses",
      label: "Alamat",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatNumber(row._count.addresses),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge meta={customerStatusMeta(row)} />,
    },
    {
      key: "createdAt",
      label: "Bergabung",
      render: (row) => (
        <span className="tabular-nums">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Pelanggan"
        description="Daftar seluruh pelanggan yang terdaftar."
      >
        <CustomerSearch value={search ?? ""} basePath="/customers" />
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada pelanggan"
        emptyDescription={
          search
            ? "Tidak ada pelanggan yang cocok dengan pencarian."
            : "Belum ada pelanggan terdaftar."
        }
      />

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        buildHref={(p) => buildUrl(search, p)}
      />
    </>
  )
}
