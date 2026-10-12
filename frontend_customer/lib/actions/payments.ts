"use server"

import { revalidatePath } from "next/cache"

import { serverFetch } from "@/lib/api"
import { toErrorResult, type ActionResult } from "@/lib/actions/types"
import type { PaymentCreateResult, PaymentMethod } from "@/types"

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
