import { api } from './api'
import type { PriceListItem } from '@/types'

export const priceListService = {
  getAll: () => api.get<PriceListItem[]>('/price-list'),
}
