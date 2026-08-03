import { createContext, useContext, useState } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext(null)

// Aturan username: huruf kecil, angka, underscore, min 4, max 20, tidak boleh dimulai angka
export function validateUsername(username) {
  if (!username) return 'Username wajib diisi!'
  if (username.length < 4) return 'Username minimal 4 karakter!'
  if (username.length > 20) return 'Username maksimal 20 karakter!'
  if (/^[0-9]/.test(username)) return 'Username tidak boleh dimulai dengan angka!'
  if (!/^[a-z0-9_]+$/.test(username)) return 'Username hanya boleh berisi huruf kecil, angka, dan underscore (_)!'
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('uks_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return null
      }
    }
    return null
  })

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData }
      sessionStorage.setItem('uks_user', JSON.stringify(updated))
      return updated
    })
  }

  const login = async (username, password) => {
    if (!username || !password) {
      throw new Error('Username dan Password wajib diisi!')
    }

    const res = await api.post('/auth/login', { username, password })

    if (res && res.success && res.data) {
      setUser(res.data)
      sessionStorage.setItem('uks_user', JSON.stringify(res.data))
      return res.data
    } else {
      throw new Error(res.message || 'Username/NIP atau Password yang Anda masukkan salah!')
    }
  }

  const register = async (userData) => {
    const { nama_lengkap, nip, username, no_telepon, password } = userData

    if (!nama_lengkap || !nip || !username || !password) {
      throw new Error('Semua kolom wajib diisi!')
    }

    const usernameError = validateUsername(username)
    if (usernameError) throw new Error(usernameError)

    const res = await api.post('/auth/register', userData)

    if (res && res.success && res.data) {
      setUser(res.data)
      sessionStorage.setItem('uks_user', JSON.stringify(res.data))
      return res.data
    } else {
      throw new Error(res.message || 'Pendaftaran akun gagal!')
    }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('uks_user')
    localStorage.removeItem('uks_user')
  }

  return (
    <AuthContext.Provider value={{ user, updateUser, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
