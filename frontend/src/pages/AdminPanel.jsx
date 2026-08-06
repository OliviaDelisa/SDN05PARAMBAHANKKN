import { Link } from 'react-router-dom'
import { Users, Building2, UserCog, ShieldCheck, ArrowRight } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

const BAGIAN = [
  {
    path: '/admin/siswa',
    icon: Users,
    judul: 'Kelola Data Siswa',
    ringkasan: 'Tambah, ubah, dan hapus data induk siswa.',
    catatan: 'Petugas hanya bisa melihat dan menambah.'
  },
  {
    path: '/admin/sekolah',
    icon: Building2,
    judul: 'Identitas Sekolah',
    ringkasan: 'Nama sekolah, NPSN, kepala sekolah, dan alamat.',
    catatan: 'Data ini tercetak di kop surat setiap laporan.'
  },
  {
    path: '/admin/akun',
    icon: UserCog,
    judul: 'Manajemen Akun',
    ringkasan: 'Buat akun baru, atur peran, dan reset password.',
    catatan: 'Pendaftaran mandiri sudah ditutup — akun hanya dibuat di sini.'
  }
]

export default function AdminPanel() {
  const { user } = useAuth()
  const { siswaList, kunjunganList } = useData()

  return (
    <div className="space-y-6">
      <PageHeader title="" />

      {/* Sambutan + penjelasan singkat apa yang membedakan halaman ini */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">
              Panel Admin
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Halaman ini memisahkan pengelolaan sistem dari pekerjaan harian di UKS.
              Anda masuk sebagai{' '}
              <span className="font-semibold text-emerald-700">{user?.nama_lengkap}</span>{' '}
              dengan peran <span className="font-semibold text-emerald-700">Admin</span>.
            </p>
          </div>
        </div>

        {/* Ringkasan angka — sekadar orientasi, bukan statistik lengkap */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[11px] font-bold text-slate-500">Siswa Terdaftar</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{siswaList.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[11px] font-bold text-slate-500">Rekam Kunjungan</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{kunjunganList.length}</p>
          </div>
        </div>
      </div>

      {/* Navigasi ke tiap bagian */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BAGIAN.map((b) => {
          const Icon = b.icon
          return (
            <Link
              key={b.path}
              to={b.path}
              className="
                group rounded-2xl bg-white border border-slate-200 p-6
                hover:border-emerald-300 hover:shadow-sm
                transition no-underline flex flex-col
              "
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>

              <h4 className="text-sm font-bold text-slate-900 mt-4">
                {b.judul}
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed flex-1">
                {b.ringkasan}
              </p>
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                {b.catatan}
              </p>

              <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-slate-100 text-emerald-700 text-xs font-semibold">
                <span>Buka</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
