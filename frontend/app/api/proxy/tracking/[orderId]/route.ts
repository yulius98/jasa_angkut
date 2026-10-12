import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { isAdminRole, parseSessionUser } from "@/lib/auth"
import {
  BACKEND_URL,
  ACCESS_TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/config"
import { persistRefreshedTokens, refreshAccessToken } from "@/lib/api"
import type { TrackingPoint, TrackingSnapshot } from "@/types"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const HISTORY_LIMIT = 500

// Mengambil latest + history dalam satu respons supaya polling peta cukup
// satu request ke backend tiap interval.
async function fetchSnapshot(
  orderId: string,
  token: string | undefined
): Promise<TrackingSnapshot | null> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`

  const latestRes = await fetch(
    `${BACKEND_URL}/tracking/orders/${orderId}/latest`,
    { cache: "no-store", headers }
  )

  // Belum ada titik lokasi sama sekali → snapshot kosong (bukan error).
  if (latestRes.status === 404) {
    return { latest: null, history: [] }
  }
  if (!latestRes.ok) return null

  const latest = (await latestRes.json()) as TrackingPoint

  const historyRes = await fetch(
    `${BACKEND_URL}/tracking/orders/${orderId}/history?limit=${HISTORY_LIMIT}`,
    { cache: "no-store", headers }
  )
  if (!historyRes.ok) return null
  const history = (await historyRes.json()) as TrackingPoint[]

  return { latest, history }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const store = await cookies()
  const user = parseSessionUser(store.get(USER_COOKIE)?.value)
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { orderId } = await params
  if (!UUID_RE.test(orderId)) {
    return NextResponse.json(
      { message: "Order id tidak valid" },
      { status: 400 }
    )
  }

  let token = store.get(ACCESS_TOKEN_COOKIE)?.value
  let snapshot = await fetchSnapshot(orderId, token)

  if (!snapshot && token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      await persistRefreshedTokens(store, refreshed)
      token = refreshed.accessToken
      snapshot = await fetchSnapshot(orderId, token)
    }
  }

  if (!snapshot) {
    return NextResponse.json(
      { message: "Tidak dapat memuat data pelacakan" },
      { status: 502 }
    )
  }

  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  })
}
