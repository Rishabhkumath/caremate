import { createContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'

export const AuthContext = createContext(null)

// Safely read cached user from localStorage
function getCachedUser() {
  try {
    const raw = localStorage.getItem('caremate_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// Handle all backend response shapes:
// { success, data: { token, user } }  ← your backend's shape
// { success, data: { id, name... } }  ← getMe shape
function parseUser(data) {
  const u = data?.data?.user || data?.data || data?.user || null
  if (!u || typeof u !== 'object') return null
  // Normalize: ensure both _id and id exist
  return { ...u, _id: u._id || u.id, id: u.id || u._id }
}

function parseToken(data) {
  return (
    data?.data?.token ||
    data?.token ||
    data?.data?.accessToken ||
    data?.accessToken ||
    null
  )
}

export function AuthProvider({ children }) {
  // Init from cache so page never flickers to login on refresh
  const [user,    setUser]    = useState(() => getCachedUser())
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('caremate_token')
    if (!token) { setLoading(false); return }

    try {
      const { data } = await authApi.getMe()
      const fresh = parseUser(data)
      if (fresh?._id) {
        setUser(fresh)
        localStorage.setItem('caremate_user', JSON.stringify(fresh))
      } else {
        // Unexpected shape but token valid — keep cached
        setUser(getCachedUser())
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        // Token truly invalid
        localStorage.removeItem('caremate_token')
        localStorage.removeItem('caremate_user')
        setUser(null)
      } else {
        // Network/server error — keep cached user (refresh still works offline)
        setUser(getCachedUser())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (credentials) => {
    setError(null)
    try {
      const { data } = await authApi.login(credentials)
      const token      = parseToken(data)
      const loggedInUser = parseUser(data)

      if (!token)        throw new Error('No token in response')
      if (!loggedInUser) throw new Error('No user data in response')

      localStorage.setItem('caremate_token', token)
      localStorage.setItem('caremate_user', JSON.stringify(loggedInUser))
      setUser(loggedInUser)
      return loggedInUser
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      setError(msg)
      throw err
    }
  }

  const googleLogin = async (credential) => {
    setError(null)
    try {
      const { data } = await authApi.googleLogin(credential)
      const token = parseToken(data)
      const loggedInUser = parseUser(data)

      if (!token) throw new Error('No token in response')
      if (!loggedInUser) throw new Error('No user data in response')

      localStorage.setItem('caremate_token', token)
      localStorage.setItem('caremate_user', JSON.stringify(loggedInUser))
      setUser(loggedInUser)
      return loggedInUser
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Google login failed'
      setError(msg)
      throw err
    }
  }

  const register = async (userData) => {
    setError(null)
    try {
      const { data } = await authApi.register(userData)
      const token        = parseToken(data)
      const registeredUser = parseUser(data)

      if (!token)          throw new Error('No token in response')
      if (!registeredUser) throw new Error('No user data in response')

      localStorage.setItem('caremate_token', token)
      localStorage.setItem('caremate_user', JSON.stringify(registeredUser))
      setUser(registeredUser)
      return registeredUser
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Registration failed'
      setError(msg)
      throw err
    }
  }

  const logout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    localStorage.removeItem('caremate_token')
    localStorage.removeItem('caremate_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, googleLogin, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
