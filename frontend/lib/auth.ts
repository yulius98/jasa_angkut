import type { NextResponse } from "next/server"

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_MAX_AGE,
  USER_COOKIE,
} from "@/lib/config"
import { UserRole, type SessionUser } from "@/types"

export const ACCESS_TOKEN_MAX_AGE = 840
export const REFRESH_TOKEN_MAX_AGE = SESSION_MAX_AGE

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

export function applyAuthCookies(
  response: NextResponse,
  tokens: {
    accessToken: string
    refreshToken: string
    user?: SessionUser | null
  }
) {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    cookieOptions(ACCESS_TOKEN_MAX_AGE)
  )
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    cookieOptions(REFRESH_TOKEN_MAX_AGE)
  )
  if (tokens.user) {
    response.cookies.set(
      USER_COOKIE,
      JSON.stringify(tokens.user),
      cookieOptions(REFRESH_TOKEN_MAX_AGE)
    )
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  response.cookies.delete(REFRESH_TOKEN_COOKIE)
  response.cookies.delete(USER_COOKIE)
}

export function isAdminRole(
  role: string | null | undefined
): role is UserRole {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
}

export function parseSessionUser(
  value: string | null | undefined
): SessionUser | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<SessionUser>
    if (
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.role === "string"
    ) {
      return parsed as SessionUser
    }
    return null
  } catch {
    return null
  }
}