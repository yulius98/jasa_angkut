"use server"

import { revalidatePath } from "next/cache"

import { serverFetch } from "@/lib/api"
import { toErrorResult, type ActionResult } from "@/lib/actions/types"
import type { Rating } from "@/types"

export async function rateOrderAction(
  orderId: string,
  score: number,
  comment?: string
): Promise<ActionResult<Rating>> {
  try {
    const rating = await serverFetch<Rating>(
      "/ratings",
      {
        method: "POST",
        body: JSON.stringify({ orderId, score, comment: comment || undefined }),
      },
      { refreshOn401: true }
    )
    revalidatePath("/orders")
    revalidatePath(`/orders/${orderId}`)
    return { ok: true, data: rating }
  } catch (error) {
    return toErrorResult(error)
  }
}
