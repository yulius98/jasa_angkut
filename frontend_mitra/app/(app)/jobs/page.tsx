import Link from "next/link"
import { PackageSearch, Truck } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { AvailableOrderCard } from "@/components/jobs/available-order-card"
import { OnlineToggle } from "@/components/partner/online-toggle"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ApiError, serverFetch } from "@/lib/api"
import { requireSession } from "@/lib/session"
import { PartnerStatus, type Order, type Partner } from "@/types"

export const dynamic = "force-dynamic"

export default async function JobsPage() {
  await requireSession()

  let partner: Partner | null = null
  try {
    partner = await serverFetch<Partner>("/partners/me")
  } catch {
    partner = null
  }

  const approved = partner?.status === PartnerStatus.APPROVED
  const online = Boolean(partner?.isOnline)
  const vehicles = partner?.vehicles ?? []

  let orders: Order[] = []
  let error: string | null = null
  if (approved && online && vehicles.some((v) => v.isActive)) {
    try {
      orders = await serverFetch<Order[]>("/orders/available")
    } catch (e) {
      error = e instanceof ApiError ? e.message : "Gagal memuat order tersedia"
    }
  }

  return (
    <div>
      <AppHeader
        title="Cari Order"
        subtitle="Order yang cocok dengan kendaraanmu"
        action={
          partner ? (
            <OnlineToggle
              isOnline={partner.isOnline}
              canToggle={approved}
              label={false}
            />
          ) : null
        }
      />

      <div className="px-4 py-4 lg:px-8 lg:py-8">
        <div className="mx-auto grid w-full max-w-5xl gap-4">
          <Card className="flex-row items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span
                className={
                  online
                    ? "grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-600"
                    : "grid size-10 place-items-center rounded-full bg-muted text-muted-foreground"
                }
              >
                <PackageSearch className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {online ? "Kamu sedang online" : "Kamu sedang offline"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {online
                    ? "Order baru di sekitarmu akan muncul di bawah."
                    : "Nyalakan online untuk mulai melihat order."}
                </p>
              </div>
            </div>
            {partner ? (
              <OnlineToggle
                isOnline={partner.isOnline}
                canToggle={approved}
              />
            ) : null}
          </Card>

          {!partner ? (
            <ErrorState
              title="Profil mitra tidak ditemukan"
              description="Akunmu belum terdaftar sebagai mitra."
            />
          ) : !approved ? (
            <EmptyState
              icon={PackageSearch}
              title="Akun belum terverifikasi"
              description="Kamu bisa menerima order setelah pengajuanmu disetujui admin."
            />
          ) : !online ? (
            <EmptyState
              icon={PackageSearch}
              title="Nyalakan status online"
              description="Aktifkan online agar order di sekitarmu muncul di sini."
            />
          ) : vehicles.filter((v) => v.isActive).length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Belum ada kendaraan aktif"
              description="Tambahkan kendaraan dulu supaya kamu bisa menerima order."
              action={
                <Button nativeButton={false} render={<Link href="/vehicles" />}>
                  <Truck className="size-4" />
                  Kelola Kendaraan
                </Button>
              }
            />
          ) : error ? (
            <ErrorState description={error} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Belum ada order tersedia"
              description="Tarik untuk menyegarkan, atau cek lagi beberapa saat lagi."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {orders.map((order) => (
                <AvailableOrderCard
                  key={order.id}
                  order={order}
                  vehicles={vehicles}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
