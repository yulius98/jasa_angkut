import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function PartnerDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-72 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <LoadingSkeleton rows={6} columns={2} />
          <LoadingSkeleton rows={2} columns={3} />
        </div>
        <LoadingSkeleton rows={4} columns={1} />
      </div>
    </div>
  )
}