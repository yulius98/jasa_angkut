import { AppHeader } from "@/components/app/app-header"
import { DesktopPageHeader } from "@/components/app/desktop-page-header"
import { CreateOrderForm } from "@/components/orders/create-order-form"
import { GOOGLE_MAPS_API_KEY } from "@/lib/config"

export default function NewOrderPage() {
  return (
    <div>
      {/* Handphone (< lg): header mobile seperti sebelumnya. */}
      <AppHeader
        title="Pesan Jasa Antar"
        subtitle="Pilih titik, kendaraan, dan jadwal"
        back
      />

      {/* Desktop/laptop (>= lg). */}
      <DesktopPageHeader
        title="Pesan Jasa Antar"
        subtitle="Pilih titik jemput, tujuan, kendaraan, dan jadwal"
        backHref="/home"
        maxWidthClassName="max-w-3xl"
      />

      <CreateOrderForm apiKey={GOOGLE_MAPS_API_KEY} />
    </div>
  )
}
