"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { revalidatePublicConfig } from "@/lib/actions/public-config"

export function RefreshConfigButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    try {
      await revalidatePublicConfig()
      router.refresh()
      toast.success("Konfigurasi diperbarui")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui konfigurasi"
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={pending}>
      {pending ? <Spinner /> : <RefreshCw />}
      Refresh konfigurasi
    </Button>
  )
}
