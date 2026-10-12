import Link from "next/link"
import {
  ArrowRight,
  Bike,
  Box,
  CheckCircle2,
  Clock,
  Headset,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  PackagePlus,
  Receipt,
  Route,
  ShieldCheck,
  Star,
  Truck,
  Wallet,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { APP_NAME, CUSTOMER_APP_URL } from "@/lib/config"

const VEHICLES = [
  {
    icon: Bike,
    name: "Motor",
    description: "Paket kecil & dokumen. Paling cepat dan hemat untuk jarak dekat.",
  },
  {
    icon: Truck,
    name: "Pickup",
    description: "Perabot, barang elektronik, dan belanjaan dalam jumlah sedang.",
  },
  {
    icon: Box,
    name: "Box Truk",
    description: "Pindahan rumah atau kiriman besar yang butuh ruang tertutup.",
  },
  {
    icon: Package,
    name: "Truk Besar",
    description: "Kebutuhan pindahan kantor dan kargo bervolume besar.",
  },
] as const

const FEATURES = [
  {
    icon: Receipt,
    title: "Estimasi harga transparan",
    description:
      "Lihat perkiraan biaya berdasarkan jarak dan jenis kendaraan sebelum pesan. Tanpa biaya tersembunyi.",
  },
  {
    icon: Route,
    title: "Lacak real-time",
    description:
      "Pantau posisi mitra dan status pesanan dari penjemputan sampai barang tiba di tujuan.",
  },
  {
    icon: MessageCircle,
    title: "Chat langsung",
    description:
      "Hubungi mitra untuk pesanan atau tim dukungan Jasa Antar kapan saja saat dibutuhkan.",
  },
  {
    icon: Wallet,
    title: "Pembayaran fleksibel",
    description:
      "Bayar tunai atau nontunai lewat Virtual Account, e-wallet, kartu kredit, hingga QRIS.",
  },
  {
    icon: ShieldCheck,
    title: "Mitra terverifikasi",
    description:
      "Setiap mitra melewati verifikasi dokumen dan dinilai dari setiap pengiriman yang selesai.",
  },
  {
    icon: Star,
    title: "Beri rating & ulasan",
    description:
      "Nilai kualitas layanan mitra setelah pesanan selesai untuk menjaga standar pengiriman.",
  },
] as const

const STEPS = [
  {
    icon: PackagePlus,
    title: "Buat pesanan",
    description:
      "Tentukan titik jemput & tujuan, pilih kendaraan, lalu dapatkan estimasi harga.",
  },
  {
    icon: MapPin,
    title: "Mitra ditugaskan",
    description:
      "Kami carikan mitra terdekat yang sesuai dengan kebutuhan pengiriman kamu.",
  },
  {
    icon: Route,
    title: "Lacak pengiriman",
    description:
      "Ikuti perjalanan barang secara real-time dan chat mitra bila perlu.",
  },
  {
    icon: PackageCheck,
    title: "Barang tiba",
    description:
      "Konfirmasi penerimaan, selesaikan pembayaran, lalu beri rating untuk mitra.",
  },
] as const

const ORDER_PATH = "/orders/new"

const orderHref = `${CUSTOMER_APP_URL}/login?next=${encodeURIComponent(ORDER_PATH)}`
const registerHref = `${CUSTOMER_APP_URL}/register?next=${encodeURIComponent(ORDER_PATH)}`
const loginHref = `${CUSTOMER_APP_URL}/login`

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <Services />
        <Features />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Truck className="size-5" />
          </span>
          <span className="text-base font-bold tracking-tight">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <AnchorLink href="#layanan">Layanan</AnchorLink>
          <AnchorLink href="#fitur">Fitur</AnchorLink>
          <AnchorLink href="#cara-kerja">Cara Kerja</AnchorLink>
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href={loginHref} />}
            className="hidden sm:inline-flex"
          >
            Masuk
          </Button>
          <Button nativeButton={false} render={<Link href={registerHref} />}>
            Daftar
          </Button>
        </div>
      </div>
    </header>
  )
}

function AnchorLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-background to-background"
      />
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:py-24 lg:px-8">
        <div className="grid gap-6">
          <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1">
            <span className="size-1.5 rounded-full bg-primary" />
            Jasa angkut &amp; pindahan terpercaya
          </Badge>

          <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Kirim barang <span className="text-primary">lebih mudah</span>, ke
            mana saja.
          </h1>

          <p className="max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
            Pesan motor, pickup, sampai truk besar untuk kebutuhan kiriman dan
            pindahan. Dapatkan estimasi harga, lacak real-time, dan bayar dengan
            cara yang paling nyaman untukmu.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href={orderHref} />}
              className="h-12 gap-2 px-6 text-base"
            >
              <PackagePlus className="size-5" />
              Pesan Sekarang
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="#cara-kerja" />}
              className="h-12 gap-2 px-6 text-base"
            >
              Lihat Cara Kerja
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href={registerHref}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Daftar gratis
            </Link>{" "}
            dan mulai kirim dalam hitungan menit.
          </p>

          <dl className="grid grid-cols-3 gap-4 border-t pt-6">
            <Stat value="4" label="Jenis kendaraan" />
            <Stat value="24/7" label="Chat dukungan" />
            <Stat value="Real-time" label="Pelacakan" />
          </dl>
        </div>

        <HeroPreview />
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xl font-semibold tracking-tight sm:text-2xl">
        {value}
      </dt>
      <dd className="text-xs text-muted-foreground sm:text-sm">{label}</dd>
    </div>
  )
}

function HeroPreview() {
  const steps = ["Mitra ditugaskan", "Dalam perjalanan", "Tiba di tujuan"]
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-linear-to-br from-primary/15 via-transparent to-chart-3/20 blur-2xl"
      />

      <Card className="gap-5 p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Bike className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Pesanan berjalan</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                JA-2406-XXXX
              </p>
            </div>
          </div>
          <Badge variant="default" className="px-2.5 py-1">
            Dalam Perjalanan
          </Badge>
        </div>

        <div className="grid gap-3 rounded-xl bg-muted/60 p-3">
          <div className="flex items-start gap-3">
            <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Jemput</p>
              <p className="truncate text-sm font-medium">
                Jl. Merdeka No. 12, Jakarta
              </p>
            </div>
          </div>
          <div className="ml-[5px] h-4 border-l border-dashed" />
          <div className="flex items-start gap-3">
            <span className="mt-1 size-2.5 shrink-0 rounded-full bg-destructive" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Tujuan</p>
              <p className="truncate text-sm font-medium">
                Jl. Sudirman No. 88, Bandung
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-2 text-sm">
              {index < 2 ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <Clock className="size-4 text-muted-foreground" />
              )}
              <span
                className={
                  index < 2 ? "font-medium" : "text-muted-foreground"
                }
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">Estimasi biaya</span>
          <span className="text-base font-semibold tabular-nums">
            Rp 185.000
          </span>
        </div>
      </Card>

      <Card
        size="sm"
        className="absolute -bottom-5 -left-4 hidden items-center gap-2 p-3 shadow-lg sm:flex"
      >
        <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
          <Wallet className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold">Pembayaran aman</p>
          <p className="text-[11px] text-muted-foreground">VA, e-wallet, QRIS</p>
        </div>
      </Card>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mx-auto grid max-w-2xl gap-3 text-center">
      <span className="text-sm font-semibold text-primary">{eyebrow}</span>
      <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="text-base text-pretty text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function Services() {
  return (
    <section id="layanan" className="scroll-mt-20 border-b py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pilih kendaraan"
          title="Satu aplikasi untuk semua kebutuhan kirim"
          description="Dari paket kecil sampai pindahan besar, pilih kendaraan yang paling pas dengan barang dan budget kamu."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VEHICLES.map((vehicle) => (
            <Card
              key={vehicle.name}
              className="gap-3 p-5 transition-shadow hover:shadow-md"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <vehicle.icon className="size-6" />
              </span>
              <h3 className="text-base font-semibold">{vehicle.name}</h3>
              <p className="text-sm text-muted-foreground">
                {vehicle.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="fitur" className="scroll-mt-20 border-b py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Kenapa Jasa Antar"
          title="Dibuat supaya pengiriman tidak bikin repot"
          description="Semua yang kamu butuhkan untuk memesan, memantau, dan menyelesaikan pengiriman ada di satu tempat."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </span>
              <div className="grid gap-1">
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section
      id="cara-kerja"
      className="scroll-mt-20 border-b bg-muted/30 py-16 sm:py-20"
    >
      <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Cara kerja"
          title="Kirim barang hanya dalam 4 langkah"
          description="Prosesnya sederhana dan bisa diselesaikan langsung dari ponsel kamu."
        />

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="size-6" />
                  </span>
                  <span className="text-2xl font-bold text-muted-foreground/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="relative gap-6 overflow-hidden bg-primary p-8 text-primary-foreground ring-primary/20 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary-foreground/10 blur-2xl"
          />
          <div className="grid max-w-2xl gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              Mulai kirim barang pertamamu sekarang
            </h2>
            <p className="text-pretty text-primary-foreground/80">
              Masuk ke akunmu untuk memesan. Belum punya akun? Daftar gratis
              hanya dalam satu menit.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<Link href={orderHref} />}
              className="h-12 gap-2 px-6 text-base"
            >
              <PackagePlus className="size-5" />
              Pesan Sekarang
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href={registerHref} />}
              className="h-12 gap-2 border-transparent bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Daftar Gratis
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Card>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">
                Kirim barang lebih mudah, cepat, dan terpercaya.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link
              href="#layanan"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Layanan
            </Link>
            <Link
              href="#fitur"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Fitur
            </Link>
            <Link
              href="#cara-kerja"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Cara Kerja
            </Link>
            <Link
              href={loginHref}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Masuk
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t pt-6 text-xs text-muted-foreground">
          <Headset className="size-3.5" />
          <span>
            Butuh bantuan? Tim dukungan {APP_NAME} siap membantu lewat chat di
            dalam aplikasi.
          </span>
        </div>
      </div>
    </footer>
  )
}
