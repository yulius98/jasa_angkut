"use client"

import { useState } from "react"

import { CreateAdminDialog } from "@/components/admins/create-admin-dialog"
import { Button } from "@/components/ui/button"

export function CreateAdminButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Tambah Admin</Button>
      <CreateAdminDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
