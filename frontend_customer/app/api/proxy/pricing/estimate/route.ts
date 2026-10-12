import { NextResponse, type NextRequest } from "next/server"

import { BACKEND_URL } from "@/lib/config"

export const runtime = "nodejs"

const FIELDS = [
  "pickupLatitude",
  "pickupLongitude",
  "dropoffLatitude",
  "dropoffLongitude",
  "vehicleType",
  "promoCode",
] as const

// Endpoint publik di backend; diteruskan lewat server agar NEXT_PUBLIC tidak
// membocorkan URL internal dan CORS cukup satu origin.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ message: "Request tidak valid" }, { status: 400 })
  }

  const payload: Record<string, unknown> = {}
  for (const field of FIELDS) {
    if (body[field] !== undefined && body[field] !== "") {
      payload[field] = body[field]
    }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/pricing/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const raw = (data as { message?: unknown })?.message ?? "Estimasi gagal"
      const message = Array.isArray(raw) ? raw.join(", ") : String(raw)
      return NextResponse.json({ message }, { status: res.status })
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { message: "Tidak dapat menghubungi server." },
      { status: 502 }
    )
  }
}
