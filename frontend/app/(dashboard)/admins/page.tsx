import Link from "next/link"

import { AdminRowActions } from "@/components/admins/admin-row-actions"
import { AdminSearch } from "@/components/admins/admin-search"
import { CreateAdminButton } from "@/components/admins/create-admin-button"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { TablePagination } from "@/components/shared/table-pagination"
import { ApiError, serverFetch } from "@/lib/api"
import { USER_ROLE_META, formatDate, type StatusMeta } from "@/lib/format"
import { requireSession } from "@/lib/session"
import type { AdminListItem } from "@/types"

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
  return `/admin/admins?${params.toString()}`
}

function adminStatusMeta(row: AdminListItem): StatusMeta {
  if (!row.isActive) return { label: "Nonaktif", variant: "destructive" }
  return { label: "Aktif", variant: "default" }
}

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const [sp, session] = await Promise.all([searchParams, requireSession()])
  const currentUserId = session.user?.id
  const search = sp.search?.trim() || undefined
  const requestedPage = Number(sp.page)
  const pageRequested =
    Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1

  let data: AdminListItem[] = []
  let total = 0
  let page = 1

  try {
    const result = await serverFetch<{
      data: AdminListItem[]
      meta: { page: number; limit: number; total: number }
    }>(buildUrl(search, pageRequested), { cache: "no-store" })
    data = result.data
    total = result.meta.total
    page = parsePage(sp.page, total)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat data admin"
        description={err.message}
        action={<Link href="/admins">Coba lagi</Link>}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const columns: Column<AdminListItem>[] = [
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
      key: "role",
      label: "Role",
      render: (row) => <StatusBadge meta={USER_ROLE_META[row.role]} />,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge meta={adminStatusMeta(row)} />,
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
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end">
          <AdminRowActions admin={row} isSelf={row.id === currentUserId} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Kelola Admin"
        description="Kelola akun dengan akses admin dan super admin."
      >
        <AdminSearch value={search ?? ""} basePath="/admins" />
        <CreateAdminButton />
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada admin"
        emptyDescription={
          search
            ? "Tidak ada admin yang cocok dengan pencarian."
            : "Belum ada akun admin selain Anda."
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
