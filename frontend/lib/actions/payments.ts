"use server"

import { cookies } from "next/headers"

import { BACKEND_URL } from "@/lib/config"
import type { PaymentGatewayMode, PaymentGatewaySetting } from "@/types"

function parseMessage(data: unknown, fallback: string): string {
  const message = (data as { message?: string | string[] } | null)?.message
  if (!message) return fallback
  return Array.isArray(message) ? message[0] : message
}

export async function updatePaymentGatewaySetting(
  mode: PaymentGatewayMode
): Promise<PaymentGatewaySetting> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}/payments/settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ paymentGatewayMode: mode }),
  })

  if (!res.ok) {
    let data: unknown = null
    try {
      data = await res.json()
    } catch {
      // ignore
    }
    throw new Error(parseMessage(data, "Gagal memperbarui metode pembayaran"))
  }

  return (await res.json()) as PaymentGatewaySetting
}

export async function markCashPaid(paymentId: string): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}/payments/${paymentId}/mark-paid`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.ok) {
    return
  }

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    // ignore
  }
  throw new Error(parseMessage(data, "Gagal memperbarui pembayaran"))
}
