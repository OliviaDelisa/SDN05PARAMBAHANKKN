import { useState } from 'react'
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Save,
  X
} from 'lucide-react'
import SearchAutocomplete from '../components/common/SearchAutocomplete'
import TagSelector from '../components/common/TagSelector'
import DatePicker from '../components/common/DatePicker'
import CustomSelect from '../components/common/CustomSelect'
import { useToast } from '../components/common/Toast'
import { useData } from '../context/DataContext'
import { keluhanOptions, tindakanOptions, statusOptions } from '../data/mockData'
import { getInitials, getInitialColor, waktuLokalSekarang } from '../utils/formatters'

function getDefaultWaktuMasuk() {
  const now = new Date()
  const tzoffset = now.getTimezoneOffset() * 60000
  return new Date(Date.now() - tzoffset).toISOString().slice(0, 16)
}

export default function PendaftaranKunjungan() {
  const toast = useToast()
  const { siswaList, addKunjungan } = useData()

  // Form State
  const [selectedSiswa, setSelectedSiswa] = useState(null)
  const [waktuMasuk, setWaktuMasuk] = useState(() => waktuLokalSekarang())
  const [selectedKeluhan, setSelectedKeluhan] = useState([])
  const [keterangan, setKeterangan] = useState('')
  const [isDarurat, setIsDarurat] = useState(false)
  const [selectedTindakan, setSelectedTindakan] = useState([])
  const [status, setStatus] = useState('Istirahat di UKS')

  // Kunci dipakai untuk paksa SearchAutocomplete (dan komponen lain yang
  // menyimpan state internal sendiri) reset total setelah form dikosongkan
  const [formKey, setFormKey] = useState(0)

  // Success State
  const [successData, setSuccessData] = useState(null)
  const [saving, setSaving] = useState(false)

  // Mengosongkan semua field form (tidak menyentuh successData)
  const clearForm = () => {
    setSelectedSiswa(null)
    setWaktuMasuk(getDefaultWaktuMasuk())
    setSelectedKeluhan([])
    setKeterangan('')
    setIsDarurat(false)
    setSelectedTindakan([])
    setStatus('Istirahat di UKS')
    setFormKey((k) => k + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()


    if (saving) return

    if (!selectedSiswa) {
      toast.error('Silakan cari dan pilih siswa terlebih dahulu!')
      return
    }

    if (selectedKeluhan.length === 0 && !keterangan) {
      toast.error('Pilih minimal satu keluhan atau isi keterangan!')
      return
    }

    // id TIDAK dibuat di klien — MySQL yang menentukan lewat AUTO_INCREMENT
    const newRecord = {
      siswa_id: selectedSiswa.id,
      siswa_nama: selectedSiswa.nama,
      siswa_nis: selectedSiswa.nis,
      kelas: selectedSiswa.kelas,
      waktu_masuk: waktuMasuk,
      keluhan_utama: selectedKeluhan.join(', ') || keterangan,
      keterangan,
      is_darurat: isDarurat,
      tindakan: selectedTindakan.join(', '),
      status
    }


    setSaving(true)
    try {
      const tersimpan = await addKunjungan(newRecord)
      setSuccessData(tersimpan || newRecord)
      toast.success(`Kunjungan ${selectedSiswa.nama} berhasil disimpan!`)
    } catch (err) {
      toast.error(`Gagal menyimpan kunjungan: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    clearForm()
    setSuccessData(null)
  }

  return (
    <div className="space-y-5">

      {/* Success Notification Banner */}
      {successData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Kunjungan {successData.siswa_nama} berhasil disimpan
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {successData.keluhan_utama} · {successData.status}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessData(null)}
            className="px-3 py-2 rounded-lg bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-medium text-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kunjungan Baru</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" key={formKey}>

        {/* Kolom kiri: form utama */}
        <div className="lg:col-span-2 space-y-5">

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500">
              Cari Siswa
            </label>
            <SearchAutocomplete
              items={siswaList}
              onSelect={(siswa) => setSelectedSiswa(siswa)}
              placeholder="Cari nama atau NIS..."
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                Waktu Masuk
              </label>
              <DatePicker
                value={waktuMasuk}
                onChange={setWaktuMasuk}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                Keluhan Utama <span className="text-red-500">*</span>
              </label>
              <TagSelector
                options={keluhanOptions}
                selected={selectedKeluhan}
                onChange={setSelectedKeluhan}
                multiple={true}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                Catatan Tambahan
              </label>
              <textarea
                rows={3}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Misal: suhu tubuh 38.5°C, belum sarapan..."
                className="
                  w-full px-3 py-2.5 rounded-lg border border-slate-200
                  bg-white text-sm text-slate-800 placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400
                "
              />
            </div>

            <label className={`
              flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer select-none transition-colors
              ${isDarurat ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}
            `}>
              <input
                type="checkbox"
                checked={isDarurat}
                onChange={(e) => setIsDarurat(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-400"
              />
              <AlertTriangle className={`w-4 h-4 ${isDarurat ? 'text-red-500' : 'text-slate-400'}`} />
              <span className={`text-xs font-medium ${isDarurat ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                Tandai sebagai kasus darurat
              </span>
            </label>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">
                Tindakan / Terapi
              </label>
              <TagSelector
                options={tindakanOptions}
                selected={selectedTindakan}
                onChange={setSelectedTindakan}
                multiple={true}
              />
            </div>

            <div className="space-y-2 max-w-xs">
              <label className="text-xs font-semibold text-slate-500">
                Status Akhir <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                options={statusOptions}
                value={status}
                onChange={setStatus}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="
                  flex-1 py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700
                  text-white font-semibold text-sm transition-colors
                  flex items-center justify-center gap-2
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Kolom kanan: ringkasan siswa & kunjungan, mengisi ruang kosong */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Ringkasan
            </h3>

            {selectedSiswa ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: getInitialColor(selectedSiswa.nama) }}
                >
                  {getInitials(selectedSiswa.nama)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {selectedSiswa.nama}
                  </p>
                  <p className="text-xs text-slate-500">
                    Kelas {selectedSiswa.kelas} · NIS {selectedSiswa.nis}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSiswa(null)}
                  className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                  title="Batalkan pilihan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <UserCheck className="w-6 h-6 opacity-40" />
                Belum ada siswa dipilih
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Keluhan</span>
                <span className="text-slate-700 font-medium text-right max-w-[60%] truncate">
                  {selectedKeluhan.length > 0 ? selectedKeluhan.join(', ') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tindakan</span>
                <span className="text-slate-700 font-medium text-right max-w-[60%] truncate">
                  {selectedTindakan.length > 0 ? selectedTindakan.join(', ') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-slate-700 font-medium">{status}</span>
              </div>
              {isDarurat && (
                <div className="flex items-center gap-1.5 text-red-600 font-semibold pt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Kasus Darurat</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}