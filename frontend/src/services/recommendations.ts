import { api } from './api'
import type { RecommendationResult } from '@/types'

export const recommendationsService = {
  getForMember: (memberId: number) =>
    api.get<RecommendationResult>(`/members/${memberId}/recommendations`),
}
