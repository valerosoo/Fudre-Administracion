import { api } from './api'
import type { Wine } from '@/types'

export const winesService = {
  getAll: () => api.get<Wine[]>('/wines'),
  create: (wine: Wine) => api.post<Wine>('/wines', wine),
  update: (id: number, wine: Wine) => api.put<Wine>(`/wines/${id}`, wine),
  delete: (id: number) => api.delete(`/wines/${id}`),
}
