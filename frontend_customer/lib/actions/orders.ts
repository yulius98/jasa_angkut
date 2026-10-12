"use server"

import { revalidatePath } from "next/cache"

import { serverFetch } from "@/lib/api"
import { toErrorResult, type ActionResult } from "@/lib/actions/types"
import type { OrderDetail, VehicleType } from "@/types"

export interface CreateOrderInput {
  pickupAddress: string
  pickupLatitude: number
  pickupLongitude: number
  dropoffAddress: string
  dropoffLatitude: number
  dropoffLongitude: number
  vehicleType: VehicleType
  itemDescription?: string
  scheduledAt?: string
  promoCode?: string
}

export async function createOrderAction(
  input: CreateOrderInput
): Promise<ActionResult<OrderDetail>> {
  try {
    const order = await serverFetch<OrderDetail>(
      "/orders",
      { method: "POST", body: JSON.stringify(input) },
      { refreshOn401: true }
    )
    revalidatePath("/home")
    revalidatePath("/orders")
    return { ok: true, data: order }
  } catch (error) {
    return toErrorResult(error)
  }
}

export async function cancelOrderAction(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  try {
    await serverFetch(
      `/orders/${orderId}/cancel`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
      { refreshOn401: true }
    )
    revalidatePath("/home")
    revalidatePath("/orders")
    revalidatePath(`/orders/${orderId}`)
    return { ok: true, data: null }
  } catch (error) {
    return toErrorResult(error)
  }
}

export async function disputeOrderAction(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  try {
    await serverFetch(
      `/orders/${orderId}/dispute`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
      { refreshOn401: true }
    )
    revalidatePath("/orders")
    revalidatePath(`/orders/${orderId}`)
    return { ok: true, data: null }
  } catch (error) {
    return toErrorResult(error)
  }
}
