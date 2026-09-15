import { api, setToken, clearToken, getToken } from './api'

export const authService = {
  isLoggedIn: (): boolean => getToken() !== null,
  login: async (password: string): Promise<void> => {
    const { token } = await api.post<{ token: string }>('/auth/login', { password })
    setToken(token)
  },
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout', {})
    } finally {
      clearToken()
    }
  },
}
