"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { PromoForm } from "@/components/pricing/promo-form"
import { Button } from "@/components/ui/button"
import { updatePromo } from "@/lib/actions/pricing/promos"
import type { PromoCode } from "@/types"

interface PromoActionsProps {
  promo: PromoCode
}

export function PromoActions({ promo }: PromoActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function toggleActive() {
    startTransition(async () => {
      try {
        await updatePromo(promo.id, { isActive: !promo.isActive })
        toast.success(
          promo.isActive
            ? "Kode promo dinonaktifkan"
            : "Kode promo diaktifkan"
        )
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal memperbarui promo"
        toast.error(message)
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="h-7"
        onClick={() => setEditOpen(true)}
      >
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7"
        onClick={toggleActive}
        disabled={pending}
      >
        {promo.isActive ? "Nonaktifkan" : "Aktifkan"}
      </Button>

      <PromoForm open={editOpen} onOpenChange={setEditOpen} promo={promo} />
    </div>
  )
}
