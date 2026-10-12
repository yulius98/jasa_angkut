"use server"

import { revalidatePath } from "next/cache"

import { serverFetch } from "@/lib/api"
import { toErrorResult, type ActionResult } from "@/lib/actions/types"
import type { ChatMessage, ConversationDetail } from "@/types"

export async function createSupportConversationAction(): Promise<
  ActionResult<ConversationDetail>
> {
  try {
    const conversation = await serverFetch<ConversationDetail>(
      "/chat/conversations",
      { method: "POST", body: JSON.stringify({ type: "SUPPORT" }) },
      { refreshOn401: true }
    )
    revalidatePath("/chat")
    return { ok: true, data: conversation }
  } catch (error) {
    return toErrorResult(error)
  }
}

export async function createOrderConversationAction(
  orderId: string
): Promise<ActionResult<ConversationDetail>> {
  try {
    const conversation = await serverFetch<ConversationDetail>(
      "/chat/conversations",
      { method: "POST", body: JSON.stringify({ type: "ORDER", orderId }) },
      { refreshOn401: true }
    )
    revalidatePath("/chat")
    return { ok: true, data: conversation }
  } catch (error) {
    return toErrorResult(error)
  }
}

export async function sendMessageAction(
  conversationId: string,
  body: string
): Promise<ActionResult<ChatMessage>> {
  try {
    const message = await serverFetch<ChatMessage>(
      `/chat/conversations/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify({ body }) },
      { refreshOn401: true }
    )
    revalidatePath(`/chat/${conversationId}`)
    revalidatePath("/chat")
    return { ok: true, data: message }
  } catch (error) {
    return toErrorResult(error)
  }
}

export async function markReadAction(
  conversationId: string
): Promise<ActionResult> {
  try {
    await serverFetch(
      `/chat/conversations/${conversationId}/read`,
      { method: "POST" },
      { refreshOn401: true }
    )
    revalidatePath("/chat")
    return { ok: true, data: null }
  } catch (error) {
    return toErrorResult(error)
  }
}
