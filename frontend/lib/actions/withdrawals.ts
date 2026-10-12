"use server"

import { cookies } from "next/headers"

import { BACKEND_URL } from "@/lib/config"
import type { WithdrawalProvider } from "@/types"

export interface CreateWithdrawalInput {
  beneficiaryName: string
  bankCode: string
  bankAccountNumber: string
  amount: number
  notes?: string
  provider?: WithdrawalProvider
}

async function parseError(res: Response, fallback: string): Promise<string> {
  let message = fallback
  try {
    const body = (await res.json()) as { message?: string | string[] }
    if (body?.message) {
      message = Array.isArray(body.message) ? body.message[0] : body.message
    }
  } catch {
    // ignore
  }
  return message
}

export async function createWithdrawal(
  input: CreateWithdrawalInput
): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}/admin/withdrawals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  if (res.ok) return

  throw new Error(await parseError(res, "Gagal membuat permintaan pencairan"))
}

export async function refreshWithdrawalStatus(id: string): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(
    `${BACKEND_URL}/admin/withdrawals/${id}/refresh-status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (res.ok) return

  throw new Error(await parseError(res, "Gagal menyegarkan status pencairan"))
}
