import { NextResponse, type NextRequest } from "next/server"

import { isPartnerRole, safeNextPath } from "@/lib/auth"
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/config"

const protectedRoutes = [
  "/home",
  "/jobs",
  "/orders",
  "/chat",
  "/account",
  "/vehicles",
]
const authRoutes = ["/login"]

function isProtected(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

/**
 * Role dari cookie `user`. `undefined` berarti cookie tidak ada / korup — saat
 * itu role tidak bisa dipastikan dan request dibiarkan lewat (validasi penuh
 * tetap dilakukan di Server Component / API).
 */
function readRole(request: NextRequest): string | undefined {
  const rawUser = request.cookies.get(USER_COOKIE)?.value
  if (!rawUser) return undefined
  try {
    const user = JSON.parse(rawUser) as { role?: string }
    return typeof user?.role === "string" ? user.role : undefined
  } catch {
    return undefined
  }
}

/**
 * Ada cookie sesi tapi bukan milik mitra (mis. sisa login aplikasi
 * pelanggan/admin yang berbagi cookie pada host yang sama).
 */
function isForeignSession(role: string | undefined): boolean {
  return role !== undefined && !isPartnerRole(role)
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  const role = readRole(request)

  // Sediakan URL asli untuk flow refresh token di Server Component.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", pathname)
  requestHeaders.set("x-search", search)
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  if (authRoutes.includes(pathname)) {
    // Tujuan setelah login (mis. kembali ke /orders yang tadi diminta
    // sebelum sempat login).
    const next = safeNextPath(request.nextUrl.searchParams.get("next"))
    // Sesi non-mitra JANGAN dilempar keluar dari halaman login. Jika tidak,
    // /login -> halaman terproteksi -> /login -> ... saling redirect tanpa
    // henti (ERR_TOO_MANY_REDIRECTS). Cukup tampilkan halaman login.
    if (isForeignSession(role)) {
      return response
    }
    if (accessToken) {
      return NextResponse.redirect(new URL(next, request.url))
    }
    if (refreshToken) {
      return NextResponse.redirect(
        new URL(`/api/auth/refresh?next=${encodeURIComponent(next)}`, request.url)
      )
    }
    return response
  }

  if (!isProtected(pathname)) {
    return response
  }

  const next = encodeURIComponent(pathname + search)
  if (!accessToken) {
    if (refreshToken) {
      return NextResponse.redirect(
        new URL(`/api/auth/refresh?next=${next}`, request.url)
      )
    }
    return NextResponse.redirect(new URL(`/login?next=${next}`, request.url))
  }

  if (isForeignSession(role)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/login",
    "/home/:path*",
    "/jobs/:path*",
    "/orders/:path*",
    "/chat/:path*",
    "/account/:path*",
    "/vehicles/:path*",
  ],
}
