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
import { resetAdminPassword } from "@/lib/actions/admins"
import type { AdminListItem } from "@/types"

const schema = z
  .object({
    password: z.string().min(8, "Minimal 8 karakter"),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm"],
  })

type FormValues = z.infer<typeof schema>

const DEFAULT_VALUES: FormValues = { password: "", confirm: "" }

interface ResetAdminPasswordDialogProps {
  admin: AdminListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetAdminPasswordDialog({
  admin,
  open,
  onOpenChange,
}: ResetAdminPasswordDialogProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES)
  }, [open, reset])

  const busy = pending || isSubmitting

  function handleOpenChange(next: boolean) {
    if (!next) setServerError(null)
    onOpenChange(next)
  }

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      try {
        await resetAdminPassword(admin.id, values.password)
        toast.success("Password berhasil diatur ulang")
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
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Atur password baru untuk {admin.name}. Sesi login aktif akun ini akan
            diakhiri.
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
              <FieldLabel htmlFor="reset-password">Password Baru</FieldLabel>
              <Input
                id="reset-password"
                type="password"
                placeholder="Minimal 8 karakter"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="reset-confirm">
                Konfirmasi Password
              </FieldLabel>
              <Input
                id="reset-confirm"
                type="password"
                placeholder="Ulangi password baru"
                aria-invalid={!!errors.confirm}
                {...register("confirm")}
              />
              <FieldError errors={[errors.confirm]} />
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
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
