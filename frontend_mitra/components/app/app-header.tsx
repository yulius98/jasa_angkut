"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"

interface AppHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
  className?: string
}

export function AppHeader({
  title,
  subtitle,
  back = false,
  action,
  className,
}: AppHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-background/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 px-3">
        {back ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Kembali"
            className="-ml-1 shrink-0"
            onClick={() => router.back()}
          >
            <ChevronLeft className="size-5" />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  )
}
