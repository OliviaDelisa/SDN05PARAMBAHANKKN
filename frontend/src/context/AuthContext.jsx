import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const DEFAULT_USER = {
  id: 1,
  nama_lengkap: 'Ibu Siti Rahmawati',
  email: 'siti.rahmawati@sdn05parambahan.id',
  nip: '198507152010012003',
  role: 'Petugas UKS Utama'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('uks_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return null
      }
    }
    return null
  })

  const login = (nipOrEmail, password) => {
    if (!nipOrEmail || !password) {
      throw new Error('NIP / NIS dan Password wajib diisi!')
    }

    const loggedUser = {
      ...DEFAULT_USER,
      nip: nipOrEmail.includes('@') ? DEFAULT_USER.nip : nipOrEmail,
      email: nipOrEmail.includes('@') ? nipOrEmail : DEFAULT_USER.email
    }

    setUser(loggedUser)
    localStorage.setItem('uks_user', JSON.stringify(loggedUser))
    return loggedUser
  }

  const register = (userData) => {
    const { nama_lengkap, nip, email, no_telepon, password } = userData

    if (!nama_lengkap || !nip || !email || !password) {
      throw new Error('Semua kolom wajib diisi!')
    }

    // Validasi domain email sekolah wajib @sdn05parambahan.id
    if (!email.toLowerCase().endsWith('@sdn05parambahan.id')) {
      throw new Error('Email harus menggunakan domain resmi sekolah (@sdn05parambahan.id)!')
    }

    const isDokterKecil = nip.length <= 10

    const newUser = {
      id: Date.now(),
      nama_lengkap,
      nip,
      email,
      no_telepon: no_telepon || '081234567890',
      role: isDokterKecil ? 'Dokter Kecil UKS' : 'Petugas UKS Pegawai'
    }

    setUser(newUser)
    localStorage.setItem('uks_user', JSON.stringify(newUser))
    return newUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('uks_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
