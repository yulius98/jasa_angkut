import { AppHeader } from "@/components/app/app-header"
import { CreateOrderForm } from "@/components/orders/create-order-form"
import { GOOGLE_MAPS_API_KEY } from "@/lib/config"

export default function NewOrderPage() {
  return (
    <div>
      <AppHeader title="Pesan Jasa Antar" subtitle="Pilih titik, kendaraan, dan jadwal" back />
      <CreateOrderForm apiKey={GOOGLE_MAPS_API_KEY} />
    </div>
  )
}