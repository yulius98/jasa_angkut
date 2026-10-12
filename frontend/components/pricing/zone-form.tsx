"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { createPricingZone, updatePricingZone } from "@/lib/actions/pricing/zones"
import { VEHICLE_TYPE_META, VEHICLE_TYPES } from "@/lib/format"
import { VehicleType, type PricingZone } from "@/types"

const numberField = z
  .string()
  .min(1, "Wajib diisi")
  .regex(/^\d+(\.\d{1,2})?$/, "Harus angka positif dengan maksimal 2 desimal")
  .refine((v) => Number(v) > 0, { message: "Harus lebih dari 0" })

const minDistanceField = z
  .string()
  .min(1, "Wajib diisi")
  .regex(/^\d+(\.\d{1,2})?$/, "Harus angka positif dengan maksimal 2 desimal")
  .refine((v) => Number(v) >= 0, { message: "Tidak boleh negatif" })

const zoneSchema = z.object({
  name: z.string().min(1, "Nama zona wajib diisi"),
  vehicleType: z.nativeEnum(VehicleType, "Pilih tipe kendaraan"),
  baseFare: numberField,
  perKmRate: numberField,
  minDistance: minDistanceField,
})

type ZoneValues = z.infer<typeof zoneSchema>

interface ZoneFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone: PricingZone | null
}

export function ZoneForm({ open, onOpenChange, zone }: ZoneFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isEdit = zone !== null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ZoneValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: zone
      ? {
          name: zone.name,
          vehicleType: zone.vehicleType,
          baseFare: zone.baseFare,
          perKmRate: zone.perKmRate,
          minDistance: zone.minDistance,
        }
      : { name: "", vehicleType: VehicleType.MOTORCYCLE, baseFare: "", perKmRate: "", minDistance: "" },
  })

  const vehicleType = watch("vehicleType")

  function handleOpenChange(next: boolean) {
    if (!next) {
      setServerError(null)
      reset()
    }
    onOpenChange(next)
  }

  function onSubmit(values: ZoneValues) {
    setServerError(null)
    startTransition(async () => {
      try {
        const payload = {
          name: values.name,
          vehicleType: values.vehicleType,
          baseFare: Number(values.baseFare),
          perKmRate: Number(values.perKmRate),
          minDistance: Number(values.minDistance),
        }
        if (isEdit) {
          await updatePricingZone(zone.id, payload)
          toast.success("Zona harga berhasil diperbarui")
        } else {
          await createPricingZone(payload)
          toast.success("Zona harga berhasil dibuat")
        }
        handleOpenChange(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan"
        setServerError(message)
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Zona Harga" : "Tambah Zona Harga"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui detail zona tarif di bawah ini."
              : "Buat zona tarif baru untuk tipe kendaraan tertentu."}
          </DialogDescription>
        </DialogHeader>

        {serverError ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </p>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="zone-name">Nama Zona</FieldLabel>
              <Input
                id="zone-name"
                placeholder="mis. Jabodetabek"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel>Tipe Kendaraan</FieldLabel>
              <Select
                value={vehicleType}
                onValueChange={(next) => {
                  if (next) setValue("vehicleType", next as VehicleType, { shouldValidate: true })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tipe kendaraan" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {VEHICLE_TYPE_META[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.vehicleType]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="zone-base-fare">Tarif Dasar (Rp)</FieldLabel>
              <Input
                id="zone-base-fare"
                inputMode="decimal"
                placeholder="5000"
                aria-invalid={!!errors.baseFare}
                {...register("baseFare")}
              />
              <FieldError errors={[errors.baseFare]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="zone-per-km">Tarif per Km (Rp)</FieldLabel>
              <Input
                id="zone-per-km"
                inputMode="decimal"
                placeholder="2500"
                aria-invalid={!!errors.perKmRate}
                {...register("perKmRate")}
              />
              <FieldError errors={[errors.perKmRate]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="zone-min-distance">Jarak Minimum (km)</FieldLabel>
              <Input
                id="zone-min-distance"
                inputMode="decimal"
                placeholder="1"
                aria-invalid={!!errors.minDistance}
                {...register("minDistance")}
              />
              <FieldError errors={[errors.minDistance]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending || isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending || isSubmitting}>
              {pending || isSubmitting ? (
                <>
                  <Spinner />
                  Menyimpan...
                </>
              ) : isEdit ? (
                "Simpan Perubahan"
              ) : (
                "Buat Zona"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
