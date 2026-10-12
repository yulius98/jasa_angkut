import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

import { isCustomerRole, parseSessionUser } from "@/lib/auth"
import { persistRefreshedTokens, refreshAccessToken } from "@/lib/api"
import {
  ACCESS_TOKEN_COOKIE,
  BACKEND_URL,
  USER_COOKIE,
} from "@/lib/config"
import type { ChatMessage, Paginated } from "@/types"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MESSAGE_LIMIT = 100

async function fetchMessages(
  conversationId: string,
  token: string | undefined
): Promise<ChatMessage[] | null> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(
    `${BACKEND_URL}/chat/conversations/${conversationId}/messages?limit=${MESSAGE_LIMIT}`,
    { cache: "no-store", headers }
  )
  if (!res.ok) return null
  const body = (await res.json()) as Paginated<ChatMessage>
  return body.data
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const store = await cookies()
  const user = parseSessionUser(store.get(USER_COOKIE)?.value)
  if (!user || !isCustomerRole(user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { conversationId } = await params
  if (!UUID_RE.test(conversationId)) {
    return NextResponse.json(
      { message: "Percakapan tidak valid" },
      { status: 400 }
    )
  }

  let token = store.get(ACCESS_TOKEN_COOKIE)?.value
  let messages = await fetchMessages(conversationId, token)

  if (!messages && token) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      await persistRefreshedTokens(store, refreshed)
      token = refreshed.accessToken
      messages = await fetchMessages(conversationId, token)
    }
  }

  if (!messages) {
    return NextResponse.json(
      { message: "Tidak dapat memuat pesan" },
      { status: 502 }
    )
  }

  return NextResponse.json(
    { messages },
    { headers: { "Cache-Control": "private, no-store" } }
  )
}
