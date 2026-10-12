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
import { createPromo, updatePromo } from "@/lib/actions/pricing/promos"
import { PROMO_TYPE_META, PROMO_TYPES } from "@/lib/format"
import { PromoType, type PromoCode } from "@/types"

const positiveNumber = z
  .string()
  .min(1, "Wajib diisi")
  .regex(/^\d+(\.\d{1,2})?$/, "Harus angka positif dengan maksimal 2 desimal")
  .refine((v) => Number(v) > 0, { message: "Harus lebih dari 0" })

const optionalPositiveNumber = z
  .string()
  .refine((v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v), {
    message: "Harus angka dengan maksimal 2 desimal",
  })
  .refine((v) => v === "" || Number(v) > 0, {
    message: "Harus lebih dari 0",
  })

const optionalNonNegativeNumber = z
  .string()
  .refine((v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v), {
    message: "Harus angka dengan maksimal 2 desimal",
  })
  .refine((v) => v === "" || Number(v) >= 0, {
    message: "Tidak boleh negatif",
  })

const optionalPositiveInt = z
  .string()
  .refine((v) => v === "" || /^\d+$/.test(v), { message: "Harus bilangan bulat" })
  .refine((v) => v === "" || Number(v) > 0, { message: "Harus lebih dari 0" })

function isoToDateInput(iso: string): string {
  return iso ? iso.slice(0, 10) : ""
}

const promoSchema = z
  .object({
    code: z
      .string()
      .regex(
        /^[A-Z0-9_-]{3,30}$/,
        "Kode promo: huruf besar, angka, - dan _, 3-30 karakter"
      ),
    type: z.nativeEnum(PromoType, "Pilih tipe promo"),
    value: positiveNumber,
    maxDiscount: optionalPositiveNumber,
    minOrderValue: optionalNonNegativeNumber,
    usageLimit: optionalPositiveInt,
    validFrom: z.string().min(1, "Tanggal mulai wajib diisi"),
    validUntil: z.string().min(1, "Tanggal selesai wajib diisi"),
  })
  .refine((v) => new Date(v.validUntil) > new Date(v.validFrom), {
    message: "Tanggal selesai harus setelah tanggal mulai",
    path: ["validUntil"],
  })
  .refine(
    (v) => v.type !== PromoType.PERCENTAGE || Number(v.value) <= 100,
    {
      message: "Persentase tidak boleh lebih dari 100",
      path: ["value"],
    }
  )

type PromoValues = z.infer<typeof promoSchema>

interface PromoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promo: PromoCode | null
}

export function PromoForm({ open, onOpenChange, promo }: PromoFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isEdit = promo !== null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PromoValues>({
    resolver: zodResolver(promoSchema),
    defaultValues: promo
      ? {
          code: promo.code,
          type: promo.type,
          value: promo.value,
          maxDiscount: promo.maxDiscount ?? "",
          minOrderValue: promo.minOrderValue ?? "",
          usageLimit:
            promo.usageLimit !== null ? String(promo.usageLimit) : "",
          validFrom: isoToDateInput(promo.validFrom),
          validUntil: isoToDateInput(promo.validUntil),
        }
      : {
          code: "",
          type: PromoType.PERCENTAGE,
          value: "",
          maxDiscount: "",
          minOrderValue: "",
          usageLimit: "",
          validFrom: "",
          validUntil: "",
        },
  })

  const promoType = watch("type")

  function handleOpenChange(next: boolean) {
    if (!next) {
      setServerError(null)
      reset()
    }
    onOpenChange(next)
  }

  function onSubmit(values: PromoValues) {
    setServerError(null)
    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = {
          type: values.type,
          value: Number(values.value),
          maxDiscount: values.maxDiscount
            ? Number(values.maxDiscount)
            : undefined,
          minOrderValue: values.minOrderValue
            ? Number(values.minOrderValue)
            : undefined,
          usageLimit: values.usageLimit
            ? Number(values.usageLimit)
            : undefined,
          validFrom: new Date(values.validFrom).toISOString(),
          validUntil: new Date(values.validUntil).toISOString(),
        }

        if (isEdit) {
          await updatePromo(promo.id, payload)
          toast.success("Kode promo berhasil diperbarui")
        } else {
          await createPromo({ ...payload, code: values.code })
          toast.success("Kode promo berhasil dibuat")
        }
        handleOpenChange(false)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan"
        setServerError(message)
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Kode Promo" : "Tambah Kode Promo"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui detail kode promo. Kode promo tidak dapat diubah."
              : "Buat kode promo baru untuk pelanggan."}
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
              <FieldLabel htmlFor="promo-code">Kode Promo</FieldLabel>
              <Input
                id="promo-code"
                placeholder="HEMAT20"
                disabled={isEdit}
                aria-invalid={!!errors.code}
                {...register("code")}
              />
              <FieldError errors={[errors.code]} />
            </Field>

            <Field>
              <FieldLabel>Tipe Promo</FieldLabel>
              <Select
                value={promoType}
                onValueChange={(next) => {
                  if (next)
                    setValue("type", next as PromoType, {
                      shouldValidate: true,
                    })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tipe promo" />
                </SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PROMO_TYPE_META[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.type]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="promo-value">
                {promoType === PromoType.PERCENTAGE ? "Nilai (%)" : "Nilai (Rp)"}
              </FieldLabel>
              <Input
                id="promo-value"
                inputMode="decimal"
                placeholder={promoType === PromoType.PERCENTAGE ? "10" : "5000"}
                aria-invalid={!!errors.value}
                {...register("value")}
              />
              <FieldError errors={[errors.value]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="promo-max-discount">
                  Diskon Maks (Rp)
                </FieldLabel>
                <Input
                  id="promo-max-discount"
                  inputMode="decimal"
                  placeholder="Opsional"
                  aria-invalid={!!errors.maxDiscount}
                  {...register("maxDiscount")}
                />
                <FieldError errors={[errors.maxDiscount]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="promo-min-order">
                  Min. Order (Rp)
                </FieldLabel>
                <Input
                  id="promo-min-order"
                  inputMode="decimal"
                  placeholder="Opsional"
                  aria-invalid={!!errors.minOrderValue}
                  {...register("minOrderValue")}
                />
                <FieldError errors={[errors.minOrderValue]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="promo-usage-limit">Batas Pemakaian</FieldLabel>
              <Input
                id="promo-usage-limit"
                inputMode="numeric"
                placeholder="Opsional"
                aria-invalid={!!errors.usageLimit}
                {...register("usageLimit")}
              />
              <FieldError errors={[errors.usageLimit]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="promo-valid-from">
                  Berlaku Dari
                </FieldLabel>
                <Input
                  id="promo-valid-from"
                  type="date"
                  aria-invalid={!!errors.validFrom}
                  {...register("validFrom")}
                />
                <FieldError errors={[errors.validFrom]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="promo-valid-until">
                  Sampai Dengan
                </FieldLabel>
                <Input
                  id="promo-valid-until"
                  type="date"
                  aria-invalid={!!errors.validUntil}
                  {...register("validUntil")}
                />
                <FieldError errors={[errors.validUntil]} />
              </Field>
            </div>
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
                "Buat Promo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
