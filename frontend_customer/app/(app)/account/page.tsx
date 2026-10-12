import Link from "next/link"
import { ChevronRight, ClipboardList, Headphones, ShieldCheck } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { LogoutButton } from "@/components/account/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { requireSession } from "@/lib/session"
import { USER_ROLE_META } from "@/lib/format"

export default async function AccountPage() {
  const session = await requireSession()
  const user = session.user
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?"

  return (
    <div>
      <AppHeader
        title="Akun"
        action={<ThemeToggle />}
      />

      <div className="grid gap-4 px-4 py-4">
        <Card className="flex-row items-center gap-4 p-5">
          <Avatar className="size-14 rounded-full">
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{user?.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {USER_ROLE_META[user?.role ?? "CUSTOMER"].label}
            </p>
          </div>
        </Card>

        <Card className="divide-y divide-border">
          <SettingLink
            href="/orders"
            icon={ClipboardList}
            label="Pesanan saya"
          />
          <SettingLink href="/chat" icon={Headphones} label="Chat dukungan" />
        </Card>

        <Card className="flex-row items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Jasa Antar menjaga data dan transaksi kamu. Pembayaran tunai
            dikonfirmasi langsung oleh mitra, sedangkan pembayaran online
            diproses melalui gateway pembayaran resmi.
          </p>
        </Card>

        <LogoutButton />
      </div>
    </div>
  )
}

function SettingLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 transition-colors active:bg-muted/50"
    >
      <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  )
}