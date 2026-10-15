import Link from "next/link"
import {
  ChevronRight,
  ClipboardList,
  Headphones,
  Mail,
  MessageCircle,
  ShieldCheck,
  Truck,
} from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { LogoutButton } from "@/components/account/logout-button"
import { PartnerStatusCard } from "@/components/partner/partner-status-card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { serverFetch } from "@/lib/api"
import { getPublicConfig, type PublicConfig } from "@/lib/server-config"
import { requireSession } from "@/lib/session"
import { USER_ROLE_META } from "@/lib/format"
import type { Partner } from "@/types"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const [session, config] = await Promise.all([
    requireSession(),
    getPublicConfig(),
  ])
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

  let partner: Partner | null = null
  try {
    partner = await serverFetch<Partner>("/partners/me")
  } catch {
    partner = null
  }

  return (
    <div>
      <AppHeader title="Akun" action={<ThemeToggle />} />

      <div className="grid gap-4 px-4 py-4 lg:px-8 lg:py-8">
        <div className="mx-auto grid w-full max-w-3xl gap-4">
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
                {USER_ROLE_META[user?.role ?? "PARTNER"].label}
              </p>
            </div>
          </Card>

          {partner ? <PartnerStatusCard partner={partner} /> : null}

          <Card className="divide-y divide-border">
            <SettingLink href="/orders" icon={ClipboardList} label="Pesanan saya" />
            <SettingLink
              href="/vehicles"
              icon={Truck}
              label="Kendaraan & dokumen"
            />
            <SettingLink href="/chat" icon={Headphones} label="Chat dukungan" />
          </Card>

          <SupportCard config={config} />

          <Card className="flex-row items-start gap-3 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Jasa Antar menjaga data dan transaksi kamu. Pastikan data
              kendaraan dan dokumen selalu diperbarui agar pengajuan serta
              pencairan berjalan lancar.
            </p>
          </Card>

          <LogoutButton />
        </div>
      </div>
    </div>
  )
}

function SupportCard({ config }: { config: PublicConfig }) {
  const whatsappDigits = config.supportWhatsapp.replace(/\D/g, "")
  if (!whatsappDigits && !config.supportEmail) return null

  return (
    <Card className="divide-y divide-border">
      {whatsappDigits ? (
        <a
          href={`https://wa.me/${whatsappDigits}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-4 transition-colors active:bg-muted/50"
        >
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="size-5" />
          </span>
          <span className="flex-1 grid">
            <span className="text-sm font-medium">WhatsApp dukungan</span>
            <span className="text-xs text-muted-foreground">
              {config.supportWhatsapp}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </a>
      ) : null}
      {config.supportEmail ? (
        <a
          href={`mailto:${config.supportEmail}`}
          className="flex items-center gap-3 p-4 transition-colors active:bg-muted/50"
        >
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-5" />
          </span>
          <span className="flex-1 grid">
            <span className="text-sm font-medium">Email dukungan</span>
            <span className="text-xs text-muted-foreground">
              {config.supportEmail}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </a>
      ) : null}
    </Card>
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
