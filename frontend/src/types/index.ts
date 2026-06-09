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
  imageUrl?: string
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

export interface Distributor {
  id?: number
  name: string
  phone?: string
  email?: string
}

export interface PriceListItem {
  id?: number
  distributorId: number
  distributorName: string
  distributorPhone?: string
  distributorEmail?: string
  name: string
  grape?: string
  vintageYear?: number
  purchasePrice: number
  imageUrl?: string
  updatedAt?: string
}

export interface PurchaseListItem {
  id?: number
  priceListItemId: number
  name: string
  grape?: string
  vintageYear?: number
  purchasePrice: number
  imageUrl?: string
  distributorId: number
  distributorName: string
  distributorPhone?: string
  distributorEmail?: string
  quantity: number
  addedAt?: string
}

export type OrderStatus = 'PENDING' | 'ORDERED' | 'DELIVERED' | 'CANCELLED'

export type OrderItemStatus = 'ORDERED' | 'NOT_ORDERED' | 'CANCELLED_BY_DISTRIBUTOR'

export interface OrderItem {
  id?: number
  distributorName: string
  distributorPhone?: string
  distributorEmail?: string
  name: string
  grape?: string
  vintageYear?: number
  purchasePrice: number
  quantity: number
  subtotal?: number
  itemStatus?: OrderItemStatus
}

export interface Order {
  id?: number
  orderDate: string
  deliveredAt?: string
  status: OrderStatus
  notes?: string
  createdAt?: string
  items?: OrderItem[]
  totalItems?: number
  totalAmount?: number
}
