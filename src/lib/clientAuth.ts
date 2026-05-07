// Client-side auth/storage helpers + token-aware fetch wrapper.
// Server-side code must NOT import this module.

const TOKEN_KEY = 'walletHubToken'
const USER_KEY = 'walletHubUser'

export interface AuthUser {
  id: string
  email: string
  name: string
  subscriptionStatus: 'active' | 'expired' | 'none'
  subscriptionExpiresAt: string | null
  setupCompleted: boolean
  relationshipStatus?: 'individual' | 'couple' | 'student' | 'family' | null
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthUser } catch { return null }
}

export function setUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(USER_KEY)
}

export function clearAuth(): void {
  setToken(null)
  setUser(null)
  // Clear cached app data + per-user UI flags so the next user doesn't see leftover state
  if (typeof window !== 'undefined') {
    const keys = [
      'sanhuu_transactions', 'sanhuu_budgets', 'sanhuu_goals',
      'sanhuu_profile', 'sanhuu_notifications', 'sanhuu_initialized',
      'sanhuu_family_members',
      'walletHubAccountType', 'walletHubSubscription',
      'walletHubAge', 'walletHubGender', 'walletHubInFamily',
    ]
    keys.forEach(k => window.localStorage.removeItem(k))
  }
}

export class HttpError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.status = status
    this.body = body
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  const text = await res.text()
  let body: unknown = null
  if (text) {
    try { body = JSON.parse(text) } catch { body = text }
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearAuth()
      // Avoid redirect loop on auth pages
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.replace('/login')
      }
    }
    const msg = (body && typeof body === 'object' && 'error' in (body as Record<string, unknown>))
      ? String((body as { error: unknown }).error)
      : `API ${path} → ${res.status}`
    throw new HttpError(res.status, body, msg)
  }

  return body as T
}
