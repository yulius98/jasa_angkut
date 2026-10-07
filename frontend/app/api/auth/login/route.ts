import { NextResponse, type NextRequest } from "next/server"

import { applyAuthCookies, isAdminRole } from "@/lib/auth"
import { BACKEND_URL } from "@/lib/config"
import type { SessionUser } from "@/types"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { message: "Request tidak valid" },
      { status: 400 }
    )
  }

  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json(
      { message: "Email dan password wajib diisi" },
      { status: 400 }
    )
  }

  let res: Response
  try {
    res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { message: "Tidak dapat terhubung ke server." },
      { status: 502 }
    )
  }

  const data = (await res.json().catch(() => null)) as {
    user?: { id?: string; name?: string; email?: string; role?: string }
    accessToken?: string
    refreshToken?: string
    message?: unknown
  } | null

  if (!res.ok) {
    const raw = data?.message ?? "Email atau password salah"
    const message = Array.isArray(raw) ? raw.join(", ") : String(raw)
    return NextResponse.json({ message }, { status: res.status })
  }

  const user = data?.user
  if (
    !user?.id ||
    !data?.accessToken ||
    !data?.refreshToken ||
    !isAdminRole(user.role)
  ) {
    return NextResponse.json(
      { message: "Akses ditolak. Halaman ini khusus untuk admin." },
      { status: 403 }
    )
  }

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role as SessionUser["role"],
  }

  const response = NextResponse.json({ ok: true, user: sessionUser })
  applyAuthCookies(response, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: sessionUser,
  })
  return response
}