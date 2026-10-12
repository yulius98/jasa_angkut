"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { updatePaymentGatewaySetting } from "@/lib/actions/payments"
import { cn } from "cn"
import {
  PAYMENT_PROVIDER_META,
  PaymentProvider as PaymentProviderEnum,
} from "@/types"

const PROVIDERS = Object.values(PaymentProviderEnum)

interface GatewaySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: PaymentProviderEnum
}

export function GatewaySettingsDialog({
  open,
  onOpenChange,
  value,
}: GatewaySettingsDialogProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<PaymentProviderEnum>(value)
  const [pending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    if (next) setSelected(value)
    onOpenChange(next)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updatePaymentGatewaySetting(selected)
        toast.success(
          `Gateway pembayaran diatur ke ${PAYMENT_PROVIDER_META[selected].label}`
        )
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal menyimpan pengaturan"
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pengaturan Gateway Pembayaran</DialogTitle>
          <DialogDescription>
            Pilih gateway yang dipakai sebagai default untuk semua pembayaran
            non-tunai baru. Pembayaran tunai (CASH) tidak terpengaruh.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3" role="radiogroup" aria-label="Gateway pembayaran">
          {PROVIDERS.map((provider) => {
            const meta = PAYMENT_PROVIDER_META[provider]
            const isActive = selected === provider
            return (
              <button
                key={provider}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setSelected(provider)}
                className={cn(
                  "grid gap-1 rounded-xl border p-3 text-left transition-colors outline-none",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-3.5 shrink-0 rounded-full border-2",
                      isActive
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40"
                    )}
                  />
                  <span className="font-medium">{meta.label}</span>
                </span>
                <span className="pl-[1.05rem] text-sm text-muted-foreground">
                  {meta.description}
                </span>
              </button>
            )
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? (
              <>
                <Spinner />
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
