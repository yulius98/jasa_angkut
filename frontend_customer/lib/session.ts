import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/config"
import { parseSessionUser } from "@/lib/auth"
import type { SessionUser } from "@/types"

export interface Session {
  accessToken: string
  refreshToken: string | null
  user: SessionUser | null
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value
  if (!accessToken) return null

  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value ?? null
  const user = parseSessionUser(store.get(USER_COOKIE)?.value)

  return { accessToken, refreshToken, user }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}
