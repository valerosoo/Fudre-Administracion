import { api, setToken, clearToken, getToken } from './api'

export const authService = {
  isLoggedIn: (): boolean => getToken() !== null,
  login: async (email: string, password: string): Promise<void> => {
    const { token } = await api.post<{ token: string }>('/auth/login', { email, password })
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
