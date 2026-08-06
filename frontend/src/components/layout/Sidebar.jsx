import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardPlus,
  History,
  Users,
  Info,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pendaftaran', icon: ClipboardPlus, label: 'Pendaftaran Kunjungan' },
  { path: '/riwayat', icon: History, label: 'Riwayat Kunjungan' },
  { path: '/siswa', icon: Users, label: 'Data Siswa' },
  { path: '/pengaturan', icon: Info, label: 'Info' }

]

// Breakpoint 'lg' Tailwind (harus sama dengan breakpoint yang dipakai di className lg:hidden / lg:block)
const MOBILE_BREAKPOINT = 1024

export default function Sidebar({ open, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Sidebar hanya boleh auto-close saat di layar mobile (overlay).
  // Di desktop, klik menu tidak boleh men-collapse sidebar.
  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT) {
      onClose()
    }
  }

  const sidebarInner = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">

      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-200">
        <h1 className="text-sm font-bold text-slate-900 leading-snug">
          Sistem Pendataan Kunjungan UKS
        </h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition no-underline select-none
                ${active
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer Logout */}
      <div className="px-3 py-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar (slide in/out) */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-[270px]
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarInner}
      </aside>

      {/* Desktop Sidebar (collapse/expand) */}
      <aside
        className={`
          hidden lg:block shrink-0 h-screen sticky top-0
          transition-all duration-300 ease-out overflow-hidden
          ${open ? 'w-[260px]' : 'w-0'}
        `}
      >
        <div className="w-[260px] h-full">
          {sidebarInner}
        </div>
      </aside>
    </>
  )
}