import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function PartnersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <LoadingSkeleton rows={8} columns={6} />
    </div>
  )
}