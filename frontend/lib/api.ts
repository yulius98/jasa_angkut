import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  ACCESS_TOKEN_COOKIE,
  BACKEND_URL,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/config"

const ACCESS_TOKEN_MAX_AGE = 840

function tokenCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export interface ServerFetchOptions {
  /** Dipakai di Route Handler: pada 401/403 coba refresh token lalu ulangi request. */
  refreshOn401?: boolean
}

export async function refreshAccessToken(): Promise<{
  accessToken: string
  refreshToken: string
} | null> {
  const store = await cookies()
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value
  if (!refreshToken) return null
  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      accessToken: string
      refreshToken: string
    }
    return data
  } catch {
    return null
  }
}

export async function persistRefreshedTokens(
  store: Awaited<ReturnType<typeof cookies>>,
  tokens: { accessToken: string; refreshToken: string }
): Promise<void> {
  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, tokenCookieOptions(ACCESS_TOKEN_MAX_AGE))
  store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, tokenCookieOptions(ACCESS_TOKEN_MAX_AGE))
}

function getErrorMessage(status: number, body: unknown): string {
  const raw = (body as { message?: unknown })?.message ?? `Terjadi kesalahan (${status})`
  const message = Array.isArray(raw) ? raw.join(", ") : String(raw)
  return message
}

export async function serverFetch<T = unknown>(
  path: string,
  init?: RequestInit,
  opts: ServerFetchOptions = {}
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  const headers_ = new Headers(init?.headers)
  headers_.set("Accept", "application/json")
  if (init?.body && !headers_.has("Content-Type")) {
    headers_.set("Content-Type", "application/json")
  }
  if (token) {
    headers_.set("Authorization", `Bearer ${token}`)
  }

  const url = `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`

  let res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: headers_,
  })

  if ((res.status === 401 || res.status === 403) && opts.refreshOn401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      await persistRefreshedTokens(cookieStore, refreshed)
      headers_.set("Authorization", `Bearer ${refreshed.accessToken}`)
      res = await fetch(url, {
        cache: "no-store",
        ...init,
        headers: headers_,
      })
    }
    if (res.status === 401 || res.status === 403) {
      cookieStore.delete(ACCESS_TOKEN_COOKIE)
      cookieStore.delete(REFRESH_TOKEN_COOKIE)
      cookieStore.delete(USER_COOKIE)
      throw new ApiError(401, "Sesi telah berakhir. Silakan login kembali.")
    }
  }

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? ""
    const body = contentType.includes("application/json")
      ? await res.json()
      : null

    if (res.status === 401 || res.status === 403) {
      // Konteks Server Component: redirect ke flow refresh agar cookie diperbarui
      // dan request diulang dengan access token baru.
      const hs = await headers()
      const pathname = hs.get("x-pathname") ?? "/dashboard"
      const search = hs.get("x-search") ?? ""
      const next = encodeURIComponent(pathname + search)
      redirect(`/api/auth/refresh?next=${next}`)
    }

    throw new ApiError(res.status, getErrorMessage(res.status, body))
  }

  const contentType = res.headers.get("content-type") ?? ""
  const body = contentType.includes("application/json")
    ? await res.json()
    : null

  return body as T
}

export const api = {
  get<T>(path: string): Promise<T> {
    return serverFetch<T>(path)
  },
  post<T>(path: string, data?: unknown): Promise<T> {
    return serverFetch<T>(path, {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    })
  },
  patch<T>(path: string, data?: unknown): Promise<T> {
    return serverFetch<T>(path, {
      method: "PATCH",
      body: data === undefined ? undefined : JSON.stringify(data),
    })
  },
  put<T>(path: string, data?: unknown): Promise<T> {
    return serverFetch<T>(path, {
      method: "PUT",
      body: data === undefined ? undefined : JSON.stringify(data),
    })
  },
  delete<T>(path: string): Promise<T> {
    return serverFetch<T>(path, { method: "DELETE" })
  },
  proxy<T>(path: string, init?: RequestInit): Promise<T> {
    return serverFetch<T>(path, init, { refreshOn401: true })
  },
}