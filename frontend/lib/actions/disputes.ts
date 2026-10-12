"use server"

import { cookies } from "next/headers"

import { BACKEND_URL } from "@/lib/config"
import type { DisputeStatus } from "@/types"

export type ResolveOutcome = Exclude<DisputeStatus, "open">

export async function resolveDispute(
  id: string,
  input: { outcome: ResolveOutcome; resolution: string }
): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}/admin/disputes/${id}/resolve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  if (res.ok) return

  let message = "Gagal menyelesaikan dispute"
  try {
    const body = (await res.json()) as { message?: string | string[] }
    if (body?.message) {
      message = Array.isArray(body.message) ? body.message[0] : body.message
    }
  } catch {
    // ignore
  }
  throw new Error(message)
}
