"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState, useTransition } from "react"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { updateAdmin } from "@/lib/actions/admins"
import type { AdminListItem } from "@/types"

const editSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Wajib diisi")
    .max(100, "Maksimal 100 karakter"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[1-9]\d{7,11}$/, "Nomor telepon tidak valid"),
})

type EditValues = z.infer<typeof editSchema>

interface EditAdminDialogProps {
  admin: AdminListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAdminDialog({
  admin,
  open,
  onOpenChange,
}: EditAdminDialogProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: admin.name, phone: admin.phone },
  })

  useEffect(() => {
    if (open) reset({ name: admin.name, phone: admin.phone })
  }, [open, admin, reset])

  const busy = pending || isSubmitting

  function handleOpenChange(next: boolean) {
    if (!next) setServerError(null)
    onOpenChange(next)
  }

  function onSubmit(values: EditValues) {
    setServerError(null)
    startTransition(async () => {
      try {
        await updateAdmin(admin.id, {
          name: values.name.trim(),
          phone: values.phone.trim(),
        })
        toast.success("Data admin berhasil diperbarui")
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
          <DialogTitle>Edit Admin</DialogTitle>
          <DialogDescription>{admin.email}</DialogDescription>
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
              <FieldLabel htmlFor="edit-admin-name">Nama</FieldLabel>
              <Input
                id="edit-admin-name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-admin-phone">Nomor Telepon</FieldLabel>
              <Input
                id="edit-admin-phone"
                inputMode="tel"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError errors={[errors.phone]} />
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
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
