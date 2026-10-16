"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { updatePaymentGatewaySetting } from "@/lib/actions/payments"
import { cn } from "cn"
import {
  PAYMENT_GATEWAY_MODE_META,
  PaymentGatewayMode as PaymentGatewayModeEnum,
  type PaymentGatewayMode,
} from "@/types"

const MODES = Object.values(PaymentGatewayModeEnum)

interface PaymentGatewaySettingsProps {
  value: PaymentGatewayMode
}

export function PaymentGatewaySettings({ value }: PaymentGatewaySettingsProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<PaymentGatewayMode>(value)
  const [pending, startTransition] = useTransition()

  const dirty = selected !== value

  function handleSave() {
    startTransition(async () => {
      try {
        await updatePaymentGatewaySetting(selected)
        toast.success(
          `Metode pembayaran diatur ke ${PAYMENT_GATEWAY_MODE_META[selected].label}`
        )
        router.refresh()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Gagal menyimpan pengaturan"
        )
      }
    })
  }

  return (
    <div className="grid gap-3">
      <div
        className="grid gap-3"
        role="radiogroup"
        aria-label="Metode pembayaran"
      >
        {MODES.map((mode) => {
          const meta = PAYMENT_GATEWAY_MODE_META[mode]
          const isActive = selected === mode
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setSelected(mode)}
              disabled={pending}
              className={cn(
                "grid gap-1 rounded-xl border p-3 text-left transition-colors outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                isActive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
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

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={pending || !dirty}>
          {pending ? (
            <>
              <Spinner />
              Menyimpan...
            </>
          ) : (
            "Simpan"
          )}
        </Button>
      </div>
    </div>
  )
}
