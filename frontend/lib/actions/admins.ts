"use server"

import { cookies } from "next/headers"

import { ACCESS_TOKEN_COOKIE, BACKEND_URL } from "@/lib/config"
import type { UserRole } from "@/types"

export interface CreateAdminInput {
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
}

export interface UpdateAdminInput {
  name?: string
  phone?: string
  role?: UserRole
}

async function request(
  path: string,
  init: RequestInit,
  fallback: string
): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!token) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.")
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  })

  if (res.ok) return

  let message = fallback
  try {
    const body = (await res.json()) as { message?: string | string[] }
    if (body?.message) {
      message = Array.isArray(body.message) ? body.message[0] : body.message
    }
  } catch {
    // ignore
  }
  throw new Error(message)
}

export async function createAdmin(input: CreateAdminInput): Promise<void> {
  await request(
    "/admin/admins",
    { method: "POST", body: JSON.stringify(input) },
    "Gagal menambah admin"
  )
}

export async function updateAdmin(
  id: string,
  input: UpdateAdminInput
): Promise<void> {
  await request(
    `/admin/admins/${id}`,
    { method: "PATCH", body: JSON.stringify(input) },
    "Gagal memperbarui admin"
  )
}

export async function setAdminActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await request(
    `/admin/admins/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ isActive }) },
    "Gagal mengubah status admin"
  )
}

export async function resetAdminPassword(
  id: string,
  password: string
): Promise<void> {
  await request(
    `/admin/admins/${id}/password`,
    { method: "PATCH", body: JSON.stringify({ password }) },
    "Gagal mengatur ulang password"
  )
}

export async function deleteAdmin(id: string): Promise<void> {
  await request(
    `/admin/admins/${id}`,
    { method: "DELETE" },
    "Gagal menghapus admin"
  )
}
