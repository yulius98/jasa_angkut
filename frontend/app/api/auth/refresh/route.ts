import { NextResponse, type NextRequest } from "next/server"

import {
  applyAuthCookies,
  clearAuthCookies,
  isAdminRole,
  parseSessionUser,
} from "@/lib/auth"
import { BACKEND_URL, REFRESH_TOKEN_COOKIE, USER_COOKIE } from "@/lib/config"

export const runtime = "nodejs"

function safeRedirect(value: string | null): string {
  if (
    value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("://")
  ) {
    return value
  }
  return "/dashboard"
}

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  const user = parseSessionUser(request.cookies.get(USER_COOKIE)?.value)
  const next = safeRedirect(request.nextUrl.searchParams.get("next"))

  const response = NextResponse.redirect(new URL(next, request.url))

  if (!refreshToken || !user || !isAdminRole(user.role)) {
    clearAuthCookies(response)
    return response
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    })
    if (!res.ok) {
      clearAuthCookies(response)
      return response
    }
    const data = (await res.json()) as {
      accessToken: string
      refreshToken: string
    }
    applyAuthCookies(response, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user,
    })
    return response
  } catch {
    clearAuthCookies(response)
    return response
  }
}