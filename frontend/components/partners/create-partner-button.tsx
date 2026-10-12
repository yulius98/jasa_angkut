"use client"

import { useState } from "react"

import { CreatePartnerDialog } from "@/components/partners/create-partner-dialog"
import { Button } from "@/components/ui/button"

export function CreatePartnerButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Tambah Partner</Button>
      <CreatePartnerDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
