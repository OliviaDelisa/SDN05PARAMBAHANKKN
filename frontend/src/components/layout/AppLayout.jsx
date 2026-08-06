import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useData } from '../../context/DataContext'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { error, refresh, loading } = useData()

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        {/* Peringatan koneksi. Petugas harus tahu kalau data yang tampil
            mungkin tidak mencerminkan isi database. */}
        {error && (
          <div className="shrink-0 bg-red-50 border-b border-red-200 px-4 sm:px-6 lg:px-10 py-3 no-print">
            <div className="flex items-center gap-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Memuat...' : 'Coba lagi'}</span>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className={`
            mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10 transition-all duration-300
            ${sidebarOpen ? 'max-w-[1400px]' : 'max-w-[1800px]'}
          `}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}