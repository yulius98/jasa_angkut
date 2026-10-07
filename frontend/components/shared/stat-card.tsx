import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "cn"

import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  href?: string
  accent?: boolean
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  accent = false,
}: StatCardProps) {
  const body = (
    <Card
      className={cn(
        "h-full transition-colors",
        href && "hover:bg-muted/40"
      )}
    >
      <CardContent className="flex items-center justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-heading text-2xl font-semibold tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-lg",
              accent
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Icon />
          </span>
        ) : null}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {body}
      </Link>
    )
  }

  return body
}