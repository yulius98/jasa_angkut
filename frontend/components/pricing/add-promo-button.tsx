"use client"

import { useState } from "react"

import { PromoForm } from "@/components/pricing/promo-form"
import { Button } from "@/components/ui/button"

export function AddPromoButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Tambah Promo</Button>
      <PromoForm open={open} onOpenChange={setOpen} promo={null} />
    </>
  )
}
