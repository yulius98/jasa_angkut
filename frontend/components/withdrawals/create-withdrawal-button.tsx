"use client"

import { useState } from "react"

import { CreateWithdrawalDialog } from "@/components/withdrawals/create-withdrawal-dialog"
import { Button } from "@/components/ui/button"

export function CreateWithdrawalButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Buat Pencairan</Button>
      <CreateWithdrawalDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
