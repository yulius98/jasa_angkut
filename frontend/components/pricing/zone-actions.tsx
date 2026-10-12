"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ZoneForm } from "@/components/pricing/zone-form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deactivatePricingZone } from "@/lib/actions/pricing/zones"
import type { PricingZone } from "@/types"

export function ZoneActions({ zone }: { zone: PricingZone }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDeactivate() {
    startTransition(async () => {
      try {
        await deactivatePricingZone(zone.id)
        toast.success("Zona harga dinonaktifkan")
        setConfirmOpen(false)
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal menonaktifkan zona"
        toast.error(message)
        setConfirmOpen(false)
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button size="sm" variant="outline" className="h-7" onClick={() => setEditOpen(true)}>
        Edit
      </Button>
      {zone.isActive ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
          disabled={pending}
        >
          Nonaktifkan
        </Button>
      ) : null}

      <ZoneForm open={editOpen} onOpenChange={setEditOpen} zone={zone} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Nonaktifkan zona harga"
        description={`Zona "${zone.name}" tidak akan dipakai untuk estimasi harga baru setelah dinonaktifkan.`}
        confirmLabel="Nonaktifkan"
        loading={pending}
        onConfirm={handleDeactivate}
      />
    </div>
  )
}
