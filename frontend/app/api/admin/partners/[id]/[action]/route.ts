import { NextRequest, NextResponse } from "next/server"

import { ApiError, serverFetch } from "@/lib/api"

const ACTIONS = ["approve", "reject", "suspend"] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id, action } = await params
  if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) {
    return NextResponse.json({ message: "Aksi tidak valid" }, { status: 400 })
  }

  let body: unknown
  if (action === "reject" || action === "suspend") {
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { message: "Alasan wajib diisi" },
        { status: 400 }
      )
    }
  }

  try {
    const data = await serverFetch(
      `/partners/${id}/${action}`,
      {
        method: "PATCH",
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      { refreshOn401: true }
    )
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status })
    }
    throw err
  }
}