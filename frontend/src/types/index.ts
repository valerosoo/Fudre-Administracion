export type Plan = 'BROTE' | 'BROTE_PLUS' | 'ENVERO' | 'ENVERO_PLUS'
export type WineCategory = 'BROTE' | 'ENVERO'
export type UploadStatus = 'PENDING' | 'UPLOADED' | 'OUT_OF_STOCK'

export interface Wine {
  id?: number
  name: string
  grape: string
  vintageYear?: number
  stockGondola: number
  stockCuartito: number
  stockTotal?: number
  referencePrice: number
  category?: WineCategory
  isClubEligible: boolean
  tiendanubeProductId?: string
  uploadStatus?: UploadStatus
}

export interface Member {
  id?: number
  name: string
  email: string
  phone?: string
  address?: string
  tasteProfile?: string
  notes?: string
}

export interface Membership {
  id?: number
  memberId: number
  memberName?: string
  plan: Plan
  startDate: string
  isActive: boolean
}

export interface ShipmentItem {
  id?: number
  wineId: number
  wineName?: string
  wineGrape?: string
  quantity: number
  unitPrice?: number
}

export interface Shipment {
  id?: number
  memberId: number
  memberName?: string
  memberEmail?: string
  membershipId: number
  shippedAt?: string
  shippingCost?: number
  notes?: string
  items?: ShipmentItem[]
}
