import { formatDateTime, ORDER_STATUS_META } from "@/lib/format"
import { StatusBadge } from "@/components/shared/status-badge"
import type { OrderStatusHistory } from "@/types"

export function OrderTimeline({ history }: { history: OrderStatusHistory[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada histori status untuk pesanan ini.
      </p>
    )
  }

  const items = [...history].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )

  return (
    <ol className="grid gap-4">
      {items.map((item, index) => (
        <li key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-background" />
            {index < items.length - 1 ? (
              <span className="mt-1 w-px flex-1 bg-border" />
            ) : null}
          </div>
          <div className="grid min-w-0 gap-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge meta={ORDER_STATUS_META[item.status]} />
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDateTime(item.createdAt)}
              </span>
            </div>
            {item.note ? (
              <p className="text-sm text-muted-foreground">{item.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
