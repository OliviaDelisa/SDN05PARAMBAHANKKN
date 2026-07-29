import { useState } from 'react'
import {
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Save,
  X
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import SearchAutocomplete from '../components/common/SearchAutocomplete'
import TagSelector from '../components/common/TagSelector'
import DatePicker from '../components/common/DatePicker'
import CustomSelect from '../components/common/CustomSelect'
import { useToast } from '../components/common/Toast'
import { siswaList, keluhanOptions, tindakanOptions, statusOptions } from '../data/mockData'
import { getInitials, getInitialColor } from '../utils/formatters'

export default function PendaftaranKunjungan() {
  const toast = useToast()

  // Form State
  const [selectedSiswa, setSelectedSiswa] = useState(null)
  const [waktuMasuk, setWaktuMasuk] = useState(() => {
    const now = new Date()
    const tzoffset = now.getTimezoneOffset() * 60000
    return new Date(Date.now() - tzoffset).toISOString().slice(0, 16)
  })
  const [selectedKeluhan, setSelectedKeluhan] = useState([])
  const [keterangan, setKeterangan] = useState('')
  const [isDarurat, setIsDarurat] = useState(false)
  const [selectedTindakan, setSelectedTindakan] = useState([])
  const [status, setStatus] = useState('Istirahat di UKS')

  // Success State
  const [successData, setSuccessData] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!selectedSiswa) {
      toast.error('Silakan cari dan pilih siswa terlebih dahulu!')
      return
    }

    if (selectedKeluhan.length === 0 && !keterangan) {
      toast.error('Pilih minimal satu keluhan atau isi keterangan!')
      return
    }

    const newRecord = {
      id: Date.now(),
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

    setSuccessData(newRecord)
    toast.success(`Kunjungan ${selectedSiswa.nama} berhasil disimpan!`)
  }

  const handleReset = () => {
    setSelectedSiswa(null)
    setSelectedKeluhan([])
    setKeterangan('')
    setIsDarurat(false)
    setSelectedTindakan([])
    setStatus('Istirahat di UKS')
    setSuccessData(null)
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Pendaftaran Kunjungan Sakit" />

      {/* Success Notification Banner */}
      {successData && (
        <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl animate-modal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-900/50">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Kunjungan {successData.siswa_nama} berhasil disimpan!
              </h3>
              <p className="text-xs text-emerald-300 mt-1 leading-relaxed">
                Keluhan: <span className="font-bold text-white">{successData.keluhan_utama}</span> · Status: <span className="font-bold text-white">{successData.status}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="
              px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40
              text-emerald-300 font-bold text-xs transition-all duration-200
              flex items-center gap-2 shrink-0 shadow-md cursor-pointer
            "
          >
            <RotateCcw className="w-4 h-4" />
            <span>Daftar Kunjungan Baru</span>
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step 1: Cari & Info Siswa (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Cari Siswa */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center justify-center font-display">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-white">
                  Cari Data Siswa
                </h3>
                <p className="text-[11px] text-slate-400">
                  Ketik nama atau NIS siswa untuk pencarian cepat.
                </p>
              </div>
            </div>

            <SearchAutocomplete
              items={siswaList}
              onSelect={(siswa) => setSelectedSiswa(siswa)}
              placeholder="Cari nama atau NIS (contoh: Jihan / 20241005)..."
            />
          </div>

          {/* Student Info Card (Selected) */}
          {selectedSiswa ? (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 p-6 space-y-5 shadow-2xl animate-modal-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
                    style={{ backgroundColor: getInitialColor(selectedSiswa.nama) }}
                  >
                    {getInitials(selectedSiswa.nama)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-display text-white">
                      {selectedSiswa.nama}
                    </h3>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-extrabold border border-emerald-500/30 mt-1">
                      Kelas {selectedSiswa.kelas}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSiswa(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
                  title="Batalkan pilihan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">NIS</span>
                  <span className="font-bold text-white font-mono">{selectedSiswa.nis}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Jenis Kelamin</span>
                  <span className="font-bold text-white">{selectedSiswa.jenis_kelamin}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Nama Wali</span>
                  <span className="font-bold text-white">{selectedSiswa.nama_wali || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">No. Telepon Wali</span>
                  <span className="font-bold text-white font-mono">{selectedSiswa.telepon_wali || '-'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-10 text-center text-slate-500 text-xs">
              <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-400" />
              Pilih siswa terlebih dahulu untuk mengisi form kunjungan
            </div>
          )}
        </div>

        {/* Step 2: Form Kunjungan (7 Cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center justify-center font-display">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-white">
                  Form Kunjungan & Keluhan
                </h3>
                <p className="text-[11px] text-slate-400">
                  Isi detail keluhan & penanganan{selectedSiswa ? ` untuk ${selectedSiswa.nama}` : ''}
                </p>
              </div>
            </div>

            {/* Fitur Kalender untuk Waktu Masuk */}
            <DatePicker
              value={waktuMasuk}
              onChange={setWaktuMasuk}
              label="Waktu Masuk (Fitur Kalender)"
            />

            {/* Keluhan Utama (Tag Selector) */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-300">
                Keluhan Utama <span className="text-rose-400">*</span>
              </label>
              <TagSelector
                options={keluhanOptions}
                selected={selectedKeluhan}
                onChange={setSelectedKeluhan}
                multiple={true}
              />
            </div>

            {/* Catatan / Keterangan tambahan */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">
                Catatan / Keterangan Tambahan
              </label>
              <textarea
                rows={3}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan tambahan (misal: suhu tubuh 38.5°C, belum sarapan, dll)..."
                className="
                  w-full px-4 py-3 rounded-xl border border-slate-800
                  bg-slate-950/80 text-sm text-white placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                "
              />
            </div>

            {/* Emergency Checkbox */}
            <div
              onClick={() => setIsDarurat(!isDarurat)}
              className={`
                p-4 rounded-xl border cursor-pointer select-none transition-all duration-200
                flex items-center gap-3
                ${isDarurat
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/40'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }
              `}
            >
              <input
                type="checkbox"
                checked={isDarurat}
                onChange={() => {}}
                className="w-4 h-4 text-rose-600 rounded border-slate-700 focus:ring-rose-500 bg-slate-900"
              />
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className={`w-4 h-4 ${isDarurat ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
                <span className={isDarurat ? 'text-rose-300 font-extrabold' : ''}>
                  Tandai sebagai KASUS DARURAT
                </span>
              </div>
            </div>

            {/* Tindakan / Terapi */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-300">
                Tindakan / Terapi
              </label>
              <TagSelector
                options={tindakanOptions}
                selected={selectedTindakan}
                onChange={setSelectedTindakan}
                multiple={true}
              />
            </div>

            {/* Status Akhir (CustomSelect) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Status Akhir <span className="text-rose-400">*</span>
              </label>
              <CustomSelect
                options={statusOptions}
                value={status}
                onChange={setStatus}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
              <button
                type="submit"
                className="
                  flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400
                  text-white font-extrabold text-sm shadow-xl shadow-emerald-950/50 transition-all duration-200
                  flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30
                "
              >
                <Save className="w-4 h-4" />
                <span>Simpan Data Kunjungan</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="
                  px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700
                  text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-slate-700
                "
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
