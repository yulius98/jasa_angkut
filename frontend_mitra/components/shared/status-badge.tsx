import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import type { StatusMeta } from "@/lib/format"

export function StatusBadge({
  meta,
  className,
}: {
  meta: StatusMeta
  className?: string
}) {
  return (
    <Badge variant={meta.variant} className={cn("capitalize", className)}>
      {meta.label}
    </Badge>
  )
}