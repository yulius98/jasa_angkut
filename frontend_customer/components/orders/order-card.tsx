import Link from "next/link"
import { ArrowRight, MapPin, Package } from "lucide-react"

import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  VEHICLE_TYPE_META,
  ORDER_STATUS_META,
  formatDateTime,
  formatRupiah,
} from "@/lib/format"
import { VEHICLE_ICON } from "@/lib/orders"
import type { OrderListItem } from "@/types"

export function OrderCard({ order }: { order: OrderListItem }) {
  const VehicleIcon = VEHICLE_ICON[order.vehicleType]
  const price = order.finalPrice ?? order.estimatedPrice

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="gap-3 p-4 transition-colors active:bg-muted/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <VehicleIcon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {VEHICLE_TYPE_META[order.vehicleType].label}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {order.orderNumber}
              </p>
            </div>
          </div>
          <StatusBadge meta={ORDER_STATUS_META[order.status]} />
        </div>

        <div className="grid gap-1.5 border-t pt-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span className="line-clamp-1 text-muted-foreground">
              {order.pickupAddress}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span className="line-clamp-1 text-muted-foreground">
              {order.dropoffAddress}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="size-3.5" />
            {formatDateTime(order.createdAt)}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tabular-nums">
              {formatRupiah(price)}
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>
        </div>
      </Card>
    </Link>
  )
}
