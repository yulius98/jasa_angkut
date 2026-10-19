"use server"

import { cookies } from "next/headers"

import { BACKEND_URL } from "@/lib/config"

interface PasswordResetSettings {
  ttlHours: number
  mailConfigured: boolean
}

function parseMessage(data: unknown, fallback: string): string {
  const message = (data as { message?: string | string[] } | null)?.message
  if (!message) return fallback
  return Array.isArray(message) ? message[0] : message
}

export async function getPasswordResetSettings(): Promise<PasswordResetSettings> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }
  const res = await fetch(`${BACKEND_URL}/auth/password/settings`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error("Gagal memuat pengaturan lupa password")
  }
  return (await res.json()) as PasswordResetSettings
}

/** Simpan masa berlaku (jam) link "lupa password" -- dipakai menu Konfigurasi. */
export async function updatePasswordResetSettings(
  ttlHours: number
): Promise<PasswordResetSettings> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}/auth/password/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ttlHours: Math.round(ttlHours) }),
  })

  if (!res.ok) {
    let data: unknown = null
    try {
      data = await res.json()
    } catch {
      // abaikan
    }
    throw new Error(parseMessage(data, "Gagal menyimpan pengaturan lupa password"))
  }

  return (await res.json()) as PasswordResetSettings
}
