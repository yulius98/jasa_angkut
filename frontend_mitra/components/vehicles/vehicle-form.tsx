"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createVehicleAction } from "@/lib/actions/vehicles"
import { VEHICLE_TYPE_META } from "@/lib/format"
import { VehicleType } from "@/types"

const VEHICLE_TYPES = Object.values(VehicleType)

export function VehicleForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string>(VehicleType.MOTORCYCLE)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set("type", type)

    startTransition(async () => {
      const result = await createVehicleAction(formData)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success("Kendaraan ditambahkan")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-4" />
            Tambah Kendaraan
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah kendaraan</DialogTitle>
          <DialogDescription>
            Data kendaraan dipakai untuk mencocokkan order yang bisa kamu ambil.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="vehicle-type" className="text-sm font-medium">
              Tipe kendaraan
            </label>
            <select
              id="vehicle-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={pending}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              {VEHICLE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {VEHICLE_TYPE_META[value].label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="plateNumber" className="text-sm font-medium">
                Plat nomor
              </label>
              <Input
                id="plateNumber"
                name="plateNumber"
                placeholder="B 1234 XYZ"
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="brand" className="text-sm font-medium">
                Merek
              </label>
              <Input
                id="brand"
                name="brand"
                placeholder="Honda"
                maxLength={50}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="model" className="text-sm font-medium">
                Model
              </label>
              <Input
                id="model"
                name="model"
                placeholder="Beat"
                maxLength={50}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="maxWeightKg" className="text-sm font-medium">
                Kapasitas berat (kg)
              </label>
              <Input
                id="maxWeightKg"
                name="maxWeightKg"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                max="99999"
                placeholder="50"
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="maxVolumeM3" className="text-sm font-medium">
                Kapasitas volume (m³)
              </label>
              <Input
                id="maxVolumeM3"
                name="maxVolumeM3"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                max="999"
                placeholder="1"
                required
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="stnkPhoto" className="text-sm font-medium">
                Foto STNK <span className="text-destructive">*</span>
              </label>
              <Input
                id="stnkPhoto"
                name="stnkPhoto"
                type="file"
                accept="image/*"
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="photo" className="text-sm font-medium">
                Foto kendaraan
              </label>
              <Input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : <Plus className="size-4" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
