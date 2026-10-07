import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/id"

dayjs.extend(relativeTime)
dayjs.locale("id")

import {
  DisputeStatus,
  OrderStatus,
  PartnerStatus,
  PaymentMethod,
  PaymentStatus,
  PromoType,
  UserRole,
  VehicleType,
  WithdrawalStatus,
} from "@/types"

const DEFAULT_LOCALE = "id-ID"

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function formatRupiah(value: string | number | null | undefined): string {
  const n = toNumber(value)
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatNumber(value: string | number | null | undefined): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(toNumber(value))
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-"
  return dayjs(value).format("DD MMM YYYY")
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-"
  return dayjs(value).format("DD MMM YYYY, HH:mm")
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "-"
  return dayjs(value).fromNow()
}

export function formatDistance(value: string | number | null | undefined): string {
  return `${formatNumber(value)} km`
}

export function formatRatio(value: string | number | null | undefined): string {
  const base = toNumber(value) * 100
  const rounded = Math.round(base * 100) / 100
  return `${new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded)}%`
}

export function shortenId(id: string | null | undefined, chars = 8): string {
  if (!id) return "-"
  if (id.length <= chars * 2 + 1) return id
  return `${id.slice(0, chars)}…${id.slice(-4)}`
}

export interface StatusMeta {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline" | "ghost"
}

export const USER_ROLE_META: Record<UserRole, StatusMeta> = {
  CUSTOMER: { label: "Pelanggan", variant: "secondary" },
  PARTNER: { label: "Mitra", variant: "outline" },
  ADMIN: { label: "Admin", variant: "secondary" },
  SUPER_ADMIN: { label: "Super Admin", variant: "default" },
}

export const PARTNER_STATUS_META: Record<PartnerStatus, StatusMeta> = {
  PENDING: { label: "Menunggu Verifikasi", variant: "secondary" },
  APPROVED: { label: "Disetujui", variant: "default" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
  SUSPENDED: { label: "Ditangguhkan", variant: "destructive" },
}

export const VEHICLE_TYPE_META: Record<VehicleType, StatusMeta> = {
  MOTORCYCLE: { label: "Motor", variant: "secondary" },
  PICKUP: { label: "Pickup", variant: "secondary" },
  BOX_TRUCK: { label: "Box Truk", variant: "secondary" },
  LARGE_TRUCK: { label: "Truk Besar", variant: "secondary" },
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING: { label: "Menunggu", variant: "secondary" },
  CONFIRMED: { label: "Dikonfirmasi", variant: "outline" },
  DRIVER_ASSIGNED: { label: "Driver Ditugaskan", variant: "outline" },
  EN_ROUTE_TO_PICKUP: { label: "Menuju Pickup", variant: "outline" },
  ARRIVED_AT_PICKUP: { label: "Tiba di Pickup", variant: "outline" },
  LOADING: { label: "Memuat Barang", variant: "outline" },
  IN_TRANSIT: { label: "Dalam Perjalanan", variant: "default" },
  ARRIVED_AT_DROPOFF: { label: "Tiba di Tujuan", variant: "outline" },
  UNLOADING: { label: "Menurunkan Barang", variant: "outline" },
  COMPLETED: { label: "Selesai", variant: "default" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
  DISPUTED: { label: "Dispute", variant: "destructive" },
}

export const PAYMENT_METHOD_META: Record<PaymentMethod, StatusMeta> = {
  CASH: { label: "Tunai", variant: "secondary" },
  VIRTUAL_ACCOUNT: { label: "Virtual Account", variant: "secondary" },
  E_WALLET: { label: "E-Wallet", variant: "secondary" },
  CREDIT_CARD: { label: "Kartu Kredit", variant: "secondary" },
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  PENDING: { label: "Belum Dibayar", variant: "secondary" },
  PAID: { label: "Lunas", variant: "default" },
  FAILED: { label: "Gagal", variant: "destructive" },
  REFUNDED: { label: "Refund", variant: "outline" },
}

export const ORDER_STATUSES: OrderStatus[] = Object.keys(
  ORDER_STATUS_META
) as OrderStatus[]

export const PARTNER_STATUSES: PartnerStatus[] = Object.keys(
  PARTNER_STATUS_META
) as PartnerStatus[]

export const PAYMENT_METHODS: PaymentMethod[] = Object.keys(
  PAYMENT_METHOD_META
) as PaymentMethod[]

export const PAYMENT_STATUSES: PaymentStatus[] = Object.keys(
  PAYMENT_STATUS_META
) as PaymentStatus[]

export const PROMO_TYPE_META: Record<PromoType, StatusMeta> = {
  PERCENTAGE: { label: "Persentase", variant: "secondary" },
  FIXED_AMOUNT: { label: "Nominal", variant: "secondary" },
}

export const DISPUTE_STATUS_META: Record<DisputeStatus, StatusMeta> = {
  open: { label: "Terbuka", variant: "secondary" },
  resolved: { label: "Selesai", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
}

export const WITHDRAWAL_STATUS_META: Record<WithdrawalStatus, StatusMeta> = {
  pending: { label: "Menunggu", variant: "secondary" },
  submitted: { label: "Diajukan", variant: "default" },
  failed: { label: "Gagal", variant: "destructive" },
  success: { label: "Berhasil", variant: "default" },
}

export function withdrawalStatusMeta(status: string): StatusMeta {
  const key = status as WithdrawalStatus
  return WITHDRAWAL_STATUS_META[key] ?? { label: status, variant: "secondary" }
}

export function disputeStatusMeta(status: string): StatusMeta {
  const key = status as DisputeStatus
  return DISPUTE_STATUS_META[key] ?? { label: status, variant: "secondary" }
}

export { dayjs }