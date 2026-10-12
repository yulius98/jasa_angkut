"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PaymentDateFilterProps {
  dateFrom?: string
  dateTo?: string
  basePath: string
  otherParams?: string
}

export function PaymentDateFilter({
  dateFrom,
  dateTo,
  basePath,
  otherParams,
}: PaymentDateFilterProps) {
  const router = useRouter()
  const [from, setFrom] = useState(dateFrom ?? "")
  const [to, setTo] = useState(dateTo ?? "")

  function apply() {
    const params = new URLSearchParams(otherParams ?? "")
    if (from) params.set("dateFrom", from)
    else params.delete("dateFrom")
    if (to) params.set("dateTo", to)
    else params.delete("dateTo")
    const query = params.toString()
    router.push(query ? `${basePath}?${query}` : basePath)
  }

  function reset() {
    setFrom("")
    setTo("")
    const params = new URLSearchParams(otherParams ?? "")
    params.delete("dateFrom")
    params.delete("dateTo")
    const query = params.toString()
    router.push(query ? `${basePath}?${query}` : basePath)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        className="h-8 w-36"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        aria-label="Tanggal mulai"
      />
      <span className="text-muted-foreground">-</span>
      <Input
        type="date"
        className="h-8 w-36"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        aria-label="Tanggal akhir"
      />
      <Button size="sm" onClick={apply}>
        Terapkan
      </Button>
      {(from || to) && (
        <Button size="sm" variant="outline" onClick={reset}>
          Reset
        </Button>
      )}
    </div>
  )
}
