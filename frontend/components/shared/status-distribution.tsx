import { cn } from "cn"

import type { StatusMeta } from "@/lib/format"
import { StatusBadge } from "@/components/shared/status-badge"

export interface DistributionItem {
  key: string
  count: number
  meta: StatusMeta
}

interface StatusDistributionProps {
  items: DistributionItem[]
  total: number
}

export function StatusDistribution({
  items,
  total,
}: StatusDistributionProps) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const percent = total === 0 ? 0 : Math.round((item.count / total) * 100)
        return (
          <li
            key={item.key}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
          >
            <StatusBadge meta={item.meta} className="w-40 justify-center" />
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  percent === 0 ? "bg-muted" : "bg-primary"
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-14 text-right text-sm font-medium tabular-nums">
              {item.count}
            </span>
          </li>
        )
      })}
    </ul>
  )
}