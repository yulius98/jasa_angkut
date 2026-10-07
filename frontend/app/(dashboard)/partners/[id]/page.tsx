import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PartnerActions } from "@/components/partners/partner-actions"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ApiError, serverFetch } from "@/lib/api"
import {
  formatDate,
  formatNumber,
  PARTNER_STATUS_META,
  VEHICLE_TYPE_META,
} from "@/lib/format"
import type { PartnerDetail } from "@/types"

function formatRating(rating: string | undefined | null): string {
  const value = Number(rating)
  return Number.isFinite(value) && value > 0 ? value.toFixed(1) : "—"
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let detail: PartnerDetail
  try {
    detail = await serverFetch<PartnerDetail>(`/partners/${id}`, {
      cache: "no-store",
    })
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    return (
      <ErrorState
        title="Gagal memuat detail mitra"
        description={err.message}
        action={<Link href="/partners">Kembali ke daftar mitra</Link>}
      />
    )
  }

  const meta = PARTNER_STATUS_META[detail.status]

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Nama", value: detail.user.name },
    { label: "Email", value: detail.user.email },
    { label: "Telepon", value: detail.user.phone ?? "—" },
    { label: "No. KTP", value: <span className="tabular-nums">{detail.ktpNumber}</span> },
    { label: "No. SIM", value: <span className="tabular-nums">{detail.simNumber}</span> },
    { label: "Rating", value: formatRating(detail.rating) },
    {
      label: "Total Penyelesaian",
      value: formatNumber(detail.totalTrips),
    },
    { label: "Bergabung", value: formatDate(detail.createdAt) },
  ]

  return (
    <>
      <PageHeader
        title={detail.user.name}
        description={`Detail pengajuan & profil mitra.`}
      >
        <Link
          href="/partners"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft />
          Kembali
        </Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div className="grid gap-1">
                <CardTitle className="text-base">Profil Partner</CardTitle>
                <CardDescription>
                  Data terdaftar dari pengajuan mitra.
                </CardDescription>
              </div>
              <StatusBadge meta={meta} />
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[8.5rem_1fr] items-baseline gap-2 border-b py-1.5 last:border-0"
                  >
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-sm font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div className="grid gap-1">
                <CardTitle className="text-base">Dokumen Identitas</CardTitle>
                <CardDescription>
                  KTP dan SIM diakses lewat proxy backend (tidak bocor ke URL publik).
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <DocumentViewer
                  label="Lihat KTP"
                  src={`/api/proxy/partners/${id}/documents/ktp`}
                />
                <DocumentViewer
                  label="Lihat SIM"
                  src={`/api/proxy/partners/${id}/documents/sim`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div className="grid gap-1">
                <CardTitle className="text-base">Kendaraan</CardTitle>
                <CardDescription>
                  Kendaraan terdaftar oleh mitra.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {detail.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada kendaraan terdaftar.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {detail.vehicles.map((vehicle) => (
                    <li
                      key={vehicle.id}
                      className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto]"
                    >
                      <div className="grid gap-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {vehicle.brand} {vehicle.model}
                          </span>
                          <StatusBadge meta={VEHICLE_TYPE_META[vehicle.type]} />
                        </div>
                        <p className="text-sm text-muted-foreground tabular-nums">
                          {vehicle.plateNumber} &middot;{" "}
                          {formatNumber(vehicle.maxWeightKg)} kg &middot;{" "}
                          {formatNumber(vehicle.maxVolumeM3)} m³
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                          {vehicle.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                        <DocumentViewer
                          label="STNK"
                          src={`/api/proxy/vehicles/${vehicle.id}/files/stnk`}
                        />
                        <DocumentViewer
                          label="Foto"
                          src={`/api/proxy/vehicles/${vehicle.id}/files/photo`}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tindakan</CardTitle>
              <CardDescription>
                Setujui, tolak, atau suspend mitra ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.rejectionReason ? (
                <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  Alasan: {detail.rejectionReason}
                </p>
              ) : null}
              <PartnerActions id={detail.id} status={detail.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}