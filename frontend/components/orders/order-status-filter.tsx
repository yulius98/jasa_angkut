"use client"

import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ORDER_STATUS_META, ORDER_STATUSES } from "@/lib/format"

interface OrderStatusFilterProps {
  value: string
  basePath: string
}

export function OrderStatusFilter({ value, basePath }: OrderStatusFilterProps) {
  const router = useRouter()

  function buildHref(next: string) {
    const params = new URLSearchParams()
    if (next !== "ALL") params.set("status", next)
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
      <SelectTrigger className="w-56" aria-label="Filter status order">
        <SelectValue placeholder="Semua status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Semua status</SelectItem>
        {ORDER_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {ORDER_STATUS_META[status].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
