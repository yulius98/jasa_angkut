import { NextResponse, type NextRequest } from "next/server"

import { BACKEND_URL } from "@/lib/config"

export const runtime = "nodejs"

/**
 * Proxy flow "Lupa password" (langkah akhir): mengganti password dengan token
 * dari link email. Backend memvalidasi token (belum dipakai, belum
 * kedaluwarsa), lalu mengubah password dan membereskan seluruh sesi lain.
 */
export async function POST(request: NextRequest) {
  let body: { token?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Request tidak valid" }, { status: 400 })
  }

  const { token, password } = body
  if (!token || !password) {
    return NextResponse.json(
      { message: "Token dan password baru wajib diisi" },
      { status: 400 }
    )
  }

  let res: Response
  try {
    res = await fetch(`${BACKEND_URL}/auth/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { message: "Tidak dapat terhubung ke server." },
      { status: 502 }
    )
  }

  const data = (await res.json().catch(() => null)) as {
    message?: unknown
  } | null

  if (!res.ok) {
    const raw = data?.message ?? "Gagal mengganti password. Silakan coba lagi."
    const message = Array.isArray(raw) ? raw.join(", ") : String(raw)
    return NextResponse.json({ message }, { status: res.status })
  }

  return NextResponse.json({ ok: true })
}
