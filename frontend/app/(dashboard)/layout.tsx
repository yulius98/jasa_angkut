import { AdminShell } from "@/components/admin/admin-shell"
import { getPublicConfig } from "@/lib/server-config"
import { requireSession } from "@/lib/session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, config] = await Promise.all([
    requireSession(),
    getPublicConfig(),
  ])

  return (
    <AdminShell user={session.user} appName={config.appName}>
      {children}
    </AdminShell>
  )
}