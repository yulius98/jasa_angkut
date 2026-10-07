export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-1">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl bg-card p-[var(--card-spacing)] ring-1 ring-foreground/10"
          >
            <div className="grid gap-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-6 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="size-10 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((c) => (
          <div
            key={c}
            className="flex flex-col gap-4 rounded-xl bg-card p-[var(--card-spacing)] ring-1 ring-foreground/10"
          >
            <div className="h-5 w-56 animate-pulse rounded bg-muted" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-2 flex-1 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-14 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}