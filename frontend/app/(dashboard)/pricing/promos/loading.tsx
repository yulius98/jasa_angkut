import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
      </div>
      <LoadingSkeleton columns={9} rows={8} />
    </div>
  )
}
