"use client"

import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DISPUTE_STATUS_META, DISPUTE_STATUSES } from "@/lib/format"

interface DisputeStatusFilterProps {
  value: string
  basePath: string
}

export function DisputeStatusFilter({
  value,
  basePath,
}: DisputeStatusFilterProps) {
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
      <SelectTrigger className="w-48" aria-label="Filter status dispute">
        <SelectValue placeholder="Semua status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Semua status</SelectItem>
        {DISPUTE_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {DISPUTE_STATUS_META[status].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
