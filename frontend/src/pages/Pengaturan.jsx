import { useState, useEffect } from 'react'
import {
  User,
  Building2,
  Save,
  AtSign,
  Building,
  Loader2
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { useToast } from '../components/common/Toast'
import { useAuth } from '../context/AuthContext'
import { getInitials, getInitialColor } from '../utils/formatters'
import { api } from '../utils/api'
import { dataSekolah as fallbackSekolah } from '../data/mockData'

export default function Pengaturan() {
  const toast = useToast()
  const { user, updateUser } = useAuth()

  // Inisialisasi profil dari data user yang sedang login
  const [petugas, setPetugas] = useState({
    nama_lengkap: user?.nama_lengkap || '',
    username: user?.username || '',
    nip: user?.nip || '',
    no_telepon: user?.no_telepon || '',
    role: user?.role || ''
  })

  const [sekolah, setSekolah] = useState(fallbackSekolah)
  const [loadingPetugas, setLoadingPetugas] = useState(false)
  const [loadingSekolah, setLoadingSekolah] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Ambil data terkini dari API saat halaman dibuka
  useEffect(() => {
    async function fetchData() {
      setLoadingData(true)
      try {
        const res = await api.get('/pengaturan')
        if (res?.success && res.data) {
          // Update profil petugas dari DB (prioritaskan data DB, fallback ke session)
          if (res.data.petugas && res.data.petugas.id) {
            const fetched = {
              nama_lengkap: res.data.petugas.nama_lengkap || user?.nama_lengkap || '',
              username: res.data.petugas.username || user?.username || '',
              nip: res.data.petugas.nip || user?.nip || '',
              no_telepon: res.data.petugas.no_telepon || user?.no_telepon || '',
              role: res.data.petugas.role || user?.role || ''
            }
            setPetugas(fetched)
            updateUser(fetched)
          }
          // Update data sekolah dari DB
          if (res.data.sekolah && res.data.sekolah.id) {
            setSekolah(res.data.sekolah)
          }
        }
      } catch (err) {
        // Fallback ke data session yang sudah ada — tidak perlu tampilkan error
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  const handleSavePetugas = async (e) => {
    e.preventDefault()
    setLoadingPetugas(true)
    try {
      const res = await api.put('/pengaturan/petugas', {
        nama_lengkap: petugas.nama_lengkap,
        username: petugas.username,
        nip: petugas.nip,
        no_telepon: petugas.no_telepon
      })
      // Update AuthContext & Session Storage secara reaktif
      if (res?.data) {
        updateUser(res.data)
      } else {
        updateUser(petugas)
      }
      toast.success('Profil petugas UKS berhasil diperbarui!')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan profil petugas.')
    } finally {
      setLoadingPetugas(false)
    }
  }

  const handleSaveSekolah = async (e) => {
    e.preventDefault()
    setLoadingSekolah(true)
    try {
      await api.put('/pengaturan/sekolah', sekolah)
      toast.success('Data sekolah berhasil diperbarui!')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data sekolah.')
    } finally {
      setLoadingSekolah(false)
    }
  }

  const initial = getInitials(petugas.nama_lengkap)
  const avatarBg = getInitialColor(petugas.nama_lengkap)

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader title="Pengaturan Sistem & Akun" />

      {/* Section 1: Profil Petugas UKS */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white">
              Profil Akun Saya
            </h3>
            <p className="text-xs text-slate-400">
              Informasi akun yang sedang login. Perubahan langsung tersimpan ke database.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePetugas} className="space-y-6">
          {/* Avatar preview */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0"
              style={{ backgroundColor: avatarBg }}
            >
              {loadingData ? <Loader2 className="w-6 h-6 animate-spin" /> : initial}
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {loadingData ? 'Memuat...' : petugas.nama_lengkap || '—'}
              </h4>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">{petugas.role || 'Petugas UKS'}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                  NIP: {petugas.nip || '—'}
                </span>
                {petugas.username && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 text-[11px] font-mono border border-emerald-800">
                    @{petugas.username}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-300">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={petugas.nama_lengkap}
                onChange={(e) => setPetugas({ ...petugas, nama_lengkap: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300">NIP (Nomor Induk Pegawai)</label>
              <input
                type="text"
                value={petugas.nip}
                onChange={(e) => setPetugas({ ...petugas, nip: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-emerald-400" />
                Username Login
              </label>
              <input
                type="text"
                value={petugas.username}
                onChange={(e) => setPetugas({ ...petugas, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="contoh: siti_rahmawati"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              <p className="text-[10px] text-slate-500">Huruf kecil, angka, underscore. Min 4, max 20 karakter.</p>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300">No. Telepon / WhatsApp</label>
              <input
                type="text"
                value={petugas.no_telepon}
                onChange={(e) => setPetugas({ ...petugas, no_telepon: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loadingPetugas}
              className="
                px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400
                text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 transition-all duration-200
                flex items-center gap-2 cursor-pointer border border-emerald-400/30
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loadingPetugas
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />
              }
              <span>{loadingPetugas ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Data Sekolah */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white">
              Data Identitas Sekolah
            </h3>
            <p className="text-xs text-slate-400">
              Informasi identitas sekolah yang dicetak pada kepala surat laporan.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSekolah} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-2 sm:col-span-2">
              <label className="font-bold text-slate-300">Nama Sekolah</label>
              <input
                type="text"
                value={sekolah.nama_sekolah}
                onChange={(e) => setSekolah({ ...sekolah, nama_sekolah: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300">NPSN (Nomor Pokok Sekolah Nasional)</label>
              <input
                type="text"
                value={sekolah.npsn}
                onChange={(e) => setSekolah({ ...sekolah, npsn: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300">No. Telepon Sekolah</label>
              <input
                type="text"
                value={sekolah.telepon_sekolah}
                onChange={(e) => setSekolah({ ...sekolah, telepon_sekolah: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="font-bold text-slate-300">Nama Kepala Sekolah & Gelar</label>
              <input
                type="text"
                value={sekolah.kepala_sekolah}
                onChange={(e) => setSekolah({ ...sekolah, kepala_sekolah: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="font-bold text-slate-300">Alamat Lengkap Sekolah</label>
              <textarea
                rows={3}
                value={sekolah.alamat}
                onChange={(e) => setSekolah({ ...sekolah, alamat: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loadingSekolah}
              className="
                px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700
                text-white font-extrabold text-xs shadow-lg transition-all duration-200
                flex items-center gap-2 cursor-pointer border border-slate-700
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loadingSekolah
                ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                : <Save className="w-4 h-4 text-emerald-400" />
              }
              <span>{loadingSekolah ? 'Menyimpan...' : 'Simpan Data Sekolah'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
