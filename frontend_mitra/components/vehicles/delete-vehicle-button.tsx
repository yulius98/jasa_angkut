"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
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
import { deleteVehicleAction } from "@/lib/actions/vehicles"

export function DeleteVehicleButton({
  vehicleId,
  label,
}: {
  vehicleId: string
  label: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function confirm() {
    startTransition(async () => {
      const result = await deleteVehicleAction(vehicleId)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success("Kendaraan dinonaktifkan")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Hapus ${label}`}
        className="text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nonaktifkan kendaraan?</DialogTitle>
          <DialogDescription>
            {label} tidak akan dipakai lagi untuk menerima order. Riwayat order
            lama tetap tersimpan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={pending}
          >
            {pending ? <Spinner /> : <Trash2 className="size-4" />}
            Nonaktifkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
