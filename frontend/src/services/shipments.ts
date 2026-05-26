import { api } from './api'
import type { Shipment } from '@/types'

export const shipmentsService = {
  getAll: () => api.get<Shipment[]>('/shipments'),
  create: (s: Shipment) => api.post<Shipment>('/shipments', s),
  delete: (id: number) => api.delete(`/shipments/${id}`),
}
