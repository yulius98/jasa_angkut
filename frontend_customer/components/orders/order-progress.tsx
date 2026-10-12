import { cn } from "cn"

import { ORDER_PROGRESS_STEPS, progressIndex } from "@/lib/orders"
import type { OrderStatus } from "@/types"

export function OrderProgress({ status }: { status: OrderStatus }) {
  const current = progressIndex(status)
  if (current < 0) return null

  return (
    <ol className="grid">
      {ORDER_PROGRESS_STEPS.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-background",
                  active
                    ? "bg-primary"
                    : done
                      ? "bg-emerald-500"
                      : "bg-border"
                )}
              />
              {index < ORDER_PROGRESS_STEPS.length - 1 ? (
                <span
                  className={cn(
                    "mt-1 w-px flex-1",
                    index < current ? "bg-emerald-500" : "bg-border"
                  )}
                />
              ) : null}
            </div>
            <div
              className={cn(
                "pb-6 text-sm",
                active
                  ? "font-semibold text-foreground"
                  : done
                    ? "text-emerald-600"
                    : "text-muted-foreground"
              )}
            >
              {step.label}
            </div>
          </li>
        )
      })}
    </ol>
  )
}