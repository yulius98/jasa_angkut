import { NextRequest, NextResponse } from "next/server"

import { ApiError, serverFetch } from "@/lib/api"

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { message: "Data form tidak valid" },
      { status: 400 }
    )
  }

  try {
    const data = await serverFetch(
      "/partners",
      { method: "POST", body: formData },
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
