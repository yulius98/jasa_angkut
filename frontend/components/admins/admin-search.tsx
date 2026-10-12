"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

interface AdminSearchProps {
  value: string
  basePath: string
}

export function AdminSearch({ value, basePath }: AdminSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function push(next: string) {
    const trimmed = next.trim()
    const params = new URLSearchParams()
    if (trimmed) params.set("search", trimmed)
    const qs = params.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }

  function handleChange(next: string) {
    setQuery(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => push(next), 300)
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Cari nama, email, atau telepon"
        aria-label="Cari admin"
        className="w-64 ps-8"
      />
    </div>
  )
}
