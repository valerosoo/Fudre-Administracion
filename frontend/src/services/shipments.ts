import { api } from './api'
import type { Shipment, ShipmentType } from '@/types'

export const shipmentsService = {
  getAll: () => api.get<Shipment[]>('/shipments'),
  getByMember: (memberId: number) => api.get<Shipment[]>(`/shipments/member/${memberId}`),
  getByType: (type: ShipmentType) => api.get<Shipment[]>(`/shipments/type/${type}`),
  create: (s: Shipment) => api.post<Shipment>('/shipments', s),
  confirm: (id: number) => api.post<Shipment>(`/shipments/${id}/confirm`, {}),
  cancel: (id: number) => api.post<void>(`/shipments/${id}/cancel`, {}),
  delete: (id: number) => api.delete(`/shipments/${id}`),
  generateProposals: (year: number, month: number) =>
    api.post<Shipment[]>(`/shipments/generate-proposals?year=${year}&month=${month}`, {}),
}
