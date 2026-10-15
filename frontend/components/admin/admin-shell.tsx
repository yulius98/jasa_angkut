"use client"

import { AppSidebar } from "@/components/admin/app-sidebar"
import { SiteHeader } from "@/components/admin/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { SessionUser } from "@/types"

export function AdminShell({
  user = null,
  appName,
  children,
}: {
  user?: SessionUser | null
  appName?: string
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar appName={appName} />
      <SidebarInset className="min-h-dvh">
        <SiteHeader user={user} />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}