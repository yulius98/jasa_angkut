"use client"

import { BottomNav } from "@/components/app/bottom-nav"
import { DesktopSidebar } from "@/components/app/desktop-sidebar"
import type { SessionUser } from "@/types"

/**
 * Shell aplikasi pelanggan.
 *
 * - Handphone/tablet (< lg): persis seperti sebelumnya — kolom `max-w-lg`
 *   di tengah dengan BottomNav, sidebar tidak dirender.
 * - Desktop/laptop (>= lg): sidebar kiri + area konten penuh; tiap halaman
 *   mengatur sendiri lebar kontennya lewat kelas `lg:`.
 */
export function AppShell({
  user,
  children,
}: {
  user: SessionUser | null
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background lg:pl-64">
      <DesktopSidebar user={user} />
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background lg:max-w-none">
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
