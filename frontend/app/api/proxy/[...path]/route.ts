import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { isAdminRole, parseSessionUser } from "@/lib/auth"
import {
  BACKEND_URL,
  ACCESS_TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/config"
import { persistRefreshedTokens, refreshAccessToken } from "@/lib/api"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// Hanya pola path tertentu yang diizinkan di-forward ke backend (cegah SSRF ke
// endpoint lain) dan parameter dinamis divalidasi (UUID / enum).
function isAllowedPath(path: string[]): boolean {
  const [resource, id, kind, value] = path
  if (resource === "partners" && path.length === 4) {
    return (
      UUID_RE.test(id) &&
      kind === "documents" &&
      (value === "ktp" || value === "sim")
    )
  }
  if (resource === "vehicles" && path.length === 4) {
    return (
      UUID_RE.test(id) && kind === "files" && (value === "stnk" || value === "photo")
    )
  }
  return false
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const store = await cookies()
  const user = parseSessionUser(store.get(USER_COOKIE)?.value)
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const path = (await params).path
  if (!Array.isArray(path) || !isAllowedPath(path)) {
    return NextResponse.json(
      { message: "Path tidak valid" },
      { status: 400 }
    )
  }

  const url = `${BACKEND_URL}/${path.join("/")}`
  const doFetch = (token: string | undefined) =>
    fetch(url, {
      cache: "no-store",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

  let token = store.get(ACCESS_TOKEN_COOKIE)?.value
  let res = await doFetch(token)

  if ((res.status === 401 || res.status === 403) && token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      await persistRefreshedTokens(store, refreshed)
      token = refreshed.accessToken
      res = await doFetch(token)
    }
  }

  if (!res.ok) {
    return NextResponse.json(
      { message: "Tidak dapat memuat dokumen" },
      { status: res.status }
    )
  }

  const buffer = await res.arrayBuffer()
  const headers_ = new Headers()
  headers_.set(
    "Content-Type",
    res.headers.get("content-type") ?? "application/octet-stream"
  )
  headers_.set("Cache-Control", "private, no-store")
  return new NextResponse(buffer, { status: 200, headers: headers_ })
}