import { TriangleAlertIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"

interface ErrorStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function ErrorState({
  title = "Terjadi kesalahan",
  description = "Data tidak dapat dimuat. Silakan coba lagi.",
  action,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border">
      <EmptyState
        icon={TriangleAlertIcon}
        title={title}
        description={description}
        action={action}
      />
    </div>
  )
}