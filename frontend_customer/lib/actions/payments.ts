"use server"

import { revalidatePath } from "next/cache"

import { ApiError, serverFetch } from "@/lib/api"
import { toErrorResult, type ActionResult } from "@/lib/actions/types"
import type {
  Payment,
  PaymentCreateResult,
  PaymentMethod,
} from "@/types"

export async function createPaymentAction(
  orderId: string,
  method: PaymentMethod
): Promise<ActionResult<PaymentCreateResult>> {
  try {
    const payment = await serverFetch<PaymentCreateResult>(
      "/payments",
      { method: "POST", body: JSON.stringify({ orderId, method }) },
      { refreshOn401: true }
    )
    revalidatePath(`/orders/${orderId}`)
    return { ok: true, data: payment }
  } catch (error) {
    return toErrorResult(error)
  }
}

/**
 * Ambil pembayaran sebuah order untuk dicek berkala dari halaman checkout
 * (mis. setelah Xendit Components melaporkan sesi selesai, webhook gateway
 * butuh sedikit waktu untuk menandai lunas di backend).
 *
 * `GET /payments/order/:id` membalas 404 kalau order belum punya pembayaran --
 * itu bukan error, cukup kembalikan null.
 */
export async function getOrderPaymentAction(
  orderId: string
): Promise<ActionResult<Payment | null>> {
  try {
    const payment = await serverFetch<Payment>(
      `/payments/order/${orderId}`,
      { method: "GET" },
      { refreshOn401: true }
    )
    return { ok: true, data: payment }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ok: true, data: null }
    }
    return toErrorResult(error)
  }
}
