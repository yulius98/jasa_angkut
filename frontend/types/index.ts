export const UserRole = {
  CUSTOMER: "CUSTOMER",
  PARTNER: "PARTNER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const PartnerStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const
export type PartnerStatus = (typeof PartnerStatus)[keyof typeof PartnerStatus]

export const VehicleType = {
  MOTORCYCLE: "MOTORCYCLE",
  PICKUP: "PICKUP",
  BOX_TRUCK: "BOX_TRUCK",
  LARGE_TRUCK: "LARGE_TRUCK",
} as const
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType]

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  DRIVER_ASSIGNED: "DRIVER_ASSIGNED",
  EN_ROUTE_TO_PICKUP: "EN_ROUTE_TO_PICKUP",
  ARRIVED_AT_PICKUP: "ARRIVED_AT_PICKUP",
  LOADING: "LOADING",
  IN_TRANSIT: "IN_TRANSIT",
  ARRIVED_AT_DROPOFF: "ARRIVED_AT_DROPOFF",
  UNLOADING: "UNLOADING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  DISPUTED: "DISPUTED",
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const PaymentMethod = {
  CASH: "CASH",
  VIRTUAL_ACCOUNT: "VIRTUAL_ACCOUNT",
  E_WALLET: "E_WALLET",
  CREDIT_CARD: "CREDIT_CARD",
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const PromoType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const
export type PromoType = (typeof PromoType)[keyof typeof PromoType]

export const DisputeStatus = {
  OPEN: "open",
  RESOLVED: "resolved",
  REJECTED: "rejected",
} as const
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus]

export const WithdrawalStatus = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  FAILED: "failed",
  SUCCESS: "success",
} as const
export type WithdrawalStatus = (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus]

export const WithdrawalProvider = {
  IRIS: "IRIS",
  XENDIT: "XENDIT",
} as const
export type WithdrawalProvider = (typeof WithdrawalProvider)[keyof typeof WithdrawalProvider]

export interface Paginated<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages?: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export type PartnerDocType = "ktp" | "sim"
export type VehicleFileKind = "stnk" | "photo"

export interface Partner {
  id: string
  userId: string
  ktpNumber: string
  simNumber: string
  status: PartnerStatus
  isOnline: boolean
  currentLatitude: string | null
  currentLongitude: string | null
  rating: string
  totalTrips: number
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  user?: User | null
  vehicles?: Vehicle[]
  _count?: { vehicles?: number; orders?: number }
}

export type PartnerListItem = Partner & {
  user: User
  _count: { vehicles: number }
}

export type PartnerDetail = Partner & {
  user: User
  vehicles: Vehicle[]
}

export interface Vehicle {
  id: string
  partnerId: string
  type: VehicleType
  plateNumber: string
  brand: string
  model: string
  maxWeightKg: string
  maxVolumeM3: string
  isActive: boolean
  createdAt: string
}

export interface PricingZone {
  id: string
  name: string
  baseFare: string
  perKmRate: string
  vehicleType: VehicleType
  minDistance: string
  isActive: boolean
  createdAt: string
}

export interface PromoCode {
  id: string
  code: string
  type: PromoType
  value: string
  maxDiscount: string | null
  minOrderValue: string | null
  usageLimit: number | null
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  createdAt: string
  _count?: { orders?: number }
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  partnerId: string | null
  vehicleId: string | null
  promoCodeId: string | null
  pickupAddress: string
  pickupLatitude: string
  pickupLongitude: string
  dropoffAddress: string
  dropoffLatitude: string
  dropoffLongitude: string
  distanceKm: string
  vehicleType: VehicleType
  itemDescription: string | null
  scheduledAt: string | null
  estimatedPrice: string
  negotiatedPrice: string | null
  finalPrice: string | null
  discountAmount: string
  status: OrderStatus
  cancelReason: string | null
  cancelledBy: string | null
  createdAt: string
  confirmedAt: string | null
  completedAt: string | null
  updatedAt: string
  customer?: CustomerProfile | null
  partner?: Partner | null
  vehicle?: Vehicle | null
  promoCode?: PromoCode | null
  payment?: Payment | null
  disputes?: Dispute[]
  rating?: Rating | null
}

export interface CustomerProfile {
  id: string
  userId: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
  user?: User | null
}

export interface OrderStatusHistory {
  id: string
  orderId: string
  status: OrderStatus
  note: string | null
  createdAt: string
}

export interface TrackingPoint {
  id: string
  orderId: string
  partnerId: string
  latitude: string
  longitude: string
  speedKmh: string | null
  recordedAt: string
}

export interface Rating {
  id: string
  orderId: string
  partnerId: string
  score: number
  comment: string | null
  createdAt: string
}

export interface Payment {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: string
  commissionRate: string
  commissionAmount: string
  partnerEarning: string
  gatewayProvider: string | null
  gatewayRefId: string | null
  paidAt: string | null
  createdAt: string
  order?: Order | null
}

export interface Payout {
  id: string
  partnerId: string
  amount: string
  periodFrom: string
  periodTo: string
  status: string
  processedAt: string | null
  createdAt: string
  partner?: Partner | null
}

export interface Dispute {
  id: string
  orderId: string
  raisedBy: string
  reason: string
  status: DisputeStatus
  resolution: string | null
  resolvedBy: string | null
  createdAt: string
  resolvedAt: string | null
  order?: Order | null
}

export interface Withdrawal {
  id: string
  referenceNo: string
  provider: string
  beneficiaryName: string
  bankCode: string
  bankAccountNumber: string
  amount: string
  status: string
  notes: string | null
  requestedBy: string
  submittedAt: string | null
  lastCheckedAt: string | null
  createdAt: string
  updatedAt: string
}

export type StatusFilter = "ALL" | string

export interface DashboardStats {
  orders: {
    total: number
    byStatus: Record<OrderStatus, number>
  }
  customers: {
    total: number
  }
  partners: {
    byStatus: Record<PartnerStatus, number>
  }
  revenue: {
    gmv: number
    totalCommission: number
  }
  disputes: {
    open: number
  }
}