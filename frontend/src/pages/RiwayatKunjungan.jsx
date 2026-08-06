import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Eye,
  Pencil,
  Printer,
  AlertTriangle,
  Clock,
  LogOut,
  HeartPulse,
  Stethoscope,
  CheckCircle2,
  FileSpreadsheet,
  CalendarRange,
  Save,
  Loader2,
  X
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import DataTable from '../components/common/DataTable'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import CustomSelect from '../components/common/CustomSelect'
import TagSelector from '../components/common/TagSelector'
import PrintReportTemplate from '../components/common/PrintReportTemplate'
import { kelasOptions, statusOptions, keluhanOptions, tindakanOptions, dataSekolah } from '../data/mockData'
import {
  formatTanggal,
  formatTanggalWaktu,
  getInitials,
  getInitialColor,
  getStatusVariant as statusVariant,
  waktuLokalSekarang,
  keInputDatetime,
  tanggalLokal
} from '../utils/formatters'
import { useToast } from '../components/common/Toast'
import { useData } from '../context/DataContext'
import { api } from '../utils/api'

export default function RiwayatKunjungan() {
  const toast = useToast()
  const { kunjunganList, updateKunjungan } = useData()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKelas, setFilterKelas] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDarurat, setFilterDarurat] = useState(false)
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalAkhir, setTanggalAkhir] = useState('')
  const [showPrintTemplate, setShowPrintTemplate] = useState(false)

  // Selected visit for modal detail
  const [selectedVisit, setSelectedVisit] = useState(null)

  // Edit & tutup kunjungan
  const [editForm, setEditForm] = useState(null)
  const [menyimpanEdit, setMenyimpanEdit] = useState(false)
  const [menyimpanId, setMenyimpanId] = useState(null)

  // Identitas sekolah untuk kop surat laporan — diambil dari database,
  // bukan nilai statis, supaya perubahan di Pengaturan ikut tercetak.
  const [sekolah, setSekolah] = useState(dataSekolah)

  useEffect(() => {
    let dibatalkan = false
    api
      .get('/pengaturan')
      .then((res) => {
        if (!dibatalkan && res?.data?.sekolah?.id) setSekolah(res.data.sekolah)
      })
      .catch(() => {
        // Kop surat memakai nilai bawaan — bukan kegagalan yang menghalangi
      })
    return () => {
      dibatalkan = true
    }
  }, [])

  // Options formatted for CustomSelect
  const kelasSelectOptions = [
    { value: '', label: 'Semua Kelas' },
    ...kelasOptions.map((k) => ({ value: k, label: `Kelas ${k}` }))
  ]

  const statusSelectOptions = [
    { value: '', label: 'Semua Status Penanganan' },
    ...statusOptions.map((s) => ({ value: s, label: s }))
  ]

  const hasDateFilter = Boolean(tanggalMulai || tanggalAkhir)

  // Filter logic
  const filteredData = kunjunganList.filter((k) => {
    const q = searchQuery.toLowerCase()
    const matchSearch =
      !searchQuery ||
      k.siswa_nama?.toLowerCase().includes(q) ||
      k.siswa_nis?.includes(q) ||
      k.keluhan_utama?.toLowerCase().includes(q)

    const matchKelas = !filterKelas || k.kelas === filterKelas
    const matchStatus = !filterStatus || k.status === filterStatus
    const matchDarurat = !filterDarurat || k.is_darurat

    // Date range filter (based on waktu_masuk)
    let matchTanggal = true
    if (hasDateFilter && k.waktu_masuk) {
      const waktu = new Date(k.waktu_masuk)

      if (tanggalMulai) {
        const mulai = new Date(tanggalMulai)
        mulai.setHours(0, 0, 0, 0)
        if (waktu < mulai) matchTanggal = false
      }

      if (tanggalAkhir) {
        const akhir = new Date(tanggalAkhir)
        akhir.setHours(23, 59, 59, 999)
        if (waktu > akhir) matchTanggal = false
      }
    }

    return matchSearch && matchKelas && matchStatus && matchDarurat && matchTanggal
  })

  // Label periode dinamis untuk laporan cetak (mengikuti rentang tanggal yang dipilih)
  const periodeLabel = useMemo(() => {
    if (tanggalMulai && tanggalAkhir) {
      return `${formatTanggal(tanggalMulai)} - ${formatTanggal(tanggalAkhir)}`
    }
    if (tanggalMulai) {
      return `Sejak ${formatTanggal(tanggalMulai)}`
    }
    if (tanggalAkhir) {
      return `Sampai ${formatTanggal(tanggalAkhir)}`
    }
    return 'Seluruh Periode'
  }, [tanggalMulai, tanggalAkhir])

  const handleResetTanggal = () => {
    setTanggalMulai('')
    setTanggalAkhir('')
  }

  const getStatusVariant = (status) => statusVariant(status)

  // Ekspor CSV.
  // Tiga hal yang harus benar supaya file terbuka rapi di Excel Indonesia:
  //   1. Kutip di dalam data digandakan ("") — kalau tidak, kolom bergeser.
  //   2. BOM UTF-8 di awal — tanpa itu "°C" terbaca "Â°C".
  //   3. Pemisah titik koma — Excel dengan locale Indonesia memakai ini.
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diekspor.')
      return
    }

    const escape = (nilai) => {
      const teks = nilai === null || nilai === undefined ? '' : String(nilai)
      return `"${teks.replace(/"/g, '""')}"`
    }

    const headers = ['ID', 'NIS', 'Nama Siswa', 'Kelas', 'Waktu Masuk', 'Waktu Keluar', 'Keluhan', 'Tindakan', 'Status', 'Darurat']
    const rows = filteredData.map((k) => [
      k.id,
      k.siswa_nis,
      k.siswa_nama,
      k.kelas,
      formatTanggalWaktu(k.waktu_masuk),
      k.waktu_keluar ? formatTanggalWaktu(k.waktu_keluar) : '-',
      k.keluhan_utama,
      k.tindakan || '-',
      k.status,
      k.is_darurat ? 'Ya' : 'Tidak'
    ])

    const isi = [headers, ...rows].map((baris) => baris.map(escape).join(';')).join('\r\n')

    // Excel membaca berkas sebagai ANSI kalau tidak diawali BOM UTF-8,
    // sehingga "°C" tampil menjadi "Â°C". BOM ditulis lewat fromCharCode
    // supaya tidak ada karakter tak terlihat di dalam kode sumber.
    // Blob dipakai agar tidak terkena batas panjang URL, dan agar karakter
    // '#' tidak memotong berkas seperti yang terjadi pada encodeURI.
    const bomUtf8 = String.fromCharCode(0xfeff)
    const blob = new Blob([bomUtf8 + isi], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `riwayat_kunjungan_uks_${tanggalLokal(new Date())}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`${filteredData.length} baris riwayat berhasil diunduh (CSV).`)
  }

  // Tutup kunjungan: isi waktu_keluar dan tandai siswa kembali ke kelas.
  // Sebelum ada endpoint PUT, kolom waktu_keluar mustahil terisi.
  const handleSelesai = async (row) => {
    if (menyimpanId) return
    setMenyimpanId(row.id)
    try {
      await updateKunjungan(row.id, {
        ...row,
        waktu_keluar: waktuLokalSekarang(),
        status: 'Kembali ke Kelas'
      })
      toast.success(`${row.siswa_nama} ditandai selesai dan kembali ke kelas.`)
    } catch (err) {
      toast.error(`Gagal menutup kunjungan: ${err.message}`)
    } finally {
      setMenyimpanId(null)
    }
  }

  const bukaEdit = (row) => {
    setEditForm({
      id: row.id,
      siswa_nama: row.siswa_nama,
      siswa_nis: row.siswa_nis,
      kelas: row.kelas,
      waktu_masuk: keInputDatetime(row.waktu_masuk),
      waktu_keluar: keInputDatetime(row.waktu_keluar),
      keluhan_utama: row.keluhan_utama || '',
      keterangan: row.keterangan || '',
      is_darurat: Boolean(row.is_darurat),
      tindakan: row.tindakan || '',
      status: row.status
    })
  }

  const handleSimpanEdit = async (e) => {
    e.preventDefault()
    if (menyimpanEdit || !editForm) return

    if (!editForm.keluhan_utama.trim()) {
      toast.error('Keluhan utama wajib diisi!')
      return
    }

    setMenyimpanEdit(true)
    try {
      const { id, ...data } = editForm
      await updateKunjungan(id, data)
      toast.success('Rekam kunjungan berhasil diperbarui.')
      setEditForm(null)
    } catch (err) {
      toast.error(`Gagal memperbarui kunjungan: ${err.message}`)
    } finally {
      setMenyimpanEdit(false)
    }
  }

  const columns = [
    {
      key: 'waktu_masuk',
      label: 'Waktu',
      width: '150px',
      render: (val) => (
        <span className="font-mono text-xs text-slate-500">
          {formatTanggalWaktu(val)}
        </span>
      )
    },
    {
      key: 'siswa_nama',
      label: 'Nama Siswa',
      render: (_, row) => {
        const color = getInitialColor(row.siswa_nama)
        const initial = getInitials(row.siswa_nama)
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
            <div>
              <div className="font-bold text-slate-900">
                {row.siswa_nama}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">NIS: {row.siswa_nis}</div>
              {row.is_darurat && (
                <span className="inline-block mt-1 text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                  DARURAT
                </span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'kelas',
      label: 'Kelas',
      width: '80px',
      render: (val) => (
        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-xs">
          Kelas {val}
        </span>
      )
    },
    {
      key: 'keluhan_utama',
      label: 'Keluhan Utama',
      render: (val) => <span className="font-semibold text-slate-700">{val}</span>
    },
    {
      key: 'tindakan',
      label: 'Tindakan / Terapi',
      render: (val) => <span className="text-slate-500 text-xs">{val || '-'}</span>
    },
    {
      key: 'status',
      label: 'Status Akhir',
      width: '150px',
      render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge>
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '160px',
      render: (_, row) => {
        const masihDiUKS = row.status === 'Istirahat di UKS'
        const sedangProses = menyimpanId === row.id

        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedVisit(row)
              }}
              className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-500 transition-all duration-200"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                bukaEdit(row)
              }}
              className="p-2 rounded-lg bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-500 transition-all duration-200"
              title="Ubah Rekam Kunjungan"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {masihDiUKS && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelesai(row)
                }}
                disabled={sedangProses}
                className="
                  inline-flex items-center gap-1 px-2 py-2 rounded-lg
                  bg-emerald-50 hover:bg-emerald-600 hover:text-white
                  text-emerald-700 border border-emerald-200
                  text-[10px] font-bold transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
                title="Tandai selesai & catat waktu keluar"
              >
                {sedangProses
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <LogOut className="w-3.5 h-3.5" />
                }
                <span>Selesai</span>
              </button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="">
        <div className="flex items-center gap-3 no-print">
          <button
            onClick={handleExportCSV}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-white border border-slate-200 hover:bg-slate-50 text-slate-700
              font-semibold text-xs transition-colors cursor-pointer
            "
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => setShowPrintTemplate(!showPrintTemplate)}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-emerald-600 hover:bg-emerald-700 text-white
              font-semibold text-xs transition-colors cursor-pointer
            "
          >
            <Printer className="w-4 h-4" />
            <span>{showPrintTemplate ? 'Tutup Format Cetak' : 'Cetak / Unduh PDF'}</span>
          </button>
        </div>
      </PageHeader>

      {/* Toggle Printable PDF Document View */}
      {showPrintTemplate && (
        <PrintReportTemplate
          title="LAPORAN REKAPITULASI RIWAYAT KUNJUNGAN UKS"
          periodeLabel={periodeLabel}
          dataKunjungan={filteredData}
          sekolah={sekolah}
          kepalaSekolah={sekolah.kepala_sekolah}
          kepalaNip={sekolah.kepala_nip}
        />
      )}

      <div className="space-y-8 no-print">
        {/* Filter Panel */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search query */}
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIS, atau keluhan..."
                className="
                  w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200
                  bg-white text-xs text-slate-800 placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400
                "
              />
            </div>

            {/* Filter Kelas (CustomSelect) */}
            <div className="lg:col-span-2">
              <CustomSelect
                options={kelasSelectOptions}
                value={filterKelas}
                onChange={setFilterKelas}
                placeholder="Semua Kelas"
              />
            </div>

            {/* Filter Status (CustomSelect) */}
            <div className="lg:col-span-3">
              <CustomSelect
                options={statusSelectOptions}
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="Semua Status"
              />
            </div>

            {/* Rentang Tanggal */}
            <div className="lg:col-span-3 relative flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                max={tanggalAkhir || undefined}
                className="
                  w-full min-w-0 px-2.5 py-2.5 rounded-lg border border-slate-200
                  bg-white text-[11px] text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400
                "
              />
              <span className="text-slate-300 shrink-0">–</span>
              <input
                type="date"
                value={tanggalAkhir}
                onChange={(e) => setTanggalAkhir(e.target.value)}
                min={tanggalMulai || undefined}
                className="
                  w-full min-w-0 px-2.5 py-2.5 rounded-lg border border-slate-200
                  bg-white text-[11px] text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400
                "
              />
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleResetTanggal}
                  title="Hapus filter tanggal"
                  className="
                    absolute -right-2 -top-2 w-5 h-5 rounded-full
                    bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-600
                    flex items-center justify-center transition-colors cursor-pointer
                  "
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Second Filter Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={filterDarurat}
                onChange={(e) => setFilterDarurat(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-400"
              />
              <AlertTriangle className={`w-3.5 h-3.5 ${filterDarurat ? 'text-red-500' : 'text-slate-400'}`} />
              <span>Hanya tampilkan KASUS DARURAT</span>
            </label>

            <span className="text-slate-500 font-medium">
              Menampilkan <strong className="text-slate-800">{filteredData.length}</strong> dari {kunjunganList.length} kunjungan
            </span>
          </div>
        </div>

        {/* Main Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedVisit(row)}
          emptyMessage="Tidak ada riwayat kunjungan yang sesuai dengan filter."
        />
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        title="Detail Rekam Kunjungan Siswa"
        size="md"
      >
        {selectedVisit && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0"
                style={{ backgroundColor: getInitialColor(selectedVisit.siswa_nama) }}
              >
                {getInitials(selectedVisit.siswa_nama)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-display text-slate-900 truncate">
                    {selectedVisit.siswa_nama}
                  </h3>
                  {selectedVisit.is_darurat && (
                    <Badge variant="danger">DARURAT</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  NIS: <span className="font-mono font-bold text-slate-700">{selectedVisit.siswa_nis}</span> · Kelas: <span className="font-bold text-emerald-700">Kelas {selectedVisit.kelas}</span>
                </p>
              </div>
            </div>

            {/* Visit Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Waktu Masuk
                </span>
                <p className="font-mono font-bold text-slate-800 text-sm">
                  {formatTanggalWaktu(selectedVisit.waktu_masuk)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5 text-emerald-600" />
                  Waktu Keluar
                </span>
                <p className="font-mono font-bold text-slate-800 text-sm">
                  {selectedVisit.waktu_keluar
                    ? formatTanggalWaktu(selectedVisit.waktu_keluar)
                    : <span className="text-amber-600 font-sans text-xs">Masih di UKS</span>}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Status Penanganan
                </span>
                <div>
                  <Badge variant={getStatusVariant(selectedVisit.status)}>
                    {selectedVisit.status}
                  </Badge>
                </div>
              </div>

              <div className="col-span-2 space-y-1 pt-3 border-t border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                  Keluhan Utama
                </span>
                <p className="font-bold text-slate-800 text-sm bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  {selectedVisit.keluhan_utama}
                </p>
              </div>

              {selectedVisit.keterangan && selectedVisit.keterangan !== selectedVisit.keluhan_utama && (
                <div className="col-span-2 space-y-1">
                  <span className="text-slate-500 font-medium">Catatan / Keterangan</span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 italic">
                    "{selectedVisit.keterangan}"
                  </p>
                </div>
              )}

              <div className="col-span-2 space-y-1 pt-3 border-t border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                  Tindakan Diberikan
                </span>
                <p className="font-semibold text-slate-700 text-sm">
                  {selectedVisit.tindakan || 'Tidak ada tindakan khusus'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-between gap-3">
              <button
                onClick={() => {
                  bukaEdit(selectedVisit)
                  setSelectedVisit(null)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Ubah Rekam</span>
              </button>
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Ubah Rekam Kunjungan */}
      <Modal
        isOpen={!!editForm}
        onClose={() => setEditForm(null)}
        title="Ubah Rekam Kunjungan"
        size="md"
      >
        {editForm && (
          <form onSubmit={handleSimpanEdit} className="space-y-5 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800 text-sm">{editForm.siswa_nama}</p>
              <p className="text-slate-500 mt-0.5">
                NIS: <span className="font-mono">{editForm.siswa_nis}</span> · Kelas {editForm.kelas}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Waktu Masuk</label>
                <input
                  type="datetime-local"
                  value={editForm.waktu_masuk}
                  onChange={(e) => setEditForm({ ...editForm, waktu_masuk: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Waktu Keluar</label>
                <input
                  type="datetime-local"
                  value={editForm.waktu_keluar}
                  min={editForm.waktu_masuk || undefined}
                  onChange={(e) => setEditForm({ ...editForm, waktu_keluar: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                />
                <p className="text-[10px] text-slate-400">Kosongkan bila siswa masih berada di UKS.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">
                Keluhan Utama <span className="text-red-500">*</span>
              </label>
              <TagSelector
                options={keluhanOptions}
                selected={editForm.keluhan_utama ? editForm.keluhan_utama.split(', ').filter(Boolean) : []}
                onChange={(vals) => setEditForm({ ...editForm, keluhan_utama: vals.join(', ') })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">Tindakan / Terapi</label>
              <TagSelector
                options={tindakanOptions}
                selected={editForm.tindakan ? editForm.tindakan.split(', ').filter(Boolean) : []}
                onChange={(vals) => setEditForm({ ...editForm, tindakan: vals.join(', ') })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600">Catatan / Keterangan</label>
              <textarea
                rows={2}
                value={editForm.keterangan}
                onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Status Akhir</label>
                <CustomSelect
                  options={statusOptions}
                  value={editForm.status}
                  onChange={(val) => setEditForm({ ...editForm, status: val })}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-600 pb-2.5">
                <input
                  type="checkbox"
                  checked={editForm.is_darurat}
                  onChange={(e) => setEditForm({ ...editForm, is_darurat: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-400"
                />
                <AlertTriangle className={`w-3.5 h-3.5 ${editForm.is_darurat ? 'text-red-500' : 'text-slate-400'}`} />
                <span>Tandai sebagai kasus DARURAT</span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditForm(null)}
                className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={menyimpanEdit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {menyimpanEdit
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />
                }
                <span>{menyimpanEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}