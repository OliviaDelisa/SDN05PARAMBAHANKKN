import { useState } from 'react'
import {
  User,
  Building2,
  Save,
  ShieldCheck,
  Building
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { petugasUks as initialPetugas, dataSekolah as initialSekolah } from '../data/mockData'
import { useToast } from '../components/common/Toast'
import { getInitials, getInitialColor } from '../utils/formatters'

export default function Pengaturan() {
  const toast = useToast()

  const [petugas, setPetugas] = useState(initialPetugas)
  const [sekolah, setSekolah] = useState(initialSekolah)

  const handleSavePetugas = (e) => {
    e.preventDefault()
    toast.success('Profil petugas UKS berhasil diperbarui!')
  }

  const handleSaveSekolah = (e) => {
    e.preventDefault()
    toast.success('Data sekolah berhasil diperbarui!')
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
              Profil Petugas UKS Utama
            </h3>
            <p className="text-xs text-slate-400">
              Kelola informasi identitas dan kontak petugas yang bertugas.
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
              {initial}
            </div>
            <div>
              <h4 className="text-base font-bold text-white">{petugas.nama_lengkap}</h4>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">Petugas UKS Utama</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono mt-1 border border-slate-700">
                NIP: {petugas.nip}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-300">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={petugas.nama_lengkap}
                onChange={(e) => setPetugas({ ...petugas, nama_lengkap: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300">NIP (Nomor Induk Pegawai)</label>
              <input
                type="text"
                value={petugas.nip}
                onChange={(e) => setPetugas({ ...petugas, nip: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300">Email Utama</label>
              <input
                type="email"
                value={petugas.email}
                onChange={(e) => setPetugas({ ...petugas, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300">No. Telepon / WhatsApp</label>
              <input
                type="text"
                value={petugas.no_telepon}
                onChange={(e) => setPetugas({ ...petugas, no_telepon: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-white text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="
                px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400
                text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 transition-all duration-200 flex items-center gap-2 cursor-pointer border border-emerald-400/30
              "
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil Petugas</span>
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
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-base font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300">NPSN (Nomor Pokok Sekolah Nasional)</label>
              <input
                type="text"
                value={sekolah.npsn}
                onChange={(e) => setSekolah({ ...sekolah, npsn: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300">No. Telepon Sekolah</label>
              <input
                type="text"
                value={sekolah.telepon_sekolah}
                onChange={(e) => setSekolah({ ...sekolah, telepon_sekolah: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-white text-sm"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="font-bold text-slate-300">Nama Kepala Sekolah & Gelar</label>
              <input
                type="text"
                value={sekolah.kepala_sekolah}
                onChange={(e) => setSekolah({ ...sekolah, kepala_sekolah: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm font-semibold"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="font-bold text-slate-300">Alamat Lengkap Sekolah</label>
              <textarea
                rows={3}
                value={sekolah.alamat}
                onChange={(e) => setSekolah({ ...sekolah, alamat: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="
                px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700
                text-white font-extrabold text-xs shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer border border-slate-700
              "
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Simpan Data Sekolah</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
