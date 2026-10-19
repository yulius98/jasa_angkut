import { NextResponse, type NextRequest } from "next/server"

import { isCustomerRole, safeNextPath } from "@/lib/auth"
import {
  ACCESS_TOKEN_COOKIE,
  BACKEND_URL,
  REFRESH_TOKEN_COOKIE,
  SESSION_MAX_AGE,
  USER_COOKIE,
} from "@/lib/config"

const protectedRoutes = ["/home", "/orders", "/chat", "/account"]
const authRoutes = ["/login", "/register"]

// Umur cookie access token setelah refresh di proxy. Sama angkanya dengan
// ACCESS_TOKEN_MAX_AGE di lib/api.ts.
const ACCESS_TOKEN_MAX_AGE_SECONDS = 840

function tokenCookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

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
 * Ada cookie sesi tapi bukan milik pelanggan (mis. sisa login aplikasi
 * mitra/admin yang berbagi cookie pada host yang sama).
 */
function isForeignSession(role: string | undefined): boolean {
  return role !== undefined && !isCustomerRole(role)
}

/**
 * Panggil POST /auth/refresh di backend menggunakan refresh token dari cookie.
 * Mengembalikan null ketika diblokir atau dinolkan (token refresh kedaluwarsa).
 */
async function refreshTokens(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      accessToken?: string
      refreshToken?: string
    }
    if (!data.accessToken || !data.refreshToken) return null
    return { accessToken: data.accessToken, refreshToken: data.refreshToken }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const { method } = request
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  const role = readRole(request)

  // Sesi non-pelanggan untuk request non-GET: JANGAN di-redirect. Server Action
  // (SERVER POST) tidak mengerti protokol redirect, tapi cukup menerima
  // respons 401 JSON yang jelas.
  if (method !== "GET" && isProtected(pathname) && isForeignSession(role)) {
    return new NextResponse(
      JSON.stringify({ message: "Sesi ini bukan akun pelanggan silakan login." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  // Access token kedaluwarsa tapi refresh token masih ada, dan ini request
  // non-GET (Server Action). Request seperti ini TIDAK BOLEH di-redirect ke
  // /api/auth/refresh:
  //   - 307 dipelihara by browser, jadi action POST terus ke route refresh,
  //     yang hanya punya handler GET; responsenya 405.
  //   - Server Action mengharuskan respons berformat protokol action; respons
  //     redirect/HTML apa pun membuat router menampilkan
  //     "unhandledRejection: An unexpected response was received from the
  //     server" (tidak bisa didekta di kode app).
  // Maka refresh dilakukan LANGSUNG di sini. Tokens baru disisipkan ke cookies
  // request (biar Server Action membaca token valid) dan oleskan ke cookies
  // respons (biar sesi browser ikut diperbarui). Server Action beserta hasil
  // pengembalian cookies berlanjut secara transparan.
  if (method !== "GET" && isProtected(pathname) && !accessToken && refreshToken) {
    const tokens = await refreshTokens(refreshToken)
    if (tokens) {
      request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken)
      request.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken)
      const response = NextResponse.next({ request })
      response.cookies.set(
        ACCESS_TOKEN_COOKIE,
        tokens.accessToken,
        tokenCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS)
      )
      response.cookies.set(
        REFRESH_TOKEN_COOKIE,
        tokens.refreshToken,
        tokenCookieOptions(SESSION_MAX_AGE)
      )
      return response
    }
    // refresh gagal: sesi sudah berakhir. 401 biar Server Action responsnya
    // bukan HTML-random (action akan menampilkan pesan error di UI).
    return new NextResponse(
      JSON.stringify({
        message: "Sesi telah berakhir. Silakan muat ulang halaman untuk login.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  // Sediakan URL asli untuk flow refresh token di Server Component.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", pathname)
  requestHeaders.set("x-search", search)
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  if (authRoutes.includes(pathname)) {
    // Tujuan setelah login/register (mis. kembali ke /orders/new yang tadi
    // diminta sebelum sempat login).
    const next = safeNextPath(request.nextUrl.searchParams.get("next"))
    // Sesi non-pelanggan JANGAN dilempar keluar dari halaman login. Jika tidak,
    // /login -> halaman terproteksi -> /login -> ... saling redirect tanpa
    // henti (ERR_TOO_MANY_REDIRECTS). Cukup tampilkan halaman login supaya user
    // bisa masuk dengan akun pelanggan.
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
    "/register",
    "/home/:path*",
    "/orders/:path*",
    "/chat/:path*",
    "/account/:path*",
  ],
}
