import { api } from './api'
import type { PurchaseListItem } from '@/types'

export const purchaseListService = {
  getAll: () => api.get<PurchaseListItem[]>('/purchase-list'),
  addItem: (priceListItemId: number, quantity: number) =>
    api.post<PurchaseListItem>('/purchase-list', { priceListItemId, quantity }),
  updateQuantity: (id: number, quantity: number) =>
    api.put<PurchaseListItem | null>(`/purchase-list/${id}`, { quantity }),
  removeItem: (id: number) => api.delete(`/purchase-list/${id}`),
  clearAll: () => api.delete('/purchase-list'),
}
