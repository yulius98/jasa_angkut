"use server"

import { revalidatePath } from "next/cache"

import { serverFetch } from "@/lib/api"
import { toErrorResult, type ActionResult } from "@/lib/actions/types"
import type { Payment } from "@/types"

/** Mitra menandai pembayaran tunai (atau transfer manual) sudah diterima. */
export async function markPaidAction(
  paymentId: string,
  orderId: string
): Promise<ActionResult<Payment>> {
  try {
    const payment = await serverFetch<Payment>(
      `/payments/${paymentId}/mark-paid`,
      { method: "PATCH" },
      { refreshOn401: true }
    )
    revalidatePath(`/orders/${orderId}`)
    revalidatePath("/home")
    return { ok: true, data: payment }
  } catch (error) {
    return toErrorResult(error)
  }
}
