"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { ADMIN_ROLE_OPTIONS } from "@/components/admins/admin-roles"
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
import { createAdmin } from "@/lib/actions/admins"
import { USER_ROLE_META } from "@/lib/format"
import { UserRole } from "@/types"

const adminSchema = z.object({
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
  role: z.nativeEnum(UserRole, "Pilih role admin"),
})

type AdminValues = z.infer<typeof adminSchema>

const DEFAULT_VALUES: AdminValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: UserRole.ADMIN,
}

interface CreateAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAdminDialog({
  open,
  onOpenChange,
}: CreateAdminDialogProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const role = watch("role")
  const busy = pending || isSubmitting

  function handleOpenChange(next: boolean) {
    if (!next) {
      setServerError(null)
      reset(DEFAULT_VALUES)
    }
    onOpenChange(next)
  }

  function onSubmit(values: AdminValues) {
    setServerError(null)
    startTransition(async () => {
      try {
        await createAdmin({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          password: values.password,
          role: values.role,
        })
        toast.success("Admin berhasil ditambahkan")
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Admin</DialogTitle>
          <DialogDescription>
            Buat akun baru dengan akses admin. Akun langsung aktif dan
            terverifikasi.
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
            <Field>
              <FieldLabel htmlFor="admin-name">Nama</FieldLabel>
              <Input
                id="admin-name"
                placeholder="Nama lengkap"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-email">Email</FieldLabel>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-phone">Nomor Telepon</FieldLabel>
              <Input
                id="admin-phone"
                inputMode="tel"
                placeholder="081234567890"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError errors={[errors.phone]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-password">Password</FieldLabel>
              <Input
                id="admin-password"
                type="password"
                placeholder="Minimal 8 karakter"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(next) => {
                  if (next)
                    setValue("role", next as UserRole, { shouldValidate: true })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {USER_ROLE_META[option].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.role]} />
            </Field>
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
                "Tambah Admin"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
