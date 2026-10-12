import Link from "next/link"

import { ApiError, serverFetch } from "@/lib/api"
import { PROMO_TYPE_META, formatNumber, formatDate } from "@/lib/format"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { AddPromoButton } from "@/components/pricing/add-promo-button"
import { PromoActions } from "@/components/pricing/promo-actions"
import type { PromoCode } from "@/types"

export default async function PricingPromosPage() {
  let data: PromoCode[] = []

  try {
    data = await serverFetch<PromoCode[]>("/pricing/promos", {
      cache: "no-store",
    })
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat kode promo"
        description={err.message}
        action={<Link href="/pricing/promos">Coba lagi</Link>}
      />
    )
  }

  const columns: Column<PromoCode>[] = [
    {
      key: "code",
      label: "Kode",
      render: (row) => (
        <span className="font-mono font-medium">{row.code}</span>
      ),
    },
    {
      key: "type",
      label: "Tipe",
      render: (row) => (
        <span>{PROMO_TYPE_META[row.type].label}</span>
      ),
    },
    {
      key: "value",
      label: "Nilai",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) =>
        row.type === "PERCENTAGE"
          ? `${row.value}%`
          : formatNumber(Number(row.value)),
    },
    {
      key: "maxDiscount",
      label: "Diskon Maks",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) =>
        row.maxDiscount ? formatNumber(Number(row.maxDiscount)) : "-",
    },
    {
      key: "minOrderValue",
      label: "Min. Order",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) =>
        row.minOrderValue ? formatNumber(Number(row.minOrderValue)) : "-",
    },
    {
      key: "usage",
      label: "Pemakaian",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) =>
        `${formatNumber(row.usedCount)}${
          row.usageLimit ? ` / ${formatNumber(row.usageLimit)}` : ""
        }`,
    },
    {
      key: "validFrom",
      label: "Berlaku",
      render: (row) => (
        <div className="grid gap-0.5">
          <span className="tabular-nums">{formatDate(row.validFrom)}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            s/d {formatDate(row.validUntil)}
          </span>
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <StatusBadge
          meta={
            row.isActive
              ? { label: "Aktif", variant: "default" }
              : { label: "Nonaktif", variant: "secondary" }
          }
        />
      ),
    },
    {
      key: "actions",
      label: "",
      headerClassName: "w-44",
      cellClassName: "text-right",
      render: (row) => <PromoActions promo={row} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Kode Promo"
        description="Kelola kode promo dan periode berlakunya."
      >
        <AddPromoButton />
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada kode promo"
        emptyDescription="Belum ada kode promo yang dibuat."
      />
    </>
  )
}
