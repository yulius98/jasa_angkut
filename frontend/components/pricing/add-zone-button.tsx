"use client"

import { useState } from "react"

import { ZoneForm } from "@/components/pricing/zone-form"
import { Button } from "@/components/ui/button"

export function AddZoneButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Tambah Zona</Button>
      <ZoneForm open={open} onOpenChange={setOpen} zone={null} />
    </>
  )
}
