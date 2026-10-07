import { NextResponse, type NextRequest } from "next/server"

import { isAdminRole } from "@/lib/auth"
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/config"

const protectedRoutes = [
  "/dashboard",
  "/partners",
  "/orders",
  "/payments",
  "/pricing",
  "/disputes",
  "/withdrawals",
]

function isProtected(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value

  // Sediakan URL asli untuk flow refresh token di Server Component.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", pathname)
  requestHeaders.set("x-search", search)
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  if (pathname === "/login") {
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    if (refreshToken) {
      return NextResponse.redirect(
        new URL(
          `/api/auth/refresh?next=${encodeURIComponent("/dashboard")}`,
          request.url
        )
      )
    }
    return response
  }

  if (!isProtected(pathname)) {
    return response
  }

  if (!accessToken) {
    if (refreshToken) {
      const next = encodeURIComponent(pathname + search)
      return NextResponse.redirect(
        new URL(`/api/auth/refresh?next=${next}`, request.url)
      )
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const rawUser = request.cookies.get(USER_COOKIE)?.value
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser) as { role?: string }
      if (!isAdminRole(user?.role)) {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    } catch {
      // cookie korup: biarkan berlalu, validasi penuh dilakukan di RSC
    }
  }

  return response
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/partners/:path*",
    "/orders/:path*",
    "/payments/:path*",
    "/pricing/:path*",
    "/disputes/:path*",
    "/withdrawals/:path*",
  ],
}