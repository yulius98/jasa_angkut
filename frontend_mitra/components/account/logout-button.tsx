"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // cookie tetap dibersihkan oleh route handler di sisi server
    }
    router.replace("/login")
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="h-11 w-full text-destructive"
      onClick={logout}
      disabled={pending}
    >
      {pending ? <Spinner /> : <LogOut className="size-4" />}
      Keluar
    </Button>
  )
}