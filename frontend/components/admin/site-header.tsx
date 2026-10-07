"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/admin/theme-toggle"

export function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:h-16 md:px-6">
      <SidebarTrigger className="-ms-1.5" />
      <Separator orientation="vertical" className="h-4 md:ms-1" />
      <div className="ms-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}