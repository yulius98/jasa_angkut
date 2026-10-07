"use client"

import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PARTNER_STATUS_META, PARTNER_STATUSES } from "@/lib/format"

interface StatusFilterProps {
  value: string
  basePath: string
}

export function StatusFilter({ value, basePath }: StatusFilterProps) {
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
      <SelectTrigger className="w-52" aria-label="Filter status">
        <SelectValue placeholder="Semua status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Semua status</SelectItem>
        {PARTNER_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {PARTNER_STATUS_META[status].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}