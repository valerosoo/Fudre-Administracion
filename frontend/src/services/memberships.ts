import { api } from './api'
import type { Membership } from '@/types'

export const membershipsService = {
  getAll: () => api.get<Membership[]>('/memberships'),
  create: (m: Membership) => api.post<Membership>('/memberships', m),
  update: (id: number, m: Membership) => api.put<Membership>(`/memberships/${id}`, m),
  delete: (id: number) => api.delete(`/memberships/${id}`),
}
