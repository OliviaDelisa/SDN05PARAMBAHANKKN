import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Heart, Lock, User, AtSign, Phone, Shield, Eye, EyeOff, UserPlus, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth, validateUsername } from '../context/AuthContext'
import { useToast } from '../components/common/Toast'

// Aturan username yang akan ditampilkan di UI
const USERNAME_RULES = [
  { label: 'Minimal 4 karakter, maksimal 20 karakter', check: (v) => v.length >= 4 && v.length <= 20 },
  { label: 'Huruf kecil semua (a-z)', check: (v) => /^[a-z]/.test(v) && !/[A-Z]/.test(v) },
  { label: 'Tidak boleh dimulai dengan angka', check: (v) => v.length > 0 && !/^[0-9]/.test(v) },
  { label: 'Hanya huruf kecil, angka, dan underscore (_)', check: (v) => /^[a-z0-9_]+$/.test(v) },
]

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const toast = useToast()

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nip: '',
    username: '',
    no_telepon: '',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [usernameActive, setUsernameActive] = useState(false)

  const handleChange = (field, value) => {
    if (field === 'username') {
      // Auto-lowercase dan hapus karakter tidak valid secara langsung
      value = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    }
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const usernameError = validateUsername(formData.username)
    if (usernameError) {
      toast.error(usernameError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok!')
      return
    }

    setLoading(true)

    try {
      await register(formData)
      toast.success('Pendaftaran akun berhasil! Selamat datang di UKS Digital.')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Pendaftaran akun gagal!')
    } finally {
      setLoading(false)
    }
  }

  const isUsernameValid = !validateUsername(formData.username)

  return (
    <div className="min-h-screen w-full bg-[#0B132B] flex items-center justify-center p-4 py-8 relative overflow-hidden">
      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-lg rounded-3xl bg-slate-900/80 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-1">
            <div className="w-full h-full bg-slate-950 rounded-[12px] flex items-center justify-center">
              <Heart className="w-7 h-7 text-emerald-400 fill-emerald-400/20" strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-extrabold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              SDN 05 Parambahan
            </span>
            <h1 className="text-2xl font-extrabold font-display text-white tracking-tight mt-1.5">
              Daftar Akun Baru
            </h1>
            <p className="text-xs text-slate-400">
              Untuk Pegawai UKS dan Dokter Kecil SDN 05 Parambahan
            </p>
          </div>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nama Lengkap <span className="text-rose-400">*</span></span>
            </label>
            <input
              type="text"
              value={formData.nama_lengkap}
              onChange={(e) => handleChange('nama_lengkap', e.target.value)}
              placeholder="Masukkan nama lengkap..."
              className="
                w-full px-4 py-2.5 rounded-xl border border-slate-800
                bg-slate-950 text-white text-sm font-semibold
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
              "
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* NIP / NIS */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>NIP / NIS Dokter Kecil <span className="text-rose-400">*</span></span>
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => handleChange('nip', e.target.value)}
                placeholder="NIP atau NIS..."
                className="
                  w-full px-4 py-2.5 rounded-xl border border-slate-800
                  bg-slate-950 text-white font-mono text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                "
                required
              />
            </div>

            {/* No Telepon */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>No. Telepon / WA</span>
              </label>
              <input
                type="text"
                value={formData.no_telepon}
                onChange={(e) => handleChange('no_telepon', e.target.value)}
                placeholder="0812..."
                className="
                  w-full px-4 py-2.5 rounded-xl border border-slate-800
                  bg-slate-950 text-white font-mono text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                "
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Username <span className="text-rose-400">*</span></span>
              </span>
              {formData.username.length > 0 && (
                <span className={`text-[10px] font-bold font-mono ${isUsernameValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUsernameValid ? '✓ Valid' : '✗ Tidak valid'}
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              onFocus={() => setUsernameActive(true)}
              onBlur={() => setUsernameActive(false)}
              placeholder="contoh: budi_santoso"
              maxLength={20}
              className={`
                w-full px-4 py-2.5 rounded-xl border
                bg-slate-950 text-white font-mono text-sm
                focus:outline-none focus:ring-2 focus:border-emerald-500
                transition-all duration-200
                ${formData.username.length > 0
                  ? isUsernameValid
                    ? 'border-emerald-600 focus:ring-emerald-500/30'
                    : 'border-rose-700 focus:ring-rose-500/30'
                  : 'border-slate-800 focus:ring-emerald-500/30'
                }
              `}
              required
              autoComplete="username"
            />

            {/* Panduan aturan username — tampil saat fokus atau ada isian */}
            {(usernameActive || formData.username.length > 0) && (
              <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aturan Username</p>
                {USERNAME_RULES.map((rule, i) => {
                  const passed = formData.username.length > 0 && rule.check(formData.username)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      {passed
                        ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        : <XCircle className="w-3 h-3 text-slate-600 flex-shrink-0" />
                      }
                      <span className={`text-[11px] ${passed ? 'text-emerald-300' : 'text-slate-500'}`}>
                        {rule.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kata Sandi <span className="text-rose-400">*</span></span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Buat kata sandi..."
                  className="
                    w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-800
                    bg-slate-950 text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                  "
                  required
                  autoComplete="new-password"
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

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Konfirmasi Sandi <span className="text-rose-400">*</span></span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Ulangi kata sandi..."
                className={`
                  w-full px-4 py-2.5 rounded-xl border
                  bg-slate-950 text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                  ${formData.confirmPassword.length > 0
                    ? formData.password === formData.confirmPassword
                      ? 'border-emerald-600'
                      : 'border-rose-700'
                    : 'border-slate-800'
                  }
                `}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isUsernameValid}
            className="
              w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400
              text-white font-extrabold text-sm uppercase tracking-wide
              shadow-xl shadow-emerald-950/50 transition-all duration-200 cursor-pointer border border-emerald-400/30
              flex items-center justify-center gap-2 mt-4
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Memproses...' : 'Daftar Akun Baru'}</span>
          </button>
        </form>

        {/* Link to Login */}
        <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
          Sudah memiliki akun?{' '}
          <Link to="/login" className="text-emerald-400 font-bold hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  )
}
