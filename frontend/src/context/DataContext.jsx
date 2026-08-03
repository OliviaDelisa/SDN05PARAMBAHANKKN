import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'

const DataContext = createContext(null)

const STORAGE_KEYS = {
  SISWA: 'uks_siswa_data_clean',
  KUNJUNGAN: 'uks_kunjungan_data_clean'
}

export function DataProvider({ children }) {
  // Clear any old legacy mock data from browser localStorage completely
  useEffect(() => {
    try {
      localStorage.removeItem('uks_siswa_data')
      localStorage.removeItem('uks_kunjungan_data')
      localStorage.removeItem('uks_siswa_data_v2')
      localStorage.removeItem('uks_kunjungan_data_v2')
    } catch (e) {}
  }, [])

  // Start with 100% empty state [] so user MUST add students & visits first
  const [siswaList, setSiswaList] = useState([])
  const [kunjunganList, setKunjunganList] = useState([])

  // Sync with Express REST API backend on mount
  useEffect(() => {
    async function syncWithBackend() {
      try {
        if (api && api.siswa && typeof api.siswa.getAll === 'function') {
          const siswaRes = await api.siswa.getAll()
          if (siswaRes && Array.isArray(siswaRes.data)) {
            setSiswaList(siswaRes.data)
            localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(siswaRes.data))
          } else {
            setSiswaList([])
            localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify([]))
          }
        }

        if (api && api.kunjungan && typeof api.kunjungan.getAll === 'function') {
          const kunjunganRes = await api.kunjungan.getAll()
          if (kunjunganRes && Array.isArray(kunjunganRes.data)) {
            setKunjunganList(kunjunganRes.data)
            localStorage.setItem(STORAGE_KEYS.KUNJUNGAN, JSON.stringify(kunjunganRes.data))
          } else {
            setKunjunganList([])
            localStorage.setItem(STORAGE_KEYS.KUNJUNGAN, JSON.stringify([]))
          }
        }
      } catch (err) {
        console.log('Backend API offline or empty data state')
      }
    }

    syncWithBackend()
  }, [])

  // Sync state updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(siswaList))
    } catch (e) {}
  }, [siswaList])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.KUNJUNGAN, JSON.stringify(kunjunganList))
    } catch (e) {}
  }, [kunjunganList])

  // Actions for Siswa
  const addSiswa = async (siswaData) => {
    const newSiswa = {
      id: siswaData.id || Date.now(),
      ...siswaData
    }

    setSiswaList((prev) => [newSiswa, ...prev])

    try {
      if (api && api.siswa) await api.siswa.create(newSiswa)
    } catch (err) {
      // Saved in local state
    }

    return newSiswa
  }

  const updateSiswa = async (id, updatedData) => {
    setSiswaList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s))
    )

    try {
      if (api && api.siswa) await api.siswa.update(id, updatedData)
    } catch (err) {
      // Updated in local state
    }
  }

  const deleteSiswa = async (id) => {
    setSiswaList((prev) => prev.filter((s) => s.id !== id))

    try {
      if (api && api.siswa) await api.siswa.delete(id)
    } catch (err) {
      // Removed from local state
    }
  }

  // Actions for Kunjungan
  const addKunjungan = async (kunjunganData) => {
    const newKunjungan = {
      id: kunjunganData.id || Date.now(),
      ...kunjunganData
    }

    setKunjunganList((prev) => [newKunjungan, ...prev])

    try {
      if (api && api.kunjungan) await api.kunjungan.create(newKunjungan)
    } catch (err) {
      // Saved in local state
    }

    return newKunjungan
  }

  const deleteKunjungan = async (id) => {
    setKunjunganList((prev) => prev.filter((k) => k.id !== id))

    try {
      if (api && api.kunjungan) await api.kunjungan.delete(id)
    } catch (err) {
      // Removed from local state
    }
  }

  return (
    <DataContext.Provider
      value={{
        siswaList,
        kunjunganList,
        addSiswa,
        updateSiswa,
        deleteSiswa,
        addKunjungan,
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
