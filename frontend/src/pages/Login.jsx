import { useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { Lock, User, Eye, EyeOff } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/common/Toast'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(username, password)
      toast.success('Berhasil masuk! Selamat bekerja.')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Login gagal, periksa username dan password!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white border border-slate-200 px-8 py-10 shadow-sm">

          {/* Brand Header */}
          <div className="text-center mb-9">
            <p className="text-[11px] font-bold text-emerald-600 tracking-[0.15em] uppercase mb-2">
              SDN 05 Prambahan
            </p>

            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Sistem Pendataan Kunjungan UKS
            </h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide py-2.5 rounded-lg transition mt-4"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}