import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardPlus,
  History,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Heart,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getInitials, getInitialColor } from '../../utils/formatters'

const menuItems = [
  {
    path: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
    subtitle: 'Ringkasan & statistik harian'
  },
  {
    path: '/pendaftaran',
    icon: ClipboardPlus,
    label: 'Pendaftaran Kunjungan',
    subtitle: 'Input cepat siswa sakit'
  },
  {
    path: '/riwayat',
    icon: History,
    label: 'Riwayat Kunjungan',
    subtitle: 'Buku tamu & log digital'
  },
  {
    path: '/siswa',
    icon: Users,
    label: 'Data Siswa',
    subtitle: 'Database lengkap siswa'
  },
  {
    path: '/laporan',
    icon: BarChart3,
    label: 'Laporan & Analitik',
    subtitle: 'Grafik & rekap kesehatan'
  },
  {
    path: '/pengaturan',
    icon: Settings,
    label: 'Pengaturan',
    subtitle: 'Profil & data sekolah'
  }
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = getInitials(user?.nama_lengkap || 'Petugas UKS')
  const avatarBg = getInitialColor(user?.nama_lengkap || 'Petugas UKS')

  const sidebarInner = (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/60 shadow-2xl relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="p-6 pb-4 relative z-10 flex items-center gap-3.5 border-b border-slate-800/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400/20" strokeWidth={2.5} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-white leading-tight font-display tracking-tight">
              UKS Digital
            </h1>
            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              SDN 05
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5 font-medium">
            Buku Kunjungan SD
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-3.5 py-4 space-y-6 overflow-y-auto relative z-10">
        <div>
          <div className="px-3 pb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
              MENU UTAMA
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    group relative flex items-center gap-3 px-3.5 py-3 rounded-xl
                    transition-all duration-200 text-sm no-underline select-none
                    ${active
                      ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-lg shadow-emerald-900/30 border border-emerald-400/30'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent'
                    }
                  `}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-glow" />
                  )}

                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200
                    ${active
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-900 text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
                    }
                  `}>
                    <Icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`text-[13px] font-bold leading-tight ${active ? 'text-white' : ''}`}>
                      {item.label}
                    </div>
                    <div className={`text-[11px] leading-tight mt-0.5 truncate ${active ? 'text-emerald-100/80' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </div>
                  </div>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* UKS Status Info Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-950/80 border border-emerald-500/20 shadow-inner">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Status UKS Hari Ini</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Sistem UKS Digital siap mencatat kunjungan siswa.
          </p>
        </div>
      </div>

      {/* Footer User Profile */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-900/80 border border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md"
              style={{ backgroundColor: avatarBg }}
            >
              {initial}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-white truncate leading-tight">
              {user?.nama_lengkap || 'Ibu Siti Rahmawati'}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium truncate">
              {user?.role || 'Petugas UKS Utama'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-800"
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5 text-emerald-400" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-[270px]
          transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 z-50"
          aria-label="Tutup menu"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarInner}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 min-h-screen sticky top-0 h-screen">
        {sidebarInner}
      </aside>
    </>
  )
}
