"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { VEHICLE_TYPE_META, VEHICLE_TYPES } from "@/lib/format"
import { VehicleType } from "@/types"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

type FileKey = "ktpPhoto" | "simPhoto" | "stnkPhoto" | "photo"

const positiveNumber = (max: number) =>
  z
    .string()
    .min(1, "Wajib diisi")
    .regex(/^\d+(\.\d{1,2})?$/, "Harus angka positif dengan maksimal 2 desimal")
    .refine((v) => Number(v) > 0, { message: "Harus lebih dari 0" })
    .refine((v) => Number(v) <= max, { message: `Maksimal ${max}` })

const partnerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Wajib diisi")
    .max(100, "Maksimal 100 karakter"),
  email: z.string().trim().email("Format email tidak valid"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[1-9]\d{7,11}$/, "Nomor telepon tidak valid"),
  password: z.string().min(8, "Minimal 8 karakter"),
  ktpNumber: z.string().trim().regex(/^\d{16}$/, "Nomor KTP harus 16 digit angka"),
  simNumber: z
    .string()
    .trim()
    .regex(/^\d{12,14}$/, "Nomor SIM harus 12-14 digit angka"),
  vehicleType: z.nativeEnum(VehicleType, "Pilih tipe kendaraan"),
  plateNumber: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z]{1,2}\s?\d{1,4}\s?[A-Za-z]{0,3}$/,
      "Format plat nomor tidak valid (mis. B 1234 XYZ)"
    ),
  brand: z
    .string()
    .trim()
    .min(1, "Wajib diisi")
    .max(50, "Maksimal 50 karakter"),
  model: z
    .string()
    .trim()
    .min(1, "Wajib diisi")
    .max(50, "Maksimal 50 karakter"),
  maxWeightKg: positiveNumber(99999),
  maxVolumeM3: positiveNumber(999),
})

type PartnerValues = z.infer<typeof partnerSchema>

const DEFAULT_VALUES: PartnerValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  ktpNumber: "",
  simNumber: "",
  vehicleType: VehicleType.MOTORCYCLE,
  plateNumber: "",
  brand: "",
  model: "",
  maxWeightKg: "",
  maxVolumeM3: "",
}

const EMPTY_FILES: Record<FileKey, File | null> = {
  ktpPhoto: null,
  simPhoto: null,
  stnkPhoto: null,
  photo: null,
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Format harus JPG, PNG, atau WEBP"
  }
  if (file.size > MAX_BYTES) return "Ukuran maksimal 5 MB"
  return null
}

interface ImageFieldProps {
  id: string
  label: string
  required?: boolean
  hint?: string
  file: File | null
  error?: string
  disabled?: boolean
  onSelect: (file: File | null) => void
}

function ImageField({
  id,
  label,
  required,
  hint,
  file,
  error,
  disabled,
  onSelect,
}: ImageFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </FieldLabel>
      <Input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        aria-invalid={!!error}
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
      {error ? (
        <FieldError>{error}</FieldError>
      ) : file ? (
        <FieldDescription>{file.name}</FieldDescription>
      ) : hint ? (
        <FieldDescription>{hint}</FieldDescription>
      ) : null}
    </Field>
  )
}

interface CreatePartnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePartnerDialog({
  open,
  onOpenChange,
}: CreatePartnerDialogProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [files, setFiles] = useState<Record<FileKey, File | null>>(EMPTY_FILES)
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartnerValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const vehicleType = watch("vehicleType")
  const busy = pending || isSubmitting

  function handleFile(key: FileKey, file: File | null) {
    setFiles((prev) => ({ ...prev, [key]: file }))
    setFileErrors((prev) => ({
      ...prev,
      [key]: file ? validateFile(file) ?? "" : "",
    }))
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setServerError(null)
      setFileErrors({})
      setFiles(EMPTY_FILES)
      reset(DEFAULT_VALUES)
    }
    onOpenChange(next)
  }

  function onSubmit(values: PartnerValues) {
    setServerError(null)

    const nextErrors: Record<string, string> = {}
    if (!files.ktpPhoto) nextErrors.ktpPhoto = "Foto KTP wajib diunggah"
    if (!files.simPhoto) nextErrors.simPhoto = "Foto SIM wajib diunggah"
    if (!files.stnkPhoto) nextErrors.stnkPhoto = "Foto STNK wajib diunggah"
    for (const key of Object.keys(files) as FileKey[]) {
      const file = files[key]
      if (file) {
        const err = validateFile(file)
        if (err) nextErrors[key] = err
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setFileErrors(nextErrors)
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("name", values.name.trim())
        formData.set("email", values.email.trim())
        formData.set("phone", values.phone.trim())
        formData.set("password", values.password)
        formData.set("ktpNumber", values.ktpNumber.trim())
        formData.set("simNumber", values.simNumber.trim())
        formData.set("vehicleType", values.vehicleType)
        formData.set("plateNumber", values.plateNumber.trim())
        formData.set("brand", values.brand.trim())
        formData.set("model", values.model.trim())
        formData.set("maxWeightKg", values.maxWeightKg)
        formData.set("maxVolumeM3", values.maxVolumeM3)
        formData.set("ktpPhoto", files.ktpPhoto as File)
        formData.set("simPhoto", files.simPhoto as File)
        formData.set("stnkPhoto", files.stnkPhoto as File)
        if (files.photo) formData.set("photo", files.photo)

        const res = await fetch("/api/admin/partners", {
          method: "POST",
          body: formData,
        })
        const data = (await res.json().catch(() => null)) as {
          message?: string
        } | null
        if (!res.ok) {
          throw new Error(data?.message ?? "Gagal menambah partner")
        }

        toast.success("Partner berhasil ditambahkan")
        handleOpenChange(false)
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan"
        setServerError(message)
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Partner</DialogTitle>
          <DialogDescription>
            Buat akun mitra beserta data identitas dan satu kendaraan. Partner
            langsung berstatus disetujui.
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FieldGroup>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Akun
            </p>
            <Field>
              <FieldLabel htmlFor="partner-name">Nama</FieldLabel>
              <Input
                id="partner-name"
                placeholder="Nama lengkap partner"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="partner-email">Email</FieldLabel>
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="partner@example.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="partner-phone">Nomor Telepon</FieldLabel>
                <Input
                  id="partner-phone"
                  inputMode="tel"
                  placeholder="081234567890"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                <FieldError errors={[errors.phone]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="partner-password">Password</FieldLabel>
              <Input
                id="partner-password"
                type="password"
                placeholder="Minimal 8 karakter"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Identitas
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="partner-ktp">Nomor KTP</FieldLabel>
                <Input
                  id="partner-ktp"
                  inputMode="numeric"
                  placeholder="16 digit angka"
                  aria-invalid={!!errors.ktpNumber}
                  {...register("ktpNumber")}
                />
                <FieldError errors={[errors.ktpNumber]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="partner-sim">Nomor SIM</FieldLabel>
                <Input
                  id="partner-sim"
                  inputMode="numeric"
                  placeholder="12-14 digit angka"
                  aria-invalid={!!errors.simNumber}
                  {...register("simNumber")}
                />
                <FieldError errors={[errors.simNumber]} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ImageField
                id="partner-ktp-photo"
                label="Foto KTP"
                required
                file={files.ktpPhoto}
                error={fileErrors.ktpPhoto}
                disabled={busy}
                onSelect={(file) => handleFile("ktpPhoto", file)}
              />
              <ImageField
                id="partner-sim-photo"
                label="Foto SIM"
                required
                file={files.simPhoto}
                error={fileErrors.simPhoto}
                disabled={busy}
                onSelect={(file) => handleFile("simPhoto", file)}
              />
            </div>

            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Kendaraan
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Tipe Kendaraan</FieldLabel>
                <Select
                  value={vehicleType}
                  onValueChange={(next) => {
                    if (next)
                      setValue("vehicleType", next as VehicleType, {
                        shouldValidate: true,
                      })
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
                <FieldLabel htmlFor="partner-plate">Plat Nomor</FieldLabel>
                <Input
                  id="partner-plate"
                  placeholder="B 1234 XYZ"
                  aria-invalid={!!errors.plateNumber}
                  {...register("plateNumber")}
                />
                <FieldError errors={[errors.plateNumber]} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="partner-brand">Merek</FieldLabel>
                <Input
                  id="partner-brand"
                  placeholder="mis. Mitsubishi"
                  aria-invalid={!!errors.brand}
                  {...register("brand")}
                />
                <FieldError errors={[errors.brand]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="partner-model">Model</FieldLabel>
                <Input
                  id="partner-model"
                  placeholder="mis. L300"
                  aria-invalid={!!errors.model}
                  {...register("model")}
                />
                <FieldError errors={[errors.model]} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="partner-weight">
                  Kapasitas Berat (kg)
                </FieldLabel>
                <Input
                  id="partner-weight"
                  inputMode="decimal"
                  placeholder="1000"
                  aria-invalid={!!errors.maxWeightKg}
                  {...register("maxWeightKg")}
                />
                <FieldError errors={[errors.maxWeightKg]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="partner-volume">
                  Kapasitas Volume (m³)
                </FieldLabel>
                <Input
                  id="partner-volume"
                  inputMode="decimal"
                  placeholder="4"
                  aria-invalid={!!errors.maxVolumeM3}
                  {...register("maxVolumeM3")}
                />
                <FieldError errors={[errors.maxVolumeM3]} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ImageField
                id="partner-stnk-photo"
                label="Foto STNK"
                required
                file={files.stnkPhoto}
                error={fileErrors.stnkPhoto}
                disabled={busy}
                onSelect={(file) => handleFile("stnkPhoto", file)}
              />
              <ImageField
                id="partner-vehicle-photo"
                label="Foto Kendaraan"
                hint="Opsional"
                file={files.photo}
                error={fileErrors.photo}
                disabled={busy}
                onSelect={(file) => handleFile("photo", file)}
              />
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <Spinner />
                  Menyimpan...
                </>
              ) : (
                "Tambah Partner"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
