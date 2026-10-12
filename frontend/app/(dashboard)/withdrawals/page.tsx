import Link from "next/link"
import { Info } from "lucide-react"

import { ApiError, serverFetch } from "@/lib/api"
import {
  formatDateTime,
  formatRupiah,
  withdrawalStatusMeta,
} from "@/lib/format"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { CreateWithdrawalButton } from "@/components/withdrawals/create-withdrawal-button"
import { WithdrawalActions } from "@/components/withdrawals/withdrawal-actions"
import type { Withdrawal } from "@/types"

export default async function WithdrawalsPage() {
  let data: Withdrawal[] = []

  try {
    data = await serverFetch<Withdrawal[]>("/admin/withdrawals", {
      cache: "no-store",
    })
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat data pencairan"
        description={err.message}
        action={<Link href="/withdrawals">Coba lagi</Link>}
      />
    )
  }

  const columns: Column<Withdrawal>[] = [
    {
      key: "referenceNo",
      label: "No. Referensi",
      render: (row) => (
        <div className="grid gap-0.5">
          <span className="font-mono text-sm font-medium">
            {row.referenceNo}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.provider}
          </span>
        </div>
      ),
    },
    {
      key: "beneficiaryName",
      label: "Penerima",
      render: (row) => (
        <div className="grid gap-0.5">
          <span>{row.beneficiaryName}</span>
          <span className="text-xs text-muted-foreground">
            {row.bankCode} &middot; {row.bankAccountNumber}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Jumlah",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatRupiah(row.amount),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge meta={withdrawalStatusMeta(row.status)} />,
    },
    {
      key: "submittedAt",
      label: "Diajukan",
      render: (row) => (
        <span className="tabular-nums">
          {row.submittedAt ? formatDateTime(row.submittedAt) : "-"}
        </span>
      ),
    },
    {
      key: "lastCheckedAt",
      label: "Cek Terakhir",
      render: (row) => (
        <span className="tabular-nums">
          {row.lastCheckedAt ? formatDateTime(row.lastCheckedAt) : "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Dibuat",
      render: (row) => (
        <span className="tabular-nums">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      headerClassName: "w-32",
      cellClassName: "text-right",
      render: (row) => <WithdrawalActions withdrawal={row} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Pencairan"
        description="Buat permintaan pencairan dana ke rekening bank dan pantau statusnya."
      >
        <CreateWithdrawalButton />
      </PageHeader>

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <p>
          Membuat pencairan hanya sampai tahap <strong>pembuatan payout</strong>{" "}
          (role Creator) — dana <strong>tidak</strong> otomatis disetujui.
          Persetujuan dilakukan terpisah di dashboard provider (Midtrans Iris /
          Xendit).
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada pencairan"
        emptyDescription="Belum ada permintaan pencairan yang dibuat."
      />
    </>
  )
}
