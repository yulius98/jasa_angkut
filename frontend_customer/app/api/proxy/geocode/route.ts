import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { persistRefreshedTokens, refreshAccessToken } from "@/lib/api"
import { isCustomerRole, parseSessionUser } from "@/lib/auth"
import { ACCESS_TOKEN_COOKIE, BACKEND_URL, USER_COOKIE } from "@/lib/config"
import type { GeocodeHit } from "@/types"

/**
 * Proxy geocoding menuju backend (`GET /geocode` & `GET /geocode/reverse`).
 *
 * Google Geocoding dipanggil di server backend, bukan browser, agar bebas dari
 * pembatasan API restriction/referrer pada API key.  Endpoint backend memakai
 * JWT, jadi proxy meneruskan access token dari cookie sesi dan mencoba refresh
 * sekali bila ditolak (pola sama seperti proxy tracking).
 *
 * Mode:
 * - `?address=...`           → cari koordinat dari teks alamat
 * - `?lat=..&lng=..`         → cari alamat dari koordinat (reverse)
 */
export const runtime = "nodejs"

function buildBackendPath(request: NextRequest): string | null {
  const params = request.nextUrl.searchParams
  const address = params.get("address")?.trim() ?? ""
  if (address) {
    return `/geocode?address=${encodeURIComponent(address)}`
  }
  const lat = Number(params.get("lat"))
  const lng = Number(params.get("lng"))
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    return `/geocode/reverse?lat=${lat}&lng=${lng}`
  }
  return null
}

async function fetchGeocode(
  path: string,
  token: string | undefined
): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${BACKEND_URL}${path}`, { cache: "no-store", headers })
}

export async function GET(request: NextRequest) {
  const store = await cookies()
  const user = parseSessionUser(store.get(USER_COOKIE)?.value)
  if (!user || !isCustomerRole(user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const path = buildBackendPath(request)
  if (!path) {
    return NextResponse.json(
      { message: "Parameter alamat atau koordinat tidak valid" },
      { status: 400 }
    )
  }

  let token = store.get(ACCESS_TOKEN_COOKIE)?.value
  let res = await fetchGeocode(path, token)

  if (res.status === 401 && token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      await persistRefreshedTokens(store, refreshed)
      token = refreshed.accessToken
      res = await fetchGeocode(path, token)
    }
  }

  const data = (await res.json().catch(() => null)) as
    | { message?: string; results?: GeocodeHit[] }
    | null

  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message ?? "Pencarian lokasi gagal." },
      { status: res.status }
    )
  }

  return NextResponse.json(
    { results: data?.results ?? [] },
    { headers: { "Cache-Control": "private, no-store" } }
  )
}
