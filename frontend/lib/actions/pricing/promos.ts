"use server"

import { cookies } from "next/headers"

import { BACKEND_URL } from "@/lib/config"

export async function createPromo(data: Record<string, unknown>): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}/pricing/promos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (res.ok) return

  let message = "Gagal membuat kode promo"
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

export async function updatePromo(id: string, data: Record<string, unknown>): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}/pricing/promos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (res.ok) return

  let message = "Gagal memperbarui kode promo"
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
