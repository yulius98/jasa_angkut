"use server"

import { cookies } from "next/headers"

import { BACKEND_URL } from "@/lib/config"
import type { PaymentProvider } from "@/types"

async function readPaymentGateway(): Promise<PaymentProvider> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}/payments/settings`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Gagal memuat pengaturan gateway pembayaran")
  }

  const data = (await res.json()) as { paymentGateway: PaymentProvider }
  return data.paymentGateway
}

export async function getPaymentGatewaySetting(): Promise<PaymentProvider> {
  return readPaymentGateway()
}

export async function updatePaymentGatewaySetting(
  gateway: PaymentProvider
): Promise<PaymentProvider> {
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
    body: JSON.stringify({ paymentGateway: gateway }),
  })

  if (!res.ok) {
    let message = "Gagal memperbarui pengaturan gateway"
    try {
      const data = (await res.json()) as { message?: string | string[] }
      if (data?.message) {
        message = Array.isArray(data.message) ? data.message[0] : data.message
      }
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const data = (await res.json()) as { paymentGateway: PaymentProvider }
  return data.paymentGateway
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

  let message = "Gagal memperbarui pembayaran"
  try {
    const data = (await res.json()) as { message?: string | string[] }
    if (data?.message) {
      message = Array.isArray(data.message) ? data.message[0] : data.message
    }
  } catch {
    // ignore
  }
  throw new Error(message)
}
