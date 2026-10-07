"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Banknote,
  ClipboardList,
  LayoutDashboard,
  Scale,
  Tag,
  TicketPercent,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  badge?: string
}

const menuItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
]

const operationalItems: NavItem[] = [
  { title: "Verifikasi Mitra", url: "/partners", icon: Users },
  { title: "Pesanan", url: "/orders", icon: ClipboardList },
  { title: "Pembayaran", url: "/payments", icon: Wallet },
  { title: "Dispute", url: "/disputes", icon: Scale },
  { title: "Pencairan", url: "/withdrawals", icon: Banknote },
]

const configurationItems: NavItem[] = [
  { title: "Zona Harga", url: "/pricing/zones", icon: Tag },
  { title: "Kode Promo", url: "/pricing/promos", icon: TicketPercent },
]

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`)
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.title}
                  render={<Link href={item.url} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                  {item.badge ? (
                    <Badge
                      variant="secondary"
                      className="pointer-events-none ms-auto"
                    >
                      {item.badge}
                    </Badge>
                  ) : null}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Truck />
              </div>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate font-heading font-semibold">
                  Jasa Antar
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  Admin Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Menu" items={menuItems} />
        <SidebarSeparator />
        <NavGroup label="Operasional" items={operationalItems} />
        <NavGroup label="Konfigurasi" items={configurationItems} />
      </SidebarContent>

      <SidebarFooter>
        <span className="px-2 text-xs text-sidebar-foreground/50">
          Admin Portal v1.0
        </span>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}