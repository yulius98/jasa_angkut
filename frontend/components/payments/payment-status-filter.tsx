"use client"

import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAYMENT_STATUS_META, PAYMENT_STATUSES } from "@/lib/format"

interface PaymentStatusFilterProps {
  value: string
  basePath: string
  otherParams?: string
}

export function PaymentStatusFilter({
  value,
  basePath,
  otherParams,
}: PaymentStatusFilterProps) {
  const router = useRouter()

  function buildHref(next: string) {
    const params = new URLSearchParams(otherParams ?? "")
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
      <SelectTrigger className="w-48" aria-label="Filter status pembayaran">
        <SelectValue placeholder="Semua status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Semua status</SelectItem>
        {PAYMENT_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {PAYMENT_STATUS_META[status].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
