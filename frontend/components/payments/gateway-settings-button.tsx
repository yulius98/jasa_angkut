"use client"

import { useState } from "react"
import { Settings2 } from "lucide-react"

import { GatewaySettingsDialog } from "@/components/payments/gateway-settings-dialog"
import { Button } from "@/components/ui/button"
import type { PaymentProvider } from "@/types"

interface GatewaySettingsButtonProps {
  value: PaymentProvider
}

export function GatewaySettingsButton({ value }: GatewaySettingsButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Settings2 />
        Pengaturan Gateway
      </Button>
      <GatewaySettingsDialog open={open} onOpenChange={setOpen} value={value} />
    </>
  )
}
