export const BACKEND_URL =
  process.env.BACKEND_URL && process.env.BACKEND_URL !== ""
    ? process.env.BACKEND_URL
    : "http://localhost:3001"

export const ACCESS_TOKEN_COOKIE = "access_token"
export const REFRESH_TOKEN_COOKIE = "refresh_token"
export const USER_COOKIE = "user"

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export const APP_NAME = "Jasa Antar"

/**
 * API key Google Maps (Maps JavaScript API + Geocoding API) untuk app
 * pelanggan. Dibaca dari `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` di `.env.local`.
 * Jangan di-hardcode di sini. Bila kosong, peta otomatis berganti ke input
 * koordinat manual (lihat `LocationPicker` / `OrderMap`).
 */
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
