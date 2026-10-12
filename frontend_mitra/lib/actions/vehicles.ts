"use server"

import { revalidatePath } from "next/cache"

import { serverFetch } from "@/lib/api"
import { toErrorResult, type ActionResult } from "@/lib/actions/types"
import type { Vehicle } from "@/types"

/** Tambah kendaraan mitra (multipart: stnkPhoto & photo opsional). */
export async function createVehicleAction(
  formData: FormData
): Promise<ActionResult<Vehicle>> {
  try {
    const vehicle = await serverFetch<Vehicle>(
      "/vehicles",
      { method: "POST", body: formData },
      { refreshOn401: true }
    )
    revalidatePath("/vehicles")
    revalidatePath("/home")
    return { ok: true, data: vehicle }
  } catch (error) {
    return toErrorResult(error)
  }
}

/** Nonaktifkan (hapus lunak) kendaraan mitra. */
export async function deleteVehicleAction(
  vehicleId: string
): Promise<ActionResult> {
  try {
    await serverFetch(
      `/vehicles/${vehicleId}`,
      { method: "DELETE" },
      { refreshOn401: true }
    )
    revalidatePath("/vehicles")
    revalidatePath("/home")
    revalidatePath("/jobs")
    return { ok: true, data: null }
  } catch (error) {
    return toErrorResult(error)
  }
}
