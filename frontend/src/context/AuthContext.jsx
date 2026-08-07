import { createContext, useContext, useState } from 'react'
import { api, TOKEN_KEY } from '../utils/api'

const AuthContext = createContext(null)

// Aturan username: huruf kecil, angka, underscore, min 4, max 20, tidak boleh dimulai angka.
// Harus sama persis dengan controllers/validators.js di sisi server.
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
      } catch {
        return null
      }
    }
    return null
  })

  const simpanSesi = (userData, token) => {
    try {
      sessionStorage.setItem('uks_user', JSON.stringify(userData))
      if (token) sessionStorage.setItem(TOKEN_KEY, token)
    } catch (e) {
      console.error('Gagal menyimpan sesi:', e)
    }
  }

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData }
      return updated
    })
    // Efek samping dikeluarkan dari updater setState — updater harus murni.
    try {
      const saved = sessionStorage.getItem('uks_user')
      const prev = saved ? JSON.parse(saved) : {}
      sessionStorage.setItem('uks_user', JSON.stringify({ ...prev, ...userData }))
    } catch (e) {
      console.error('Gagal memperbarui sesi:', e)
    }
  }

  const login = async (username, password) => {
    if (!username || !password) {
      throw new Error('Username dan Password wajib diisi!')
    }

    const res = await api.post('/auth/login', { username, password })

    if (res && res.success && res.data) {
      setUser(res.data)
      simpanSesi(res.data, res.token)
      return res.data
    } else {
      throw new Error(res.message || 'Username atau Password yang Anda masukkan salah!')
    }
  }

  const logout = () => {
    setUser(null)
    try {
      // Bersihkan SEMUA jejak sesi. Di komputer bersama, sisa data kesehatan
      // siswa masih terbaca lewat DevTools kalau tidak dihapus.
      sessionStorage.removeItem('uks_user')
      sessionStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('uks_user')
      localStorage.removeItem('uks_siswa_data_clean')
      localStorage.removeItem('uks_kunjungan_data_clean')
    } catch (e) {
      console.error('Gagal membersihkan sesi:', e)
    }
  }

  return (
    <AuthContext.Provider value={{ user, updateUser, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}