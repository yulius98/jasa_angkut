import { NextResponse, type NextRequest } from "next/server"

import { clearAuthCookies } from "@/lib/auth"
import { BACKEND_URL, REFRESH_TOKEN_COOKIE } from "@/lib/config"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value

  if (refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      })
    } catch {
      // cookie lokal tetap dibersihkan meskipun backend tidak terjangkau
    }
  }

  const response = NextResponse.json({ ok: true })
  clearAuthCookies(response)
  return response
}