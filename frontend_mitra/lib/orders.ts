import {
  Bike,
  Box,
  Package,
  Truck,
  type LucideIcon,
} from "lucide-react"

import type { OrderStatus, VehicleType } from "@/types"

// Disalin dari Backend/src/orders/order-status-flow.ts supaya UI dan backend
// punya definisi yang sama soal order mana yang masih berjalan / boleh dibatalkan.
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "DRIVER_ASSIGNED",
  "EN_ROUTE_TO_PICKUP",
  "ARRIVED_AT_PICKUP",
  "LOADING",
  "IN_TRANSIT",
  "ARRIVED_AT_DROPOFF",
  "UNLOADING",
]

export const CANCELLABLE_STATUSES: OrderStatus[] = [
  "PENDING",
  "DRIVER_ASSIGNED",
  "EN_ROUTE_TO_PICKUP",
]

export const FINAL_ORDER_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
]

export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_ORDER_STATUSES.includes(status)
}

export function isFinalStatus(status: OrderStatus): boolean {
  return FINAL_ORDER_STATUSES.includes(status)
}

export function canCancel(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status)
}

export function canDispute(status: OrderStatus): boolean {
  return status !== "CANCELLED" && status !== "DISPUTED"
}

export function canRate(status: OrderStatus): boolean {
  return status === "COMPLETED"
}

export function isUnpaid(status: OrderStatus): boolean {
  return status !== "CANCELLED" && status !== "DISPUTED"
}

export interface TimelineStep {
  status: OrderStatus
  label: string
}

/** Tahapan utama perjalanan pesanan, dipakai untuk progress bar vertikal/horizontal. */
export const ORDER_PROGRESS_STEPS: TimelineStep[] = [
  { status: "PENDING", label: "Menunggu konfirmasi" },
  { status: "DRIVER_ASSIGNED", label: "Mitra ditugaskan" },
  { status: "EN_ROUTE_TO_PICKUP", label: "Menuju titik jemput" },
  { status: "ARRIVED_AT_PICKUP", label: "Tiba di titik jemput" },
  { status: "LOADING", label: "Memuat barang" },
  { status: "IN_TRANSIT", label: "Dalam perjalanan" },
  { status: "ARRIVED_AT_DROPOFF", label: "Tiba di tujuan" },
  { status: "UNLOADING", label: "Menurunkan barang" },
  { status: "COMPLETED", label: "Selesai" },
]

/** Indeks tahap yang sedang berjalan; -1 bila status final (batal/dispute). */
export function progressIndex(status: OrderStatus): number {
  return ORDER_PROGRESS_STEPS.findIndex((step) => step.status === status)
}

export const VEHICLE_ICON: Record<VehicleType, LucideIcon> = {
  MOTORCYCLE: Bike,
  PICKUP: Truck,
  BOX_TRUCK: Box,
  LARGE_TRUCK: Package,
}

// Disalin dari Backend/src/orders/order-status-flow.ts (ORDER_STATUS_FLOW):
// status berikutnya yang sah saat mitra memajukan sebuah order.
const PARTNER_STATUS_FLOW: Partial<Record<OrderStatus, OrderStatus>> = {
  DRIVER_ASSIGNED: "EN_ROUTE_TO_PICKUP",
  EN_ROUTE_TO_PICKUP: "ARRIVED_AT_PICKUP",
  ARRIVED_AT_PICKUP: "LOADING",
  LOADING: "IN_TRANSIT",
  IN_TRANSIT: "ARRIVED_AT_DROPOFF",
  ARRIVED_AT_DROPOFF: "UNLOADING",
  UNLOADING: "COMPLETED",
}

/** Status berikutnya yang bisa dituju mitra, atau null bila sudah final. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  return PARTNER_STATUS_FLOW[status] ?? null
}

/** Label tombol aksi untuk memajukan ke status berikutnya. */
export const NEXT_STATUS_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  DRIVER_ASSIGNED: "Menuju Lokasi Jemput",
  EN_ROUTE_TO_PICKUP: "Tiba di Titik Jemput",
  ARRIVED_AT_PICKUP: "Mulai Memuat Barang",
  LOADING: "Mulai Perjalanan",
  IN_TRANSIT: "Tiba di Tujuan",
  ARRIVED_AT_DROPOFF: "Mulai Menurunkan Barang",
  UNLOADING: "Selesaikan Pesanan",
}

/** Status order yang masih ditugaskan ke mitra & sedang berjalan. */
export function isPartnerActive(status: OrderStatus): boolean {
  return isActiveStatus(status)
}

