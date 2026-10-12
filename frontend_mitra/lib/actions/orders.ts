"use server"

import { revalidatePath } from "next/cache"

import { serverFetch } from "@/lib/api"
import { toErrorResult, type ActionResult } from "@/lib/actions/types"
import type { OrderDetail, OrderStatus, Partner } from "@/types"

function revalidateOrder(orderId: string) {
  revalidatePath("/home")
  revalidatePath("/jobs")
  revalidatePath("/orders")
  revalidatePath(`/orders/${orderId}`)
}

/** Nyalakan/matikan status online mitra. */
export async function setOnlineAction(
  isOnline: boolean
): Promise<ActionResult<Partner>> {
  try {
    const partner = await serverFetch<Partner>(
      "/partners/me/online",
      { method: "PATCH", body: JSON.stringify({ isOnline }) },
      { refreshOn401: true }
    )
    revalidatePath("/home")
    revalidatePath("/jobs")
    return { ok: true, data: partner }
  } catch (error) {
    return toErrorResult(error)
  }
}

/** Ambil order tersedia (partner harus APPROVED & online). */
export async function acceptOrderAction(
  orderId: string,
  vehicleId: string
): Promise<ActionResult<OrderDetail>> {
  try {
    const order = await serverFetch<OrderDetail>(
      `/orders/${orderId}/accept`,
      { method: "PATCH", body: JSON.stringify({ vehicleId }) },
      { refreshOn401: true }
    )
    revalidateOrder(orderId)
    return { ok: true, data: order }
  } catch (error) {
    return toErrorResult(error)
  }
}

/** Majukan status order ke tahap berikutnya. */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<ActionResult<OrderDetail>> {
  try {
    const order = await serverFetch<OrderDetail>(
      `/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, note: note || undefined }),
      },
      { refreshOn401: true }
    )
    revalidateOrder(orderId)
    return { ok: true, data: order }
  } catch (error) {
    return toErrorResult(error)
  }
}

export async function cancelOrderAction(
  orderId: string,
  reason: string
): Promise<ActionResult<OrderDetail>> {
  try {
    const order = await serverFetch<OrderDetail>(
      `/orders/${orderId}/cancel`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
      { refreshOn401: true }
    )
    revalidateOrder(orderId)
    return { ok: true, data: order }
  } catch (error) {
    return toErrorResult(error)
  }
}

export async function disputeOrderAction(
  orderId: string,
  reason: string
): Promise<ActionResult<OrderDetail>> {
  try {
    const order = await serverFetch<OrderDetail>(
      `/orders/${orderId}/dispute`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
      { refreshOn401: true }
    )
    revalidateOrder(orderId)
    return { ok: true, data: order }
  } catch (error) {
    return toErrorResult(error)
  }
}

