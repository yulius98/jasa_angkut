"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Headset,
  Home,
  LogOut,
  MessageCircle,
  PackagePlus,
  PackageSearch,
  Truck,
  User,
  type LucideIcon,
} from "lucide-react"

import { cn } from "cn"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { APP_NAME } from "@/lib/config"
import type { SessionUser } from "@/types"

const NAV_ITEMS: {
  href: string
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    href: "/home",
    label: "Beranda",
    description: "Ringkasan & pesan baru",
    icon: Home,
  },
  {
    href: "/orders",
    label: "Pesanan",
    description: "Riwayat & pelacakan",
    icon: PackageSearch,
  },
  {
    href: "/chat",
    label: "Chat",
    description: "Mitra & dukungan",
    icon: MessageCircle,
  },
  {
    href: "/account",
    label: "Akun",
    description: "Profil & pengaturan",
    icon: User,
  },
]

function initialsOf(name: string | undefined): string {
  if (!name) return "?"
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}

/**
 * Sidebar navigasi khusus desktop/laptop (>= lg). Tidak dirender pada
 * handphone sehingga tampilan mobile tetap sama seperti sebelumnya.
 */
export function DesktopSidebar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // cookie tetap dibersihkan oleh route handler di sisi server
    }
    router.replace("/login")
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Truck className="size-5" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold tracking-tight">{APP_NAME}</p>
          <p className="truncate text-xs text-muted-foreground">
            Aplikasi Pelanggan
          </p>
        </div>
      </div>

      <div className="p-3">
        <Button
          className="h-10 w-full justify-start gap-2"
          nativeButton={false}
          render={<Link href="/orders/new" />}
        >
          <PackagePlus className="size-4" />
          Pesan Baru
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">
          Menu
        </p>
        <ul className="grid gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    <span
                      className={cn(
                        "block truncate text-xs font-normal",
                        active
                          ? "text-primary/70"
                          : "text-muted-foreground/80"
                      )}
                    >
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t p-3">
        <Link
          href="/account"
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
        >
          <Avatar className="size-9 rounded-full">
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {initialsOf(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user?.name ?? "Pelanggan"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
        </Link>

        <div className="mt-1 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Headset className="size-3.5" />
            Butuh bantuan?
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-destructive"
            onClick={logout}
            disabled={pending}
          >
            {pending ? <Spinner /> : <LogOut className="size-4" />}
            Keluar
          </Button>
        </div>
      </div>
    </aside>
  )
}
