import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [siswaList, setSiswaList] = useState([])
  const [kunjunganList, setKunjunganList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Ambil data dari server. Dipanggil saat login DAN setelah setiap mutasi,
  // supaya state selalu memakai id asli dari MySQL (bukan Date.now()).
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, k] = await Promise.all([api.siswa.getAll(), api.kunjungan.getAll()])
      setSiswaList(Array.isArray(s?.data) ? s.data : [])
      setKunjunganList(Array.isArray(k?.data) ? k.data : [])
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Data yang tampil mungkin tidak terbaru.')
      console.error('Gagal memuat data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Data kesehatan siswa HANYA diambil setelah login. Selain alasan keamanan,
  // memanggil API tanpa token akan ditolak 401 oleh server.
  useEffect(() => {
    let dibatalkan = false

    async function muat() {
      if (!isAuthenticated) {
        // Bersihkan sisa data milik sesi sebelumnya.
        setSiswaList([])
        setKunjunganList([])
        setLoading(false)
        setError(null)
        return
      }
      if (!dibatalkan) await refresh()
    }

    muat()
    return () => {
      dibatalkan = true
    }
  }, [isAuthenticated, refresh])

  // Fungsi mutasi sengaja TANPA try/catch: error harus mengalir ke halaman
  // pemanggil supaya bisa ditampilkan sebagai toast merah ke petugas.
  const addSiswa = async (data) => {
    const res = await api.siswa.create(data)
    await refresh()
    return res.data
  }

  const updateSiswa = async (id, data) => {
    await api.siswa.update(id, data)
    await refresh()
  }

  const deleteSiswa = async (id) => {
    await api.siswa.delete(id)
    await refresh()
  }

  const addKunjungan = async (data) => {
    const res = await api.kunjungan.create(data)
    await refresh()
    return res.data
  }

  const updateKunjungan = async (id, data) => {
    await api.kunjungan.update(id, data)
    await refresh()
  }

  const deleteKunjungan = async (id) => {
    await api.kunjungan.delete(id)
    await refresh()
  }

  return (
    <DataContext.Provider
      value={{
        siswaList,
        kunjunganList,
        loading,
        error,
        refresh,
        addSiswa,
        updateSiswa,
        deleteSiswa,
        addKunjungan,
        updateKunjungan,
        deleteKunjungan
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within DataProvider')
  return context
}
