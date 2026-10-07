import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function LoadingSkeleton({
  rows = 5,
  columns = 4,
  className,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center gap-4 border-b bg-muted/40 px-4 py-3">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-3.5 flex-1" />
          ))}
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton
                  key={j}
                  className={cn("h-3.5 flex-1", j === 0 && "max-w-32")}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}