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
import LaporanAnalitik from './pages/LaporanAnalitik'
import Pengaturan from './pages/Pengaturan'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
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
              {/* Public Login & Register Routes */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
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
                <Route path="laporan" element={<LaporanAnalitik />} />
                <Route path="pengaturan" element={<Pengaturan />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  )
}