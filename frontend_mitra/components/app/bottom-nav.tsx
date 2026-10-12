"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardList,
  Home,
  MessageCircle,
  PackageSearch,
  User,
} from "lucide-react"

import { cn } from "cn"

const items = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/jobs", label: "Cari Order", icon: PackageSearch },
  { href: "/orders", label: "Pesanan", icon: ClipboardList },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/account", label: "Akun", icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <ul className="grid grid-cols-5 px-1 pb-safe">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full transition-colors",
                    active && "bg-primary/10"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
