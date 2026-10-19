import { NextResponse, type NextRequest } from "next/server"

import { BACKEND_URL } from "@/lib/config"

export const runtime = "nodejs"

/**
 * Proxy flow "Lupa password" (langkah 1). Backend yang memvalidasi email:
 * bila email tidak terdaftar responsnya 400 dengan pesan
 * "Email belum terdaftar" (ditampilkan langsung di modal); bila berhasil,
 * responsnya { sent, expiresHours, ... }.
 *
 * `appUrl` diambil dari origin request ini supaya link di email menunjuk
 * halaman /reset-password aplikasi yang benar (backend memvalidasi origin).
 */
export async function POST(request: NextRequest) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Request tidak valid" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ message: "Email wajib diisi" }, { status: 400 })
  }

  let res: Response
  try {
    res = await fetch(`${BACKEND_URL}/auth/password/forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, appUrl: request.nextUrl.origin }),
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
    sent?: boolean
    expiresHours?: number
    expiresAt?: string
    devResetUrl?: string
  } | null

  if (!res.ok) {
    const raw = data?.message ?? "Gagal mengirim email. Silakan coba lagi."
    const message = Array.isArray(raw) ? raw.join(", ") : String(raw)
    return NextResponse.json({ message }, { status: res.status })
  }

  return NextResponse.json({
    sent: data?.sent ?? true,
    expiresHours: data?.expiresHours ?? 24,
    expiresAt: data?.expiresAt,
    // Hanya di DEV (SMTP belum diatur): URL reset untuk pengujian manual.
    ...(data?.devResetUrl ? { devResetUrl: data.devResetUrl } : {}),
  })
}
