"use server"

import { cookies } from "next/headers"

import { BACKEND_URL } from "@/lib/config"

/**
 * Minta backend menyusun ulang config publik (hapus cache in-memory). Setelah
 * ini, seluruh frontend yang membaca `GET /config/public` akan menerima nilai
 * terbaru. Dipakai tombol "Refresh konfigurasi" di halaman Konfigurasi admin.
 */
export async function revalidatePublicConfig(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}/config/public/revalidate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.ok) return

  let message = "Gagal memperbarui konfigurasi"
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
