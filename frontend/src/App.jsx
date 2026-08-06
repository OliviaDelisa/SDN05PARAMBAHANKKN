import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/common/Toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import AppLayout from './components/layout/AppLayout'

// Pages
import Dashboard from './pages/Dashboard'
import PendaftaranKunjungan from './pages/PendaftaranKunjungan'
import RiwayatKunjungan from './pages/RiwayatKunjungan'
import DataSiswa from './pages/DataSiswa'
import Pengaturan from './pages/Pengaturan'
import Login from './pages/Login'

// Halaman admin
import AdminPanel from './pages/AdminPanel'
import AdminDataSiswa from './pages/AdminDataSiswa'
import AdminSekolah from './pages/AdminSekolah'
import AdminAkun from './pages/AdminAkun'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

/**
 * Penjaga rute admin.
 *
 * Ini HANYA untuk kenyamanan tampilan — supaya petugas tidak sampai ke
 * halaman yang tombolnya akan ditolak server. Penegakan sebenarnya ada di
 * requireRole('Admin') di sisi server; penjaga di klien bisa dilewati
 * dengan satu baris di DevTools.
 */
function AdminRoute({ children }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'Admin') return <Navigate to="/" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              {/* Login — satu-satunya halaman publik. Pendaftaran mandiri
                  sudah ditutup; akun dibuat admin lewat Panel Admin. */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="pendaftaran" element={<PendaftaranKunjungan />} />
                <Route path="riwayat" element={<RiwayatKunjungan />} />
                <Route path="siswa" element={<DataSiswa />} />
                <Route path="pengaturan" element={<Pengaturan />} />

                {/* Panel admin — bersarang di AppLayout supaya sidebar dan
                    topbar tetap konsisten dengan halaman lain. */}
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/siswa"
                  element={
                    <AdminRoute>
                      <AdminDataSiswa />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/sekolah"
                  element={
                    <AdminRoute>
                      <AdminSekolah />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/akun"
                  element={
                    <AdminRoute>
                      <AdminAkun />
                    </AdminRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
