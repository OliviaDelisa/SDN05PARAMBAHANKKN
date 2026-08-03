import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getInitials, getInitialColor } from '../../utils/formatters'

// Judul & subjudul per halaman, disesuaikan dengan path menu di Sidebar
const pageInfo = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Statistik & ringkasan kunjungan hari ini'
  },
  '/pendaftaran': {
    title: 'Pendaftaran Kunjungan',
    subtitle: 'Input data siswa yang berkunjung ke UKS'
  },
  '/riwayat': {
    title: 'Riwayat Kunjungan',
    subtitle: 'Daftar seluruh kunjungan yang tercatat'
  },
  '/siswa': {
    title: 'Data Siswa',
    subtitle: 'Kelola data siswa terdaftar'
  },
  '/laporan': {
    title: 'Laporan & Analitik',
    subtitle: 'Rekap dan grafik kunjungan UKS'
  },
  '/pengaturan': {
    title: 'Pengaturan',
    subtitle: 'Profil petugas & data sekolah'
  }
}

function getPageInfo(pathname) {
  if (pageInfo[pathname]) return pageInfo[pathname]
  const matched = Object.keys(pageInfo).find(
    (path) => path !== '/' && pathname.startsWith(path)
  )
  return matched ? pageInfo[matched] : { title: 'Dashboard', subtitle: '' }
}

export default function Topbar({ onToggleSidebar }) {
  const location = useLocation()
  const { user } = useAuth()

  const { title, subtitle } = getPageInfo(location.pathname)

  const initial = getInitials(user?.nama_lengkap || 'Petugas UKS')
  const avatarBg = getInitialColor(user?.nama_lengkap || 'Petugas UKS')

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shrink-0"
          aria-label="Buka/tutup menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400 leading-tight mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-slate-800 leading-tight">
            {user?.nama_lengkap || 'Petugas UKS'}
          </p>
          <p className="text-[11px] text-slate-400 leading-tight">
            {user?.role || 'Admin'}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: avatarBg }}
        >
          {initial}
        </div>
      </div>
    </header>
  )
}