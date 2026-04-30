import { createContext, useContext, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  // Si el token está expirado lo descartamos directamente al arrancar
  const user = (() => {
    if (!token) return null
    try {
      const decoded = jwtDecode(token)
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token')
        return null
      }
      return decoded
    } catch {
      localStorage.removeItem('token')
      return null
    }
  })()

  const saveToken = (newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, saveToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
