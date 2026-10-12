import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { isPartnerRole, parseSessionUser } from "@/lib/auth"
import { ACCESS_TOKEN_COOKIE, BACKEND_URL, USER_COOKIE } from "@/lib/config"
import { persistRefreshedTokens, refreshAccessToken } from "@/lib/api"

// Mitra mengirim titik lokasi GPS-nya lewat route ini (dipanggil berkala dari
// perangkat saat order aktif). Token diambil dari cookie httpOnly sehingga
// tidak terekspos ke JavaScript klien.
export async function POST(request: NextRequest) {
  const store = await cookies()
  const user = parseSessionUser(store.get(USER_COOKIE)?.value)
  if (!user || !isPartnerRole(user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Request tidak valid" }, { status: 400 })
  }

  async function send(token: string | undefined) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    if (token) headers.Authorization = `Bearer ${token}`
    return fetch(`${BACKEND_URL}/tracking`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    })
  }

  let token = store.get(ACCESS_TOKEN_COOKIE)?.value
  let res = await send(token)

  if ((res.status === 401 || res.status === 403) && token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      await persistRefreshedTokens(store, refreshed)
      token = refreshed.accessToken
      res = await send(token)
    }
  }

  const data = (await res.json().catch(() => null)) as unknown

  if (!res.ok) {
    return NextResponse.json(
      data ?? { message: "Gagal mengirim lokasi" },
      { status: res.status }
    )
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  })
}
