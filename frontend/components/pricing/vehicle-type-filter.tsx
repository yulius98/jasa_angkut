"use client"

import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VEHICLE_TYPE_META, VEHICLE_TYPES } from "@/lib/format"

interface VehicleTypeFilterProps {
  value: string
  basePath: string
}

export function VehicleTypeFilter({ value, basePath }: VehicleTypeFilterProps) {
  const router = useRouter()

  function buildHref(next: string) {
    const params = new URLSearchParams()
    if (next !== "ALL") params.set("vehicleType", next)
    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) router.push(buildHref(next))
      }}
    >
      <SelectTrigger className="w-48" aria-label="Filter tipe kendaraan">
        <SelectValue placeholder="Semua tipe kendaraan" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Semua tipe</SelectItem>
        {VEHICLE_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {VEHICLE_TYPE_META[type].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
