import Link from "next/link"

import { ApiError, serverFetch } from "@/lib/api"
import {
  VEHICLE_TYPE_META,
  formatNumber,
} from "@/lib/format"
import { DataTable, type Column } from "@/components/shared/data-table"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { ZoneActions } from "@/components/pricing/zone-actions"
import { AddZoneButton } from "@/components/pricing/add-zone-button"
import { VehicleTypeFilter } from "@/components/pricing/vehicle-type-filter"
import type { PricingZone } from "@/types"

export default async function PricingZonesPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleType?: string }>
}) {
  const sp = await searchParams
  const vehicleType =
    sp.vehicleType && sp.vehicleType in VEHICLE_TYPE_META
      ? sp.vehicleType
      : undefined

  let data: PricingZone[] = []

  try {
    const query = vehicleType ? `?vehicleType=${vehicleType}` : ""
    data = await serverFetch<PricingZone[]>(`/pricing/zones${query}`, {
      cache: "no-store",
    })
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat zona harga"
        description={err.message}
        action={<Link href="/pricing/zones">Coba lagi</Link>}
      />
    )
  }

  const columns: Column<PricingZone>[] = [
    {
      key: "name",
      label: "Nama",
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: "vehicleType",
      label: "Tipe Kendaraan",
      render: (row) => <span>{VEHICLE_TYPE_META[row.vehicleType].label}</span>,
    },
    {
      key: "baseFare",
      label: "Tarif Dasar",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatNumber(Number(row.baseFare)),
    },
    {
      key: "perKmRate",
      label: "Tarif per Km",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => formatNumber(Number(row.perKmRate)),
    },
    {
      key: "minDistance",
      label: "Jarak Minimum",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums",
      render: (row) => `${formatNumber(Number(row.minDistance))} km`,
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
      render: (row) => <ZoneActions zone={row} />,
    },
  ]

  return (
    <>
      <PageHeader
        title="Zona Harga"
        description="Kelola tarif dasar dan tarif per km per tipe kendaraan."
      >
        <VehicleTypeFilter
          value={vehicleType ?? "ALL"}
          basePath="/pricing/zones"
        />
        <AddZoneButton />
      </PageHeader>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada zona harga"
        emptyDescription="Belum ada zona tarif yang dibuat."
      />
    </>
  )
}
