import Link from "next/link"
import { ArrowRight, Banknote, ClipboardList, Scale, Users, Wallet } from "lucide-react"

import { ApiError, serverFetch } from "@/lib/api"
import {
  formatNumber,
  formatRupiah,
  ORDER_STATUS_META,
  ORDER_STATUSES,
  PARTNER_STATUS_META,
  PARTNER_STATUSES,
} from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { StatusDistribution } from "@/components/shared/status-distribution"
import { ErrorState } from "@/components/shared/error-state"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DashboardStats } from "@/types"

export default async function DashboardPage() {
  let stats: DashboardStats
  try {
    stats = await serverFetch<DashboardStats>("/admin/dashboard", {
      cache: "no-store",
    })
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat dashboard"
        description={err.message}
        action={<Link href="/dashboard">Coba lagi</Link>}
      />
    )
  }

  const partnerTotal = PARTNER_STATUSES.reduce(
    (sum, s) => sum + (stats.partners.byStatus[s] ?? 0),
    0
  )
  const partnerPending = stats.partners.byStatus.PENDING ?? 0
  const openDisputes = stats.disputes.open ?? 0

  const orderItems = ORDER_STATUSES.map((status) => ({
    key: status,
    count: stats.orders.byStatus[status] ?? 0,
    meta: ORDER_STATUS_META[status],
  }))

  const partnerItems = PARTNER_STATUSES.map((status) => ({
    key: status,
    count: stats.partners.byStatus[status] ?? 0,
    meta: PARTNER_STATUS_META[status],
  }))

  const quickActions = [
    {
      href: `/partners?status=PENDING`,
      label: "Verifikasi mitra baru",
      detail: `${partnerPending} mitra menunggu`,
      highlight: partnerPending > 0,
    },
    {
      href: `/disputes?status=open`,
      label: "Tangani dispute terbuka",
      detail: `${openDisputes} dispute`,
      highlight: openDisputes > 0,
    },
    {
      href: `/orders`,
      label: "Pantau pesanan",
      detail: `${formatNumber(stats.orders.total)} total pesanan`,
      highlight: stats.orders.total > 0,
    },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional Jasa Antar."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Pesanan"
          value={formatNumber(stats.orders.total)}
          icon={ClipboardList}
          hint={`${formatNumber(stats.customers.total ?? 0)} pelanggan`}
        />
        <StatCard
          label="GMV"
          value={formatRupiah(stats.revenue.gmv ?? 0)}
          icon={Wallet}
          hint="Pembayaran lunas"
        />
        <StatCard
          label="Komisi Platform"
          value={formatRupiah(stats.revenue.totalCommission ?? 0)}
          icon={Banknote}
          hint="Pendapatan platform"
        />
        <StatCard
          label="Mitra"
          value={formatNumber(partnerTotal)}
          icon={Users}
          hint={`${partnerPending} menunggu verifikasi`}
          href={partnerPending > 0 ? "/partners?status=PENDING" : "/partners"}
        />
        <StatCard
          label="Dispute Terbuka"
          value={formatNumber(openDisputes)}
          icon={Scale}
          accent
          hint={openDisputes > 0 ? "Butuh tindakan" : "Tidak ada"}
          href={openDisputes > 0 ? "/disputes?status=open" : "/disputes"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pesanan per Status</CardTitle>
            <CardDescription>
              Distribusi semua status, termasuk yang masih nol.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistribution items={orderItems} total={stats.orders.total} />
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Link
              href="/orders"
              className="text-sm font-medium text-primary hover:underline"
            >
              Lihat semua pesanan
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mitra per Status</CardTitle>
            <CardDescription>
              Distribusi mitra terdaftar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistribution
              items={partnerItems}
              total={partnerTotal}
            />
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Link
              href="/partners"
              className="text-sm font-medium text-primary hover:underline"
            >
              Lihat semua mitra
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pintasan Aksi</CardTitle>
          <CardDescription>
            Hal yang perlu perhatian atau akses cepat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-3">
            {quickActions.map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="group flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">{action.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {action.detail}
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  )
}