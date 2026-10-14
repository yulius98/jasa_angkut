export const BACKEND_URL =
  process.env.BACKEND_URL && process.env.BACKEND_URL !== ""
    ? process.env.BACKEND_URL
    : "http://localhost:3001"

// Cookie di-namespace ("mitra_") supaya sesi app mitra tidak bentrok dengan
// app pelanggan/admin saat berjalan di host yang sama (mis. localhost).
export const ACCESS_TOKEN_COOKIE = "mitra_access_token"
export const REFRESH_TOKEN_COOKIE = "mitra_refresh_token"
export const USER_COOKIE = "mitra_user"

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export const APP_NAME = "Jasa Antar Mitra"

/**
 * API key Google Maps (Maps JavaScript API + Geocoding API) untuk app mitra.
 * Dibaca dari `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` di `.env.local`. Jangan
 * di-hardcode di sini. Bila kosong, peta otomatis berganti ke input koordinat
 * manual.
 */
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
