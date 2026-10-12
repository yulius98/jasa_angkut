"use client"

import { usePathname } from "next/navigation"

import { cn } from "cn"
import { BottomNav } from "@/components/app/bottom-nav"
import { DesktopSidebar } from "@/components/app/desktop-sidebar"
import type { Partner, SessionUser } from "@/types"

/** Halaman yang memakai layout desktop lebar (daftar/dashboard). */
const WIDE_ROUTES = ["/home", "/jobs", "/orders", "/vehicles"]

function isWide(pathname: string): boolean {
  return WIDE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

/**
 * Shell aplikasi mitra.
 *
 * - Handphone (< lg): kolom `max-w-lg` di tengah dengan BottomNav, sidebar
 *   tidak dirender — tampil seperti aplikasi mobile.
 * - Desktop/laptop (>= lg): sidebar kiri + area konten lebih lebar.
 */
export function AppShell({
  user,
  partner,
  children,
}: {
  user: SessionUser | null
  partner: Partner | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const wide = isWide(pathname)

  return (
    <div className="min-h-dvh bg-background lg:pl-64">
      <DesktopSidebar user={user} partner={partner} />
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full flex-col bg-background",
          wide ? "max-w-lg lg:mx-0 lg:max-w-none" : "max-w-lg"
        )}
      >
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
