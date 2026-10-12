"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Power } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "cn"
import { setOnlineAction } from "@/lib/actions/orders"

interface OnlineToggleProps {
  isOnline: boolean
  /** Mitra hanya bisa online bila sudah APPROVED. */
  canToggle?: boolean
  size?: "sm" | "default" | "lg"
  className?: string
  label?: boolean
}

export function OnlineToggle({
  isOnline,
  canToggle = true,
  size = "default",
  className,
  label = true,
}: OnlineToggleProps) {
  const router = useRouter()
  const [online, setOnline] = useState(isOnline)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !online
    startTransition(async () => {
      const result = await setOnlineAction(next)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setOnline(next)
      toast.success(next ? "Kamu sekarang online" : "Kamu sekarang offline")
      router.refresh()
    })
  }

  return (
    <Button
      variant={online ? "default" : "outline"}
      size={size}
      onClick={toggle}
      disabled={pending || !canToggle}
      aria-pressed={online}
      className={cn("gap-2", className)}
    >
      {pending ? (
        <Spinner />
      ) : (
        <span className="relative flex size-2.5">
          <span
            className={cn(
              "absolute inline-flex size-full rounded-full",
              online ? "animate-ping bg-emerald-400" : "bg-muted-foreground/40"
            )}
          />
          <span
            className={cn(
              "relative inline-flex size-2.5 rounded-full",
              online ? "bg-emerald-500" : "bg-muted-foreground/50"
            )}
          />
        </span>
      )}
      <Power className="size-4" />
      {label ? (online ? "Online" : "Offline") : null}
    </Button>
  )
}
