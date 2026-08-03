import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Heart, Lock, User, Eye, EyeOff, LogIn, Sparkles, ShieldCheck } from 'lucide-react'
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
      await login(username.trim(), password)
      toast.success('Berhasil masuk! Selamat bekerja.')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Username/NIP atau Password yang Anda masukkan salah!')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = () => {
    setUsername('siti_rahmawati')
    setPassword('admin')
  }

  return (
    <div className="min-h-screen w-full bg-[#0B132B] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md rounded-3xl bg-slate-900/80 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-2">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Heart className="w-8 h-8 text-emerald-400 fill-emerald-400/20" strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-extrabold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              SDN 05 Parambahan
            </span>
            <h1 className="text-2xl font-extrabold font-display text-white tracking-tight mt-2">
              UKS Digital
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sistem Manajemen Buku Kunjungan UKS Sekolah Dasar
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Username atau NIP</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Masukkan username atau NIP..."
              className="
                w-full px-4 py-3 rounded-xl border border-slate-800
                bg-slate-950 text-white font-mono text-sm
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                transition-all duration-200
              "
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Kata Sandi / Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="
                  w-full pl-4 pr-10 py-3 rounded-xl border border-slate-800
                  bg-slate-950 text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                  transition-all duration-200
                "
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400
              text-white font-extrabold text-sm uppercase tracking-wide
              shadow-xl shadow-emerald-950/50 transition-all duration-200 cursor-pointer border border-emerald-400/30
              flex items-center justify-center gap-2 mt-2
            "
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Memproses...' : 'Masuk ke Aplikasi'}</span>
          </button>
        </form>

        {/* Demo Helper & Register Link */}
        <div className="pt-4 border-t border-slate-800 text-center space-y-3">
          <div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="
                px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800
                text-emerald-400 font-mono text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer
              "
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Isi Otomatis Akun Demo</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Belum memiliki akun?{' '}
            <Link to="/register" className="text-emerald-400 font-bold hover:underline">
              Daftar di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
