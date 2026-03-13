import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Attach auth token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Properties ─────────────────────────────────────────────────────────────
export const getProperties     = (params = {}) => API.get('/properties', { params })
export const getProperty       = (id)          => API.get(`/properties/${id}`)
export const getPropertyContact = (id)         => API.get(`/properties/${id}/contact`)
export const getPropertyTypes  = ()            => API.get('/properties/types')
export const createListing     = (data)        => API.post('/properties', data)

// ── AI Recommendations ─────────────────────────────────────────────────────
export const getRecommendations = (data) => API.post('/recommend', data)

// ── Compare (AI vs Simple Query) ────────────────────────────────────────────
export const compareRecommendations = (data) => API.post('/compare', data)

// ── Auth ───────────────────────────────────────────────────────────────────
export const register = (data) => API.post('/register', data)
export const login    = (data) => API.post('/login', data)
export const getMe    = ()     => API.get('/me')

// ── Favourites ─────────────────────────────────────────────────────────────
export const getFavorites    = ()             => API.get('/favorites')
export const addFavorite     = (property_id)  => API.post('/favorites', { property_id })
export const removeFavorite  = (property_id)  => API.delete(`/favorites/${property_id}`)

// ── Admin / Dashboard ──────────────────────────────────────────────────────
export const getDashboardStats   = ()           => API.get('/dashboard/stats')
export const getExposureData     = ()           => API.get('/dashboard/exposure')
export const getPerformanceSummary = ()         => API.get('/dashboard/performance')
export const getJourneySummary   = ()           => API.get('/journey/summary')
export const getMyJourneySummary = ()           => API.get('/journey/me')
export const getFigureUrl        = (filename)   => `${API_BASE_URL}/dashboard/figures/${filename}`

// ── Usability ──────────────────────────────────────────────────────────────
export const logUsability       = (data) => API.post('/usability/log', data)
export const getUsabilitySummary = ()    => API.get('/usability/summary')

export default API
