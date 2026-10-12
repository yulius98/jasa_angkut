import { AppShell } from "@/components/app/app-shell"
import { serverFetch } from "@/lib/api"
import { requireSession } from "@/lib/session"
import type { Partner } from "@/types"

export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireSession()

  let partner: Partner | null = null
  try {
    partner = await serverFetch<Partner>("/partners/me")
  } catch {
    partner = null
  }

  return (
    <AppShell user={session.user} partner={partner}>
      {children}
    </AppShell>
  )
}
