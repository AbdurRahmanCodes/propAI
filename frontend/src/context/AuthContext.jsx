import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, getMe } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getMe().then(r => setUser(r.data)).catch(() => {
        localStorage.removeItem('token')
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const res = await apiLogin({ username, password })
    localStorage.setItem('token', res.data.access_token)
    // Store role from token response immediately (faster than /me round-trip)
    const me = await getMe()
    // Merge role from login response in case /me is slow
    const userData = { ...me.data, role: res.data.role || me.data.role || 'tenant' }
    setUser(userData)
    return userData
  }

  const register = async (username, email, password, role = 'tenant') => {
    const res = await apiRegister({ username, email, password, role })
    localStorage.setItem('token', res.data.access_token)
    const me = await getMe()
    const userData = { ...me.data, role: res.data.role || me.data.role || role }
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const isLandlord = user?.role === 'landlord'
  const isAdmin = user?.role === 'admin' || user?.role === 'landlord'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isLandlord, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
