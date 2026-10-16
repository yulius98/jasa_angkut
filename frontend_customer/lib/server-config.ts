import { BACKEND_URL } from "@/lib/config"
import type { PaymentMethodSettings } from "@/types"

export interface PublicConfig {
  appName: string
  googleMapsApiKey: string
  supportWhatsapp: string
  supportEmail: string
  minAppVersion: string
}

export interface BackendHealth {
  status: string
  version: string
  uptimeSeconds: number
  timestamp: string
}

const FALLBACK_PUBLIC_CONFIG: PublicConfig = {
  appName: "Jasa Antar",
  googleMapsApiKey: "",
  supportWhatsapp: "",
  supportEmail: "",
  minAppVersion: "",
}

/**
 * Ambil konfigurasi publik dari backend lewat `GET /config/public`.
 *
 * Backend (`Backend/.env`) adalah satu-satunya sumber nilai ini — jadi semua
 * frontend (admin, pelanggan, mitra) tidak lagi menyimpan salinannya sendiri.
 * Dipanggil di Server Component, lalu hasilnya dipakai langsung atau
 * diteruskan sebagai prop. Sengaja `no-store` supaya perubahan di backend
 * (setelah `POST /config/public/revalidate`) langsung terlihat tanpa menunggu
 * cache kedaluwarsa.
 *
 * Bila backend tidak dapat dihubungi, kembalikan nilai default agar halaman
 * tetap tampil (peta otomatis jatuh ke tampilan "belum dikonfigurasi").
 */
export async function getPublicConfig(): Promise<PublicConfig> {
  try {
    const res = await fetch(`${BACKEND_URL}/config/public`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!res.ok) return FALLBACK_PUBLIC_CONFIG
    const data = (await res.json()) as Partial<PublicConfig>
    return { ...FALLBACK_PUBLIC_CONFIG, ...data }
  } catch {
    return FALLBACK_PUBLIC_CONFIG
  }
}

export async function getGoogleMapsApiKey(): Promise<string> {
  return (await getPublicConfig()).googleMapsApiKey
}

const FALLBACK_PAYMENT_METHOD_SETTINGS: PaymentMethodSettings = {
  // Default lama: online Midtrans + tunai selalu tersedia.
  mode: "MIDTRANS_CASH",
  gateway: "MIDTRANS",
  cashEnabled: true,
  midtransClientKey: "",
  midtransIsProduction: false,
  midtransSnapJsUrl: "https://app.sandbox.midtrans.com/snap/snap.js",
}

/**
 * Metode pembayaran yang sedang diizinkan admin lewat `GET /payments/methods`
 * (endpoint publik, tanpa auth). Dipakai untuk menyembunyikan tombol metode
 * yang tidak aktif di halaman order. Bila backend tidak dapat dihubungi,
 * kembalikan default agar halaman tetap tampil.
 */
export async function getPaymentMethodSettings(): Promise<PaymentMethodSettings> {
  try {
    const res = await fetch(`${BACKEND_URL}/payments/methods`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!res.ok) return FALLBACK_PAYMENT_METHOD_SETTINGS
    const data = (await res.json()) as Partial<PaymentMethodSettings>
    return { ...FALLBACK_PAYMENT_METHOD_SETTINGS, ...data }
  } catch {
    return FALLBACK_PAYMENT_METHOD_SETTINGS
  }
}

/** Status & versi backend, untuk halaman status/monitoring. */
export async function getBackendHealth(): Promise<BackendHealth | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/config/health`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as BackendHealth
  } catch {
    return null
  }
}
