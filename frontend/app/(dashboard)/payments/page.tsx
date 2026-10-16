import Link from "next/link"

import { ApiError, serverFetch } from "@/lib/api"
import {
  formatDate,
  formatNumber,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
} from "@/lib/format"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { TablePagination } from "@/components/shared/table-pagination"
import { PaymentStatusFilter } from "@/components/payments/payment-status-filter"
import { PaymentMethodFilter } from "@/components/payments/payment-method-filter"
import { PaymentDateFilter } from "@/components/payments/payment-date-filter"
import { PaymentActions } from "@/components/payments/payment-actions"
import type { PaymentListItem } from "@/types"

const PAGE_SIZE = 20

function parsePage(raw: string | undefined, total: number): number {
  const page = Number(raw)
  if (!Number.isInteger(page) || page < 1) return 1
  return Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
}

function buildQuery(params: {
  status?: string
  method?: string
  dateFrom?: string
  dateTo?: string
  page: number
}): string {
  const search = new URLSearchParams({
    limit: String(PAGE_SIZE),
    page: String(params.page),
  })
  if (params.status) search.set("status", params.status)
  if (params.method) search.set("method", params.method)
  if (params.dateFrom) search.set("dateFrom", params.dateFrom)
  if (params.dateTo) search.set("dateTo", params.dateTo)
  return search.toString()
}

function buildUrl(params: {
  status?: string
  method?: string
  dateFrom?: string
  dateTo?: string
  page: number
}): string {
  return `/payments?${buildQuery(params)}`
}

function buildOtherParams(params: {
  status?: string
  method?: string
  dateFrom?: string
  dateTo?: string
}): string {
  const search = new URLSearchParams()
  if (params.status) search.set("status", params.status)
  if (params.method) search.set("method", params.method)
  if (params.dateFrom) search.set("dateFrom", params.dateFrom)
  if (params.dateTo) search.set("dateTo", params.dateTo)
  return search.toString()
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    method?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }>
}) {
  const sp = await searchParams
  const status =
    sp.status && sp.status in PAYMENT_STATUS_META ? sp.status : undefined
  const method =
    sp.method && sp.method in PAYMENT_METHOD_META ? sp.method : undefined
  const dateFrom = sp.dateFrom
  const dateTo = sp.dateTo
  const requestedPage = Number(sp.page)
  const pageRequested =
    Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1

  let data: PaymentListItem[] = []
  let total = 0
  let page = 1

  try {
    const result = await serverFetch<{
      data: PaymentListItem[]
      meta: { page: number; limit: number; total: number }
    }>(
      buildUrl({
        status,
        method,
        dateFrom,
        dateTo,
        page: pageRequested,
      }),
      { cache: "no-store" }
    )
    data = result.data
    total = result.meta.total
    page = parsePage(sp.page, total)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat data pembayaran"
        description={err.message}
        action={<Link href="/payments">Coba lagi</Link>}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const otherParams = buildOtherParams({ status, method, dateFrom, dateTo })

  const columns: Column<PaymentListItem>[] = [
    {
      key: "orderNumber",
      label: "Order",
      render: (row) => (
        <div className="grid gap-0.5">
          <span className="font-medium">
            {row.order?.orderNumber ?? "-"}
          </span>
          <span className="text-xs text-muted-foreground">{row.id}</span>
        </div>
      ),
    },
    {
      key: "method",
      label: "Metode",
      render: (row) => (
        <span>{PAYMENT_METHOD_META[row.method]?.label ?? row.method}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge meta={PAYMENT_STATUS_META[row.status]} />
      ),
    },
    {
      key: "amount",
      label: "Jumlah",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatNumber(Number(row.amount)),
    },
    {
      key: "commission",
      label: "Komisi",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => {
        const val = row.commissionAmount ? Number(row.commissionAmount) : null
        return val !== null ? formatNumber(val) : "-"
      },
    },
    {
      key: "earning",
      label: "Pendapatan Mitra",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => {
        const val = row.partnerEarning ? Number(row.partnerEarning) : null
        return val !== null ? formatNumber(val) : "-"
      },
    },
    {
      key: "provider",
      label: "Provider",
      render: (row) => <span>{row.gatewayProvider ?? "-"}</span>,
    },
    {
      key: "paidAt",
      label: "Dibayar",
      render: (row) => (
        <span className="tabular-nums">
          {row.paidAt ? formatDate(row.paidAt) : "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Dibuat",
      render: (row) => (
        <span className="tabular-nums">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      headerClassName: "w-28",
      cellClassName: "text-right",
      render: (row) => <PaymentActions payment={row} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Pembayaran"
        description="Pantau pembayaran dan konfirmasi pembayaran tunai."
      >
        <div className="flex flex-wrap items-center gap-2">
          <PaymentStatusFilter
            value={status ?? "ALL"}
            basePath="/payments"
            otherParams={otherParams}
          />
          <PaymentMethodFilter
            value={method ?? "ALL"}
            basePath="/payments"
            otherParams={otherParams}
          />
        </div>
      </PageHeader>

      <div className="mb-4">
        <PaymentDateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          basePath="/payments"
          otherParams={otherParams}
        />
      </div>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada pembayaran"
        emptyDescription="Belum ada data pembayaran sesuai filter."
      />

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        buildHref={(p) =>
          buildUrl({
            status,
            method,
            dateFrom,
            dateTo,
            page: p,
          })
        }
      />
    </>
  )
}
