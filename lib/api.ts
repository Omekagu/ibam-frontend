import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://10.0.1.19:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000
})

// ─── Attach access token from localStorage ────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Silent token refresh on 401 ─────────────────────────────
let isRefreshing = false
let waitQueue: Array<(token: string) => void> = []

function flushQueue (token: string) {
  waitQueue.forEach(cb => cb(token))
  waitQueue = []
}

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    const isAuthRoute = original.url?.includes('/auth/')
    if (error.response?.status !== 401 || original._retry || isAuthRoute) {
      return Promise.reject(error)
    }

    // Already refreshing — queue this request until done
    if (isRefreshing) {
      return new Promise(resolve => {
        waitQueue.push(token => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('No refresh token')

      const { data: body } = await axios.post(
        `${BASE_URL}/auth/refresh-token`,
        { refreshToken }
      )
      const data = body.data as { accessToken: string; refreshToken: string }

      localStorage.setItem('access_token', data.accessToken)
      localStorage.setItem('refresh_token', data.refreshToken)

      flushQueue(data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch {
      // Refresh failed — clear session and redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      waitQueue = []
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
