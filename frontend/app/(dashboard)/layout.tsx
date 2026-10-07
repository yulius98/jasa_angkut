import { AdminShell } from "@/components/admin/admin-shell"
import { requireSession } from "@/lib/session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()

  return <AdminShell user={session.user}>{children}</AdminShell>
}