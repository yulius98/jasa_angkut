import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <LoadingSkeleton columns={7} rows={10} />
    </div>
  )
}
