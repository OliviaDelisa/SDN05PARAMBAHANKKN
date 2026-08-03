import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}