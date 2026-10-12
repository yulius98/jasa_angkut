import { Truck } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { DeleteVehicleButton } from "@/components/vehicles/delete-vehicle-button"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card } from "@/components/ui/card"
import { serverFetch } from "@/lib/api"
import { requireSession } from "@/lib/session"
import {
  VEHICLE_TYPE_META,
  formatNumber,
  toNumber,
} from "@/lib/format"
import { VEHICLE_ICON } from "@/lib/orders"
import { PartnerStatus, type Partner, type Vehicle } from "@/types"

export const dynamic = "force-dynamic"

export default async function VehiclesPage() {
  await requireSession()

  let partner: Partner | null = null
  try {
    partner = await serverFetch<Partner>("/partners/me")
  } catch {
    partner = null
  }

  const vehicles = partner?.vehicles ?? []
  const canManage =
    partner?.status === PartnerStatus.PENDING ||
    partner?.status === PartnerStatus.APPROVED

  return (
    <div>
      <AppHeader
        title="Kendaraan"
        subtitle="Armada yang bisa menerima order"
        action={canManage ? <VehicleForm /> : null}
      />

      <div className="px-4 py-4 lg:px-8 lg:py-8">
        <div className="mx-auto grid w-full max-w-5xl gap-4">
          {!partner ? (
            <ErrorState
              title="Profil mitra tidak ditemukan"
              description="Akunmu belum terdaftar sebagai mitra."
            />
          ) : vehicles.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Belum ada kendaraan"
              description={
                canManage
                  ? "Tambahkan kendaraan beserta foto STNK agar kamu bisa menerima order."
                  : "Kendaraan bisa ditambahkan saat pengajuanmu sudah diterima."
              }
              action={canManage ? <VehicleForm /> : undefined}
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  canManage={canManage}
                />
              ))}
            </div>
          )}

          {!canManage && partner ? (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Status akunmu saat ini tidak memungkinkan menambah kendaraan.
              Hubungi admin bila dirasa keliru.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function VehicleCard({
  vehicle,
  canManage,
}: {
  vehicle: Vehicle
  canManage: boolean
}) {
  const Icon = VEHICLE_ICON[vehicle.type] ?? Truck

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {vehicle.brand} {vehicle.model}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {vehicle.plateNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge
            meta={{
              label: vehicle.isActive ? "Aktif" : "Nonaktif",
              variant: vehicle.isActive ? "default" : "secondary",
            }}
          />
          {canManage && vehicle.isActive ? (
            <DeleteVehicleButton
              vehicleId={vehicle.id}
              label={`${vehicle.brand} ${vehicle.model}`}
            />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
        <div>
          <p className="text-[11px] text-muted-foreground">Tipe</p>
          <p>{VEHICLE_TYPE_META[vehicle.type].label}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Kapasitas</p>
          <p className="tabular-nums">
            {formatNumber(toNumber(vehicle.maxWeightKg))} kg ·{" "}
            {formatNumber(toNumber(vehicle.maxVolumeM3))} m³
          </p>
        </div>
      </div>
    </Card>
  )
}
