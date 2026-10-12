"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, CheckCircle2, Tag, X, Zap } from "lucide-react"
import { toast } from "sonner"

import { LocationPicker, type LatLng } from "@/components/map/location-picker"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "cn"
import { createOrderAction } from "@/lib/actions/orders"
import { VEHICLE_TYPE_META, formatNumber, formatRupiah } from "@/lib/format"
import { VEHICLE_ICON } from "@/lib/orders"
import type { EstimatePrice, VehicleType } from "@/types"

const VEHICLE_OPTIONS: { type: VehicleType; description: string }[] = [
  { type: "MOTORCYCLE", description: "Barang kecil & dokumen" },
  { type: "PICKUP", description: "Barang sedang, muatan ringan" },
  { type: "BOX_TRUCK", description: "Pindahan & muatan besar" },
  { type: "LARGE_TRUCK", description: "Muatan sangat besar" },
]

export function CreateOrderForm({ apiKey }: { apiKey: string }) {
  const router = useRouter()

  const [pickup, setPickup] = useState<LatLng | null>(null)
  const [pickupAddress, setPickupAddress] = useState("")
  const [dropoff, setDropoff] = useState<LatLng | null>(null)
  const [dropoffAddress, setDropoffAddress] = useState("")
  const [vehicleType, setVehicleType] = useState<VehicleType>("MOTORCYCLE")
  const [itemDescription, setItemDescription] = useState("")
  const [scheduleMode, setScheduleMode] = useState<"asap" | "scheduled">("asap")
  const [scheduledAt, setScheduledAt] = useState("")
  const [promoInput, setPromoInput] = useState("")
  const [promoCode, setPromoCode] = useState<string | undefined>()

  const [estimate, setEstimate] = useState<EstimatePrice | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [estimateError, setEstimateError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runEstimate = useCallback(
    async (promo?: string) => {
      if (!pickup || !dropoff) return
      setEstimating(true)
      setEstimateError(null)
      try {
        const res = await fetch("/api/proxy/pricing/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupLatitude: pickup.lat,
            pickupLongitude: pickup.lng,
            dropoffLatitude: dropoff.lat,
            dropoffLongitude: dropoff.lng,
            vehicleType,
            promoCode: promo,
          }),
        })
        const data = (await res.json().catch(() => null)) as
          | EstimatePrice
          | { message?: string }
          | null
        if (!res.ok) {
          setEstimate(null)
          setEstimateError(
            (data as { message?: string })?.message ??
              "Tidak dapat menghitung estimasi"
          )
          return
        }
        setEstimate(data as EstimatePrice)
      } catch {
        setEstimate(null)
        setEstimateError("Tidak dapat menghitung estimasi.")
      } finally {
        setEstimating(false)
      }
    },
    [pickup, dropoff, vehicleType]
  )

  useEffect(() => {
    if (!pickup || !dropoff) return
    const timer = setTimeout(() => runEstimate(promoCode), 400)
    return () => clearTimeout(timer)
  }, [pickup, dropoff, vehicleType, promoCode, runEstimate])

  function applyPromo() {
    const code = promoInput.trim()
    if (!code) return
    setPromoCode(code)
  }

  function clearPromo() {
    setPromoInput("")
    setPromoCode(undefined)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!pickup || !pickupAddress.trim()) {
      setError("Lengkapi alamat dan titik jemput.")
      return
    }
    if (!dropoff || !dropoffAddress.trim()) {
      setError("Lengkapi alamat dan titik tujuan.")
      return
    }
    if (scheduleMode === "scheduled" && !scheduledAt) {
      setError("Pilih tanggal & waktu penjemputan.")
      return
    }

    setSubmitting(true)
    const result = await createOrderAction({
      pickupAddress: pickupAddress.trim(),
      pickupLatitude: pickup.lat,
      pickupLongitude: pickup.lng,
      dropoffAddress: dropoffAddress.trim(),
      dropoffLatitude: dropoff.lat,
      dropoffLongitude: dropoff.lng,
      vehicleType,
      itemDescription: itemDescription.trim() || undefined,
      scheduledAt:
        scheduleMode === "scheduled"
          ? new Date(scheduledAt).toISOString()
          : undefined,
      promoCode,
    })

    if (!result.ok) {
      setError(result.message)
      setSubmitting(false)
      toast.error(result.message)
      return
    }
    toast.success("Pesanan dibuat")
    router.push(`/orders/${result.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 px-4 py-4">
      <Card className="gap-4 p-4">
        <h2 className="text-sm font-semibold">Titik jemput</h2>
        <LocationPicker
          apiKey={apiKey}
          value={pickup}
          onChange={setPickup}
          onAddressChange={setPickupAddress}
        />
        <Field>
          <FieldLabel htmlFor="pickupAddress">Alamat jemput</FieldLabel>
          <Input
            id="pickupAddress"
            placeholder="Nama jalan, gedung, patokan"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            required
          />
        </Field>
      </Card>

      <Card className="gap-4 p-4">
        <h2 className="text-sm font-semibold">Titik tujuan</h2>
        <LocationPicker
          apiKey={apiKey}
          value={dropoff}
          onChange={setDropoff}
          onAddressChange={setDropoffAddress}
        />
        <Field>
          <FieldLabel htmlFor="dropoffAddress">Alamat tujuan</FieldLabel>
          <Input
            id="dropoffAddress"
            placeholder="Nama jalan, gedung, patokan"
            value={dropoffAddress}
            onChange={(e) => setDropoffAddress(e.target.value)}
            required
          />
        </Field>
      </Card>

      <Card className="gap-4 p-4">
        <h2 className="text-sm font-semibold">Jenis kendaraan</h2>
        <div className="grid grid-cols-2 gap-2">
          {VEHICLE_OPTIONS.map((option) => {
            const Icon = VEHICLE_ICON[option.type]
            const selected = vehicleType === option.type
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => setVehicleType(option.type)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                )}
                aria-pressed={selected}
              >
                <span className="flex w-full items-center justify-between">
                  <Icon
                    className={cn(
                      "size-5",
                      selected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {selected ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : null}
                </span>
                <span className="text-sm font-medium">
                  {VEHICLE_TYPE_META[option.type].label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="gap-4 p-4">
        <h2 className="text-sm font-semibold">Detail barang</h2>
        <Field>
          <FieldLabel htmlFor="itemDescription">
            Deskripsi barang (opsional)
          </FieldLabel>
          <Textarea
            id="itemDescription"
            placeholder="Contoh: 2 kardus, 1 lemari kecil"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            maxLength={500}
          />
        </Field>
      </Card>

      <Card className="gap-4 p-4">
        <h2 className="text-sm font-semibold">Waktu penjemputan</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScheduleMode("asap")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors",
              scheduleMode === "asap"
                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                : "border-border hover:bg-muted/50"
            )}
            aria-pressed={scheduleMode === "asap"}
          >
            <Zap className="size-4" />
            Sekarang
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode("scheduled")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors",
              scheduleMode === "scheduled"
                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                : "border-border hover:bg-muted/50"
            )}
            aria-pressed={scheduleMode === "scheduled"}
          >
            <CalendarClock className="size-4" />
            Jadwalkan
          </button>
        </div>
        {scheduleMode === "scheduled" ? (
          <Field>
            <FieldLabel htmlFor="scheduledAt">Tanggal & waktu</FieldLabel>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </Field>
        ) : null}
      </Card>

      <Card className="gap-4 p-4">
        <h2 className="text-sm font-semibold">Kode promo (opsional)</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Masukkan kode"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            disabled={Boolean(promoCode)}
          />
          {promoCode ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Hapus promo"
              onClick={clearPromo}
            >
              <X className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={applyPromo}
              disabled={!promoInput.trim()}
            >
              <Tag className="size-4" />
              Pakai
            </Button>
          )}
        </div>
        {estimate?.promo ? (
          <p className="text-xs font-medium text-emerald-600">
            Promo {estimate.promo.code} diterapkan
          </p>
        ) : promoCode && estimateError ? (
          <p className="text-xs text-destructive">{estimateError}</p>
        ) : null}
      </Card>

      <EstimateCard
        estimate={estimate}
        estimating={estimating}
        ready={Boolean(pickup && dropoff)}
        error={estimateError}
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base"
        disabled={submitting || !pickup || !dropoff}
      >
        {submitting ? <Spinner /> : null}
        {estimate
          ? `Pesan · ${formatRupiah(estimate.finalPrice)}`
          : "Buat Pesanan"}
      </Button>
    </form>
  )
}

function EstimateCard({
  estimate,
  estimating,
  ready,
  error,
}: {
  estimate: EstimatePrice | null
  estimating: boolean
  ready: boolean
  error: string | null
}) {
  if (!ready) {
    return (
      <Card className="gap-1 p-4 text-sm text-muted-foreground">
        Pilih titik jemput dan tujuan untuk melihat estimasi harga.
      </Card>
    )
  }

  if (estimating && !estimate) {
    return (
      <Card className="flex-row items-center gap-2 p-4 text-sm text-muted-foreground">
        <Spinner /> Menghitung estimasi…
      </Card>
    )
  }

  if (!estimate) {
    return (
      <Card className="gap-1 p-4 text-sm text-destructive">
        {error ?? "Estimasi tidak tersedia."}
      </Card>
    )
  }

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Jarak</span>
        <span className="tabular-nums">
          {formatNumber(estimate.billedDistanceKm)} km
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Harga dasar</span>
        <span className="tabular-nums">{formatRupiah(estimate.basePrice)}</span>
      </div>
      {estimate.discountAmount > 0 ? (
        <div className="flex items-center justify-between text-sm text-emerald-600">
          <span>Diskon promo</span>
          <span className="tabular-nums">
            − {formatRupiah(estimate.discountAmount)}
          </span>
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm font-medium">Total estimasi</span>
        <span className="text-lg font-bold tabular-nums">
          {formatRupiah(estimate.finalPrice)}
        </span>
      </div>
    </Card>
  )
}
