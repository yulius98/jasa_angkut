import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/config"
import type { SessionUser, User } from "@/types"

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

  let user: SessionUser | null = null
  const rawUser = store.get(USER_COOKIE)?.value
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as User
    } catch {
      user = null
    }
  }

  return { accessToken, refreshToken, user }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}