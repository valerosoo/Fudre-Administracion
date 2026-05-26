import { api } from './api'
import type { Member } from '@/types'

export const membersService = {
  getAll: () => api.get<Member[]>('/members'),
  create: (member: Member) => api.post<Member>('/members', member),
  update: (id: number, member: Member) => api.put<Member>(`/members/${id}`, member),
  delete: (id: number) => api.delete(`/members/${id}`),
}
