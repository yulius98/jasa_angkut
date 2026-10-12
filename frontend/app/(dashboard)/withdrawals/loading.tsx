import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-16 w-full animate-pulse rounded-xl bg-muted" />
      <LoadingSkeleton columns={8} rows={8} />
    </div>
  )
}
