const BASE = import.meta.env.VITE_API_URL ?? '/api'

export function getToken(): string | null {
  return localStorage.getItem('fudre_token')
}

export function setToken(token: string): void {
  localStorage.setItem('fudre_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('fudre_token')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })
  if (res.status === 401) {
    clearToken()
    if (!path.startsWith('/auth/')) {
      window.location.href = '/login'
    }
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `Error ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}
