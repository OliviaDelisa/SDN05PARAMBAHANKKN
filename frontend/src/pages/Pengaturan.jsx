import { useState, useEffect } from 'react'
import {
  User,
  Building2,
  GraduationCap,
  Loader2,
  Pill,
  Stethoscope,
  CheckCircle2
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { useAuth } from '../context/AuthContext'
import { getInitials, getInitialColor } from '../utils/formatters'
import { api } from '../utils/api'
import { dataSekolah as fallbackSekolah } from '../data/mockData'

// Data statis fasilitas & obat-obatan yang tersedia di UKS.
// Silakan sesuaikan daftar ini dengan kondisi UKS sekolah yang sebenarnya.
const DAFTAR_OBAT = [
  'Betadine (antiseptik luka)',
  'Minyak kayu putih',
  'Paracetamol (penurun demam & pereda nyeri)',
  'Oralit (rehidrasi saat diare/dehidrasi)',
  'Plester & kassa steril',
  'Alkohol 70% / kapas alkohol',
  'Balsem / minyak angin',
  'Tolak angin / minyak telon'
]

const DAFTAR_FASILITAS = [
  'Tempat tidur periksa',
  'Kotak P3K lengkap',
  'Timbangan badan',
  'Termometer',
  'Tensimeter (alat ukur tekanan darah)',
  'Tandu',
  'Selimut',
  'Wastafel cuci tangan'
]

export default function Pengaturan() {
  const { user, updateUser } = useAuth()

  // Profil dokcil bersifat read-only (data sudah dibuat di awal, tidak bisa diedit di sini)
  const [petugas, setPetugas] = useState({
    nama_lengkap: user?.nama_lengkap || '',
    kelas: user?.kelas || '',
    nis: user?.nis || ''
  })

  // Data sekolah juga read-only (informasi identitas sekolah untuk kop laporan)
  const [sekolah, setSekolah] = useState({
    ...fallbackSekolah,
    kepala_sekolah: 'Muswar Dedi, S.Pd.',
    kepala_nip: '10301599'
  })

  const [loadingData, setLoadingData] = useState(true)

  // Ambil data terkini dari API saat halaman dibuka
  useEffect(() => {
    async function fetchData() {
      setLoadingData(true)
      try {
        const res = await api.get('/pengaturan')
        if (res?.success && res.data) {
          // Update profil dokcil dari DB (prioritaskan data DB, fallback ke session)
          if (res.data.petugas && res.data.petugas.id) {
            const fetched = {
              nama_lengkap: res.data.petugas.nama_lengkap || user?.nama_lengkap || '',
              kelas: res.data.petugas.kelas || user?.kelas || '',
              nis: res.data.petugas.nis || user?.nis || ''
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
        // Fallback ke data yang sudah ada — tidak perlu tampilkan error
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  const initial = getInitials(petugas.nama_lengkap)
  const avatarBg = getInitialColor(petugas.nama_lengkap)

  return (
    <div className="space-y-6">
      <PageHeader title="" />

      {/* Section 1: Fasilitas & Obat-obatan UKS */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Fasilitas & Obat-obatan UKS
            </h3>
            <p className="text-xs text-slate-400">
              Daftar obat-obatan dan fasilitas yang tersedia di ruang UKS.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Obat-obatan */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>Obat-obatan</span>
            </div>
            <ul className="space-y-2">
              {DAFTAR_OBAT.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fasilitas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Fasilitas</span>
            </div>
            <ul className="space-y-2">
              {DAFTAR_FASILITAS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Grid 2 kolom: Profil Dokcil & Data Sekolah bersebelahan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Section 2: Profil Dokcil (read-only) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Profil Dokcil
              </h3>
              <p className="text-xs text-slate-400">
                Data diri dokter kecil (dokcil) yang sedang login.
              </p>
            </div>
          </div>

          {/* Avatar preview */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0"
              style={{ backgroundColor: avatarBg }}
            >
              {loadingData ? <Loader2 className="w-6 h-6 animate-spin" /> : initial}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                {loadingData ? 'Memuat...' : petugas.nama_lengkap || '—'}
              </h4>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {petugas.kelas && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                    Kelas {petugas.kelas}
                  </span>
                )}
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-slate-500 text-[11px] font-mono border border-slate-200">
                  NIS: {petugas.nis || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Data ditampilkan sebagai info read-only, bukan form edit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <span className="font-bold text-slate-500">Nama Lengkap</span>
              <p className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                {petugas.nama_lengkap || '—'}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-500 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                Kelas
              </span>
              <p className="text-sm font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                {petugas.kelas || '—'}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-500">NIS (Nomor Induk Siswa)</span>
              <p className="text-sm font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                {petugas.nis || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Data Sekolah (read-only) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Data Identitas Sekolah
              </h3>
              <p className="text-xs text-slate-400">
                Informasi identitas sekolah yang dicetak pada kepala surat laporan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <span className="font-bold text-slate-500">Nama Sekolah</span>
              <p className="text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                {sekolah.nama_sekolah || '—'}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-500">NPSN</span>
              <p className="text-sm font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                {sekolah.npsn || '—'}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-500">No. Telepon Sekolah</span>
              <p className="text-sm font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                {sekolah.telepon_sekolah || '—'}
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <span className="font-bold text-slate-500">Kepala Sekolah</span>
              <p className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                {sekolah.kepala_sekolah || '—'}
                {sekolah.kepala_nip && (
                  <span className="block text-[11px] font-mono font-normal text-slate-400 mt-0.5">
                    NIP: {sekolah.kepala_nip}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <span className="font-bold text-slate-500">Alamat Lengkap Sekolah</span>
              <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                {sekolah.alamat || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}