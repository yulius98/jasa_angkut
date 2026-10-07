import { cookies } from "next/headers"

import { ACCESS_TOKEN_COOKIE, BACKEND_URL } from "@/lib/config"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function serverFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value

  const headers = new Headers(init?.headers)
  headers.set("Accept", "application/json")
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const url = `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers,
  })

  const contentType = res.headers.get("content-type") ?? ""
  const body = contentType.includes("application/json") ? await res.json() : null

  if (!res.ok) {
    const raw = body?.message ?? `Terjadi kesalahan (${res.status})`
    const message = Array.isArray(raw) ? raw.join(", ") : String(raw)
    throw new ApiError(res.status, message)
  }

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
}