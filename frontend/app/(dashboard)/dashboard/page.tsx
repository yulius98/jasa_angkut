import Link from "next/link"
import {
  Banknote,
  ClipboardList,
  Scale,
  Users,
  Wallet,
} from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const modules = [
  {
    title: "Verifikasi Mitra",
    description: "Periksa dan verifikasi calon mitra.",
    url: "/partners",
    icon: Users,
  },
  {
    title: "Pesanan",
    description: "Pantau status pesanan dan pelacakan.",
    url: "/orders",
    icon: ClipboardList,
  },
  {
    title: "Pembayaran",
    description: "Kelola transaksi pembayaran.",
    url: "/payments",
    icon: Wallet,
  },
  {
    title: "Dispute",
    description: "Tangani komplain dan sengketa.",
    url: "/disputes",
    icon: Scale,
  },
  {
    title: "Pencairan",
    description: "Proses pencairan dana mitra.",
    url: "/withdrawals",
    icon: Banknote,
  },
]

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Selamat datang di dashboard admin Jasa Antar."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Pesanan", value: "-" },
          { label: "Mitra Aktif", value: "-" },
          { label: "Pendapatan", value: "-" },
          { label: "Dispute Terbuka", value: "-" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between">
              <div className="grid gap-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-heading text-2xl font-semibold">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="grid gap-1">
        <h2 className="font-heading text-lg font-semibold">Modul Admin</h2>
        <p className="text-sm text-muted-foreground">
          Modul sedang diaktifkan satu per satu.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link key={m.url} href={m.url}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <m.icon className="size-4" />
                  {m.title}
                </CardTitle>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}