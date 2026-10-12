"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, MapPin, Navigation, Package } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "cn"
import { acceptOrderAction } from "@/lib/actions/orders"
import {
  VEHICLE_TYPE_META,
  formatDistance,
  formatRelative,
  formatRupiah,
} from "@/lib/format"
import { VEHICLE_ICON } from "@/lib/orders"
import type { Order, Vehicle } from "@/types"

export function AvailableOrderCard({
  order,
  vehicles,
}: {
  order: Order
  vehicles: Vehicle[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [accepting, setAccepting] = useState(false)

  const matching = vehicles.filter(
    (v) => v.isActive && v.type === order.vehicleType
  )
  const [selected, setSelected] = useState(matching[0]?.id ?? "")

  const VehicleIcon = VEHICLE_ICON[order.vehicleType]

  async function accept() {
    if (!selected || accepting) return
    setAccepting(true)
    const result = await acceptOrderAction(order.id, selected)
    if (!result.ok) {
      toast.error(result.message)
      setAccepting(false)
      return
    }
    toast.success("Order berhasil diambil")
    setOpen(false)
    router.push(`/orders/${order.id}`)
    router.refresh()
  }

  return (
    <Card className="gap-3 p-4">
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
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {formatRupiah(order.finalPrice ?? order.estimatedPrice)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatDistance(order.distanceKm)}
          </p>
        </div>
      </div>

      <div className="grid gap-1.5 border-t pt-3">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <span className="line-clamp-2 text-muted-foreground">
            {order.pickupAddress}
          </span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span className="line-clamp-2 text-muted-foreground">
            {order.dropoffAddress}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {formatRelative(order.createdAt)}
        </span>
        <Button
          onClick={() => setOpen(true)}
          disabled={matching.length === 0}
          className="gap-2"
        >
          <Navigation className="size-4" />
          Ambil Order
        </Button>
      </div>

      {matching.length === 0 ? (
        <p className="text-xs text-destructive">
          Kamu belum punya kendaraan aktif bertipe{" "}
          {VEHICLE_TYPE_META[order.vehicleType].label}. Tambahkan di menu
          Kendaraan.
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ambil order ini?</DialogTitle>
            <DialogDescription>
              Pilih kendaraan yang akan kamu pakai. Order akan ditugaskan ke
              kamu dan pelanggan akan diberi tahu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            {matching.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setSelected(vehicle.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                  selected === vehicle.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Package className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.plateNumber}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "size-4 rounded-full border",
                    selected === vehicle.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={accepting}
            >
              Batal
            </Button>
            <Button onClick={accept} disabled={!selected || accepting}>
              {accepting ? <Spinner /> : <Navigation className="size-4" />}
              Ambil Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
