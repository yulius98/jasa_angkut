import { ApiError } from "@/lib/api"

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; message: string }

export function toErrorResult(error: unknown): { ok: false; message: string } {
  if (error instanceof ApiError) {
    return { ok: false, message: error.message }
  }
  return { ok: false, message: "Terjadi kesalahan. Silakan coba lagi." }
}
