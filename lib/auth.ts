import api from './api'

export interface LoginPayload {
  email?: string
  phone?: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: 'patient' | 'doctor'
  phone?: string
  dateOfBirth?: string
  specialization?: string
  licenseNumber?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    _id: string
    name: string
    email: string
    role: string
    avatar?: string
    isVerified: boolean
  }
}

function persist (data: AuthResponse) {
  localStorage.setItem('access_token', data.accessToken)
  localStorage.setItem('refresh_token', data.refreshToken)
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
}

export async function login (payload: LoginPayload): Promise<AuthResponse> {
  // Clear any existing session before establishing a new one so two accounts
  // can never coexist in the same browser storage.
  const existing = localStorage.getItem('access_token')
  if (existing) {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
  const res = await api.post('/auth/login', payload)
  const data: AuthResponse = res.data.data
  persist(data)
  return data
}

export async function register (payload: RegisterPayload): Promise<AuthResponse> {
  const res = await api.post('/auth/register', payload)
  const data: AuthResponse = res.data.data
  persist(data)
  return data
}

export async function logout () {
  try {
    await api.post('/auth/logout')
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}

export function getStoredUser (): AuthResponse['user'] | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  if (!raw || raw === 'undefined' || raw === 'null') return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export function isLoggedIn (): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('access_token')
}

export function updateStoredUser (updates: Partial<AuthResponse['user']>): void {
  if (typeof window === 'undefined') return
  const user = getStoredUser()
  if (!user) return
  localStorage.setItem('user', JSON.stringify({ ...user, ...updates }))
}

export async function sendEmailOTP (email: string): Promise<void> {
  await api.post('/auth/send-email-otp', { email })
}

export async function verifyEmailOTP (email: string, otp: string): Promise<void> {
  await api.post('/auth/verify-email-otp', { email, otp })
}
