import { api } from './api'
import type { Order, OrderItem, OrderStatus, OrderItemStatus } from '@/types'

export const ordersService = {
  getAll: () => api.get<Order[]>('/orders'),
  createFromPurchaseList: () => api.post<Order>('/orders', {}),
  createFromImport: (body: unknown) => api.post<Order>('/orders/import', body),
  updateStatus: (id: number, status: OrderStatus) =>
    api.put<Order>(`/orders/${id}/status`, { status }),
  addItem: (orderId: number, priceListItemId: number, quantity: number) =>
    api.post<Order>(`/orders/${orderId}/items`, { priceListItemId, quantity }),
  updateItemStatus: (orderId: number, itemId: number, itemStatus: OrderItemStatus) =>
    api.put<OrderItem>(`/orders/${orderId}/items/${itemId}/status`, { itemStatus }),
  updateItemQty: (orderId: number, itemId: number, quantity: number) =>
    api.put<OrderItem | null>(`/orders/${orderId}/items/${itemId}`, { quantity }),
  removeItem: (orderId: number, itemId: number) =>
    api.delete(`/orders/${orderId}/items/${itemId}`),
  deleteOrder: (id: number) => api.delete(`/orders/${id}`),
}
