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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { createWithdrawal } from "@/lib/actions/withdrawals"
import { cn } from "cn"
import { WithdrawalProvider } from "@/types"

const PROVIDER_HINT: Record<WithdrawalProvider, string> = {
  IRIS: "Kode bank biasa untuk Midtrans Iris, mis. BCA, BNI, MANDIRI.",
  XENDIT: "Channel code Xendit, mis. ID_BCA, ID_BNI.",
}

const withdrawalSchema = z.object({
  provider: z.nativeEnum(WithdrawalProvider),
  beneficiaryName: z
    .string()
    .trim()
    .min(1, "Wajib diisi")
    .max(100, "Maksimal 100 karakter"),
  bankCode: z
    .string()
    .trim()
    .min(1, "Wajib diisi")
    .max(20, "Maksimal 20 karakter"),
  bankAccountNumber: z
    .string()
    .trim()
    .min(1, "Wajib diisi")
    .max(50, "Maksimal 50 karakter")
    .regex(/^\d+$/, "Hanya boleh angka"),
  amount: z
    .string()
    .min(1, "Wajib diisi")
    .regex(/^\d+$/, "Harus bilangan bulat")
    .refine((v) => Number(v) > 0, { message: "Harus lebih dari 0" }),
  notes: z.string().max(255, "Maksimal 255 karakter"),
})

type WithdrawalValues = z.infer<typeof withdrawalSchema>

interface CreateWithdrawalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_VALUES: WithdrawalValues = {
  provider: WithdrawalProvider.IRIS,
  beneficiaryName: "",
  bankCode: "",
  bankAccountNumber: "",
  amount: "",
  notes: "",
}

export function CreateWithdrawalDialog({
  open,
  onOpenChange,
}: CreateWithdrawalDialogProps) {
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
  } = useForm<WithdrawalValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const provider = watch("provider")

  function handleOpenChange(next: boolean) {
    if (!next) {
      setServerError(null)
      reset(DEFAULT_VALUES)
    }
    onOpenChange(next)
  }

  function onSubmit(values: WithdrawalValues) {
    setServerError(null)
    startTransition(async () => {
      try {
        await createWithdrawal({
          provider: values.provider,
          beneficiaryName: values.beneficiaryName.trim(),
          bankCode: values.bankCode.trim(),
          bankAccountNumber: values.bankAccountNumber.trim(),
          amount: Number(values.amount),
          notes: values.notes.trim() ? values.notes.trim() : undefined,
        })
        toast.success("Permintaan pencairan berhasil dibuat")
        handleOpenChange(false)
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan"
        setServerError(message)
        toast.error(message)
      }
    })
  }

  const busy = pending || isSubmitting

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Pencairan</DialogTitle>
          <DialogDescription>
            Membuat permintaan pencairan tidak otomatis menyetujui dana.
            Persetujuan dilakukan terpisah di dashboard provider.
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
              <FieldLabel>Provider</FieldLabel>
              <div
                className="grid gap-2 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Provider pencairan"
              >
                {Object.values(WithdrawalProvider).map((value) => {
                  const isActive = provider === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      disabled={busy}
                      onClick={() =>
                        setValue("provider", value, { shouldValidate: true })
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-3 text-left transition-colors outline-none",
                        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        isActive
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <span
                        className={cn(
                          "size-3.5 shrink-0 rounded-full border-2",
                          isActive
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40"
                        )}
                      />
                      <span className="font-medium">{value}</span>
                    </button>
                  )
                })}
              </div>
              <FieldError errors={[errors.provider]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="wd-beneficiary">Nama Penerima</FieldLabel>
              <Input
                id="wd-beneficiary"
                placeholder="Nama sesuai rekening bank"
                aria-invalid={!!errors.beneficiaryName}
                {...register("beneficiaryName")}
              />
              <FieldError errors={[errors.beneficiaryName]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="wd-bank-code">Kode Bank</FieldLabel>
                <Input
                  id="wd-bank-code"
                  placeholder={provider === "IRIS" ? "BCA" : "ID_BCA"}
                  aria-invalid={!!errors.bankCode}
                  {...register("bankCode")}
                />
                <FieldDescription>{PROVIDER_HINT[provider]}</FieldDescription>
                <FieldError errors={[errors.bankCode]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="wd-account">Nomor Rekening</FieldLabel>
                <Input
                  id="wd-account"
                  inputMode="numeric"
                  placeholder="1234567890"
                  aria-invalid={!!errors.bankAccountNumber}
                  {...register("bankAccountNumber")}
                />
                <FieldError errors={[errors.bankAccountNumber]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="wd-amount">Jumlah (Rp)</FieldLabel>
              <Input
                id="wd-amount"
                inputMode="numeric"
                placeholder="1000000"
                aria-invalid={!!errors.amount}
                {...register("amount")}
              />
              <FieldError errors={[errors.amount]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="wd-notes">Catatan</FieldLabel>
              <Textarea
                id="wd-notes"
                placeholder="Opsional"
                aria-invalid={!!errors.notes}
                {...register("notes")}
              />
              <FieldError errors={[errors.notes]} />
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
                  Memproses...
                </>
              ) : (
                "Buat Pencairan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
