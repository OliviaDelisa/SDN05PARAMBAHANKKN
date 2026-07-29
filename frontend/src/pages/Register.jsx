import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Heart, Lock, User, Mail, Phone, Shield, Eye, EyeOff, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/common/Toast'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const toast = useToast()

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nip: '',
    email: '',
    no_telepon: '',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.email.toLowerCase().endsWith('@sdn05parambahan.id')) {
      toast.error('Email harus menggunakan domain resmi sekolah (@sdn05parambahan.id)!')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok!')
      return
    }

    setLoading(true)

    try {
      register(formData)
      toast.success('Pendaftaran akun berhasil! Selamat datang di UKS Digital.')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Pendaftaran akun gagal!')
    } finally {
      setLoading(false)
    }
  }

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
              onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
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
            {/* NIP Pegawai atau NIS Dokter Kecil */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>NIP Pegawai / NIS Dokter Kecil <span className="text-rose-400">*</span></span>
              </label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, no_telepon: e.target.value })}
                placeholder="0812..."
                className="
                  w-full px-4 py-2.5 rounded-xl border border-slate-800
                  bg-slate-950 text-white font-mono text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                "
              />
            </div>
          </div>

          {/* Email Sekolah (@sdn05parambahan.id) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Email Resmi Sekolah <span className="text-rose-400">*</span></span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Wajib @sdn05parambahan.id</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="nama@sdn05parambahan.id"
              className="
                w-full px-4 py-2.5 rounded-xl border border-slate-800
                bg-slate-950 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
              "
              required
            />
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Buat kata sandi..."
                  className="
                    w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-800
                    bg-slate-950 text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                  "
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

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Konfirmasi Sandi <span className="text-rose-400">*</span></span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Ulangi kata sandi..."
                className="
                  w-full px-4 py-2.5 rounded-xl border border-slate-800
                  bg-slate-950 text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                "
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400
              text-white font-extrabold text-sm uppercase tracking-wide
              shadow-xl shadow-emerald-950/50 transition-all duration-200 cursor-pointer border border-emerald-400/30
              flex items-center justify-center gap-2 mt-4
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
