"use client"

import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAYMENT_METHOD_META, PAYMENT_METHODS } from "@/lib/format"

interface PaymentMethodFilterProps {
  value: string
  basePath: string
  otherParams?: string
}

export function PaymentMethodFilter({
  value,
  basePath,
  otherParams,
}: PaymentMethodFilterProps) {
  const router = useRouter()

  function buildHref(next: string) {
    const params = new URLSearchParams(otherParams ?? "")
    if (next !== "ALL") params.set("method", next)
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
      <SelectTrigger className="w-44" aria-label="Filter metode pembayaran">
        <SelectValue placeholder="Semua metode" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Semua metode</SelectItem>
        {PAYMENT_METHODS.map((method) => (
          <SelectItem key={method} value={method}>
            {PAYMENT_METHOD_META[method].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
