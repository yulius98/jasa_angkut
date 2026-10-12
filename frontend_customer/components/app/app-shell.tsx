"use client"

import { usePathname } from "next/navigation"

import { cn } from "cn"
import { BottomNav } from "@/components/app/bottom-nav"
import { DesktopSidebar } from "@/components/app/desktop-sidebar"
import type { SessionUser } from "@/types"

/**
 * Shell aplikasi pelanggan.
 *
 * - Handphone/tablet (< lg): persis seperti sebelumnya — kolom `max-w-lg`
 *   di tengah dengan BottomNav, sidebar tidak dirender.
 * - Desktop/laptop (>= lg): sidebar kiri + area konten lebih lebar.
 */
export function AppShell({
  user,
  children,
}: {
  user: SessionUser | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // Halaman beranda memakai layout desktop yang lebih lebar; halaman lain
  // tetap memakai kolom nyaman `max-w-lg`.
  const isHome = pathname === "/home" || pathname.startsWith("/home/")

  return (
    <div className="min-h-dvh bg-background lg:pl-64">
      <DesktopSidebar user={user} />
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full flex-col bg-background",
          isHome ? "max-w-lg lg:mx-0 lg:max-w-none" : "max-w-lg"
        )}
      >
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
