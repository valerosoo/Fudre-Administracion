import { api } from './api'
import type { Wine } from '@/types'

const BASE = '/api'

export const winesService = {
  getAll: () => api.get<Wine[]>('/wines'),
  create: (wine: Wine) => api.post<Wine>('/wines', wine),
  update: (id: number, wine: Wine) => api.put<Wine>(`/wines/${id}`, wine),
  delete: (id: number) => api.delete(`/wines/${id}`),
  uploadImage: async (id: number, file: File): Promise<Wine> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${BASE}/wines/${id}/image`, { method: 'POST', body: formData })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(text || `Error ${res.status}`)
    }
    return res.json()
  },
}
