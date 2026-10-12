import { BadgeCheck, ShieldAlert, Star, Truck } from "lucide-react"

import { StatusBadge } from "@/components/shared/status-badge"
import { Card } from "@/components/ui/card"
import { PARTNER_STATUS_META, formatNumber, toNumber } from "@/lib/format"
import { PartnerStatus, type Partner } from "@/types"

export function PartnerStatusCard({ partner }: { partner: Partner }) {
  const approved = partner.status === PartnerStatus.APPROVED
  const rating = toNumber(partner.rating)

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-xs text-muted-foreground">Status mitra</p>
          <StatusBadge meta={PARTNER_STATUS_META[partner.status]} />
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Total trip</p>
          <p className="text-lg font-bold tabular-nums">
            {formatNumber(partner.totalTrips)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-amber-500/10 text-amber-600">
            <Star className="size-5 fill-amber-400 text-amber-400" />
          </span>
          <div>
            <p className="text-[11px] text-muted-foreground">Rating</p>
            <p className="text-sm font-semibold tabular-nums">
              {rating > 0 ? formatNumber(rating) : "Belum ada"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
            <Truck className="size-5" />
          </span>
          <div>
            <p className="text-[11px] text-muted-foreground">Kendaraan</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatNumber(partner.vehicles?.length ?? partner._count?.vehicles ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {approved ? (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
          <BadgeCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            Akunmu sudah terverifikasi. Nyalakan status online untuk mulai
            menerima order.
          </span>
        </div>
      ) : partner.status === PartnerStatus.PENDING ? (
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Pengajuanmu sedang ditinjau admin. Kamu akan bisa menerima order
            setelah disetujui.
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            {partner.rejectionReason ??
              "Akunmu belum aktif. Hubungi admin untuk informasi lebih lanjut."}
          </span>
        </div>
      )}

      <div className="grid gap-1 border-t pt-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">No. KTP</span>
          <span className="font-mono">{partner.ktpNumber}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">No. SIM</span>
          <span className="font-mono">{partner.simNumber}</span>
        </div>
      </div>
    </Card>
  )
}
