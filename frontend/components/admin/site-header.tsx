"use client"

import { useState } from "react"
import { ChevronsUpDown, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { ThemeToggle } from "@/components/admin/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { USER_ROLE_META } from "@/lib/format"
import type { SessionUser } from "@/types"

function initials(name: string | undefined): string {
  if (!name) return "A"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "A"
  const first = parts[0][0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : ""
  return (first + last).toUpperCase()
}

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // tetap arahkan ke halaman login
    }
    router.replace("/login")
  }

  const roleMeta = user ? USER_ROLE_META[user.role] : null

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:h-16 md:px-6">
      <SidebarTrigger className="-ms-1.5" />
      <Separator orientation="vertical" className="h-4 md:ms-1" />
      <div className="ms-auto flex items-center gap-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="default" className="h-8 gap-2 px-1.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground uppercase">
                    {initials(user.name)}
                  </span>
                  <span className="hidden text-start leading-tight sm:grid">
                    <span className="max-w-40 truncate text-sm font-medium text-foreground">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {roleMeta?.label ?? user.email}
                    </span>
                  </span>
                  <ChevronsUpDown className="hidden size-3.5 text-muted-foreground sm:block" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={loggingOut}
                onClick={handleLogout}
              >
                <LogOut />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  )
}