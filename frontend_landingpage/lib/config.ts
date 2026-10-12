export const APP_NAME = "Jasa Antar"

/**
 * URL aplikasi pelanggan & mitra. Landing page adalah situs statis murni
 * (tanpa backend/session), jadi semua CTA mengarah ke app terkait lewat URL
 * absolut. Atur lewat env saat deploy (mis. https://app.jasaantar.com).
 */
export const CUSTOMER_APP_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? "http://localhost:3002"

export const PARTNER_APP_URL =
  process.env.NEXT_PUBLIC_PARTNER_APP_URL ?? "http://localhost:3004"
