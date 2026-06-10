import { api } from './api'
import type { Member, MemberDetail, WineRating } from '@/types'

export const membersService = {
  getAll: () => api.get<Member[]>('/members'),
  getById: (id: number) => api.get<MemberDetail>(`/members/${id}`),
  create: (member: Member) => api.post<Member>('/members', member),
  update: (id: number, member: Member) => api.put<Member>(`/members/${id}`, member),
  delete: (id: number) => api.delete(`/members/${id}`),
  getWineRatings: (memberId: number) => api.get<WineRating[]>(`/members/${memberId}/wine-ratings`),
  submitWineRating: (memberId: number, rating: WineRating) =>
    api.post<WineRating>(`/members/${memberId}/wine-ratings`, rating),
  saveSurvey: (memberId: number, data: object) =>
    api.put<MemberDetail>(`/members/${memberId}/survey`, data),
}
